import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LiveStudentProgress } from '@/types/cbt';
import {
  saveLiveProgressToDb,
  fetchLiveProgressFromDb,
  deleteLiveProgressFromDb,
  checkAndConsumeUnlockFromDb,
} from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROGRESS_FILE = path.join(DATA_DIR, 'cbt-progress-db.json');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

declare global {
  // eslint-disable-next-line no-var
  var __cbtLiveProgressMap: Map<string, LiveStudentProgress> | undefined;
}

function getProgressMap(): Map<string, LiveStudentProgress> {
  if (!globalThis.__cbtLiveProgressMap) {
    globalThis.__cbtLiveProgressMap = new Map();

    // Read from disk on initial boot if not serverless
    if (!isServerless) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (fs.existsSync(PROGRESS_FILE)) {
          const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: LiveStudentProgress) => {
              if (item && item.scheduleId && item.studentId) {
                const key = `${item.scheduleId}:::${item.studentId}`;
                globalThis.__cbtLiveProgressMap?.set(key, item);
              }
            });
          }
        }
      } catch (err) {
        console.warn('[ProgressAPI] Could not load persisted progress file:', err);
      }
    }
  }
  return globalThis.__cbtLiveProgressMap;
}

function persistProgress(): void {
  if (isServerless) return;
  try {
    const map = getProgressMap();
    const arrayData = Array.from(map.values());
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(arrayData, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal fallback
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('scheduleId');
    const checkStudent = searchParams.get('checkStudent');
    const map = getProgressMap();

    // Fast check status lock untuk polling client saat sedang terkunci
    if (checkStudent && scheduleId) {
      const inMem = map.get(`${scheduleId}:::${checkStudent}`);
      if (inMem && inMem.forceUnlock === true) {
        inMem.forceUnlock = false;
        inMem.isLocked = false;
        inMem.lockRemainingSeconds = 0;
        inMem.status = 'MENGERJAKAN';
        return NextResponse.json({
          success: true,
          forceUnlock: true,
          isLocked: false,
          lockRemainingSeconds: 0,
        });
      }

      // Periksa dari Supabase (lintas kontainer cloud Vercel)
      const dbUnlocked = await checkAndConsumeUnlockFromDb(scheduleId, checkStudent);
      if (dbUnlocked) {
        if (inMem) {
          inMem.isLocked = false;
          inMem.forceUnlock = false;
          inMem.lockRemainingSeconds = 0;
          inMem.status = 'MENGERJAKAN';
        }
        return NextResponse.json({
          success: true,
          forceUnlock: true,
          isLocked: false,
          lockRemainingSeconds: 0,
        });
      }

      return NextResponse.json({
        success: true,
        forceUnlock: false,
        isLocked: inMem ? Boolean(inMem.isLocked) : false,
        lockRemainingSeconds: inMem ? inMem.lockRemainingSeconds : 0,
      });
    }

    // 1. Ambil dari memory local
    const combinedMap = new Map<string, LiveStudentProgress>();
    map.forEach((item) => {
      if (!scheduleId || item.scheduleId === scheduleId) {
        combinedMap.set(item.studentId, item);
      }
    });

    // 2. Ambil dari Supabase (sumber data bersama antar seluruh serverless container Vercel)
    if (scheduleId) {
      try {
        const dbStudents = await fetchLiveProgressFromDb(scheduleId);
        dbStudents.forEach((dbItem) => {
          const existing = combinedMap.get(dbItem.studentId);
          if (!existing) {
            combinedMap.set(dbItem.studentId, dbItem);
            map.set(`${scheduleId}:::${dbItem.studentId}`, dbItem);
          } else {
            // Gabungkan status: jika sudah submit di DB, tetapkan SELESAI
            if (dbItem.status === 'SELESAI') {
              existing.status = 'SELESAI';
              if (dbItem.totalQuestions > 0) existing.answeredCount = dbItem.totalQuestions;
              existing.remainingSeconds = 0;
              existing.isLocked = false;
            } else if (new Date(dbItem.lastActive).getTime() > new Date(existing.lastActive).getTime()) {
              const merged = { ...existing, ...dbItem };
              combinedMap.set(dbItem.studentId, merged);
              map.set(`${scheduleId}:::${dbItem.studentId}`, merged);
            }
          }
        });
      } catch (err) {
        console.warn('[ProgressAPI] Supabase live fetch warning:', err);
      }
    }

    // Eksklusikan siswa yang sudah SELESAI agar tidak mengotori live monitoring
    let list = Array.from(combinedMap.values()).filter((s) => s.status !== 'SELESAI');

    // Backfill totalQuestions jika ada record yang belum ada totalQuestions
    const knownTotal = list.find((s) => s.totalQuestions > 0)?.totalQuestions || 18;
    list.forEach((s) => {
      if (!s.totalQuestions || s.totalQuestions === 0) {
        s.totalQuestions = knownTotal;
      }
    });

    // Sort: locked first (needs attention), then active
    list.sort((a, b) => {
      if (a.isLocked && !b.isLocked) return -1;
      if (!a.isLocked && b.isLocked) return 1;
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });

    const activeCount = list.filter((s) => s.status === 'MENGERJAKAN' && !s.isLocked).length;
    const lockedCount = list.filter((s) => s.isLocked || s.status === 'TERKUNCI').length;
    const submittedCount = 0; // Siswa selesai dieksklusikan dari live monitor

    const totalStudents = list.length;
    const totalProgressPct = list.reduce((sum, s) => {
      const pct = s.totalQuestions > 0 ? (s.answeredCount / s.totalQuestions) * 100 : 0;
      return sum + pct;
    }, 0);
    const avgProgress = totalStudents > 0 ? Math.round(totalProgressPct / totalStudents) : 0;

    return NextResponse.json({
      success: true,
      students: list,
      totalStudents,
      activeCount,
      lockedCount,
      submittedCount,
      avgProgress,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal memuat data progress siswa.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is an unlock action triggered by teacher
    if (body.action === 'unlock') {
      const { scheduleId, studentId } = body;
      if (!scheduleId || !studentId) {
        return NextResponse.json(
          { success: false, message: 'scheduleId dan studentId diperlukan untuk unlock.' },
          { status: 400 }
        );
      }

      const map = getProgressMap();
      const key = `${scheduleId}:::${studentId}`;
      const existing = map.get(key);

      const unlockedItem: LiveStudentProgress = existing
        ? {
            ...existing,
            isLocked: false,
            lockRemainingSeconds: 0,
            status: 'MENGERJAKAN',
            forceUnlock: true,
            lastActive: new Date().toISOString(),
          }
        : {
            scheduleId,
            studentId,
            studentName: studentId,
            kelas: '-',
            nisn: '-',
            totalQuestions: 0,
            answeredCount: 0,
            currentQuestionIndex: 0,
            remainingSeconds: 3600,
            violationsCount: 0,
            isLocked: false,
            lockRemainingSeconds: 0,
            status: 'MENGERJAKAN',
            forceUnlock: true,
            lastActive: new Date().toISOString(),
          };

      map.set(key, unlockedItem);
      persistProgress();

      // Sinkronkan unlock ke Supabase
      try {
        await saveLiveProgressToDb(unlockedItem);
      } catch {
        // non-fatal
      }

      return NextResponse.json({
        success: true,
        message: `Kunci ujian untuk siswa ${unlockedItem.studentName} berhasil dibuka oleh guru!`,
        student: unlockedItem,
      });
    }

    // Check if this is a delete action triggered by teacher (to clear test users)
    if (body.action === 'delete') {
      const { scheduleId, studentId } = body;
      if (!scheduleId || !studentId) {
        return NextResponse.json(
          { success: false, message: 'scheduleId dan studentId diperlukan untuk menghapus.' },
          { status: 400 }
        );
      }

      const map = getProgressMap();
      const key = `${scheduleId}:::${studentId}`;
      map.delete(key);
      persistProgress();

      // Hapus juga dari Supabase
      try {
        await deleteLiveProgressFromDb(scheduleId, studentId);
      } catch {
        // non-fatal
      }

      return NextResponse.json({
        success: true,
        message: 'Data siswa testing / salah masuk berhasil dihapus dari live monitoring.',
      });
    }

    // Normal heartbeat update from student exam portal
    const {
      scheduleId,
      studentId,
      studentName,
      kelas,
      nisn,
      totalQuestions = 0,
      answeredCount = 0,
      currentQuestionIndex = 0,
      remainingSeconds = 0,
      violationsCount = 0,
      isLocked = false,
      lockRemainingSeconds = 0,
      status = 'MENGERJAKAN',
    } = body;

    if (!scheduleId || !studentName) {
      return NextResponse.json(
        { success: false, message: 'scheduleId dan studentName wajib diisi.' },
        { status: 400 }
      );
    }

    const effectiveId = studentId || `${studentName.trim()}-${(kelas || '').trim()}`;
    const map = getProgressMap();
    const key = `${scheduleId}:::${effectiveId}`;

    const existing = map.get(key);
    let shouldForceUnlock = false;

    if (existing && existing.forceUnlock === true) {
      // Teacher unlocked from monitor in this container!
      shouldForceUnlock = true;
      existing.forceUnlock = false; // consume the flag
    } else if (isLocked || (existing && existing.isLocked)) {
      // HANYA periksa Supabase jika murid saat ini memang sedang berstatus terkunci!
      try {
        const dbUnlocked = await checkAndConsumeUnlockFromDb(scheduleId, effectiveId);
        if (dbUnlocked) {
          shouldForceUnlock = true;
        }
      } catch {
        // non-fatal
      }
    }

    const updatedData: LiveStudentProgress = {
      scheduleId,
      studentId: effectiveId,
      studentName: studentName.trim(),
      kelas: (kelas || '-').trim(),
      nisn: (nisn || '-').trim(),
      totalQuestions: Number(totalQuestions),
      answeredCount: Number(answeredCount),
      currentQuestionIndex: Number(currentQuestionIndex),
      remainingSeconds: Number(remainingSeconds),
      violationsCount: Number(violationsCount),
      isLocked: shouldForceUnlock ? false : Boolean(isLocked),
      lockRemainingSeconds: shouldForceUnlock ? 0 : Number(lockRemainingSeconds),
      status: shouldForceUnlock ? 'MENGERJAKAN' : status,
      lastActive: new Date().toISOString(),
      forceUnlock: false,
    };

    map.set(key, updatedData);
    persistProgress();

    // Simpan ke Supabase agar seluruh kontainer Vercel memiliki data murid ini
    try {
      await saveLiveProgressToDb(updatedData);
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      success: true,
      forceUnlock: shouldForceUnlock,
      lastActive: updatedData.lastActive,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal menyimpan progress ujian.' },
      { status: 500 }
    );
  }
}
