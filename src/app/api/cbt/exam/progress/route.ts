import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LiveStudentProgress } from '@/types/cbt';

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
    const map = getProgressMap();

    let list = Array.from(map.values());

    if (scheduleId) {
      list = list.filter((item) => item.scheduleId === scheduleId);
    }

    // Sort: locked first (needs attention), then active, then submitted
    list.sort((a, b) => {
      if (a.isLocked && !b.isLocked) return -1;
      if (!a.isLocked && b.isLocked) return 1;
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });

    const activeCount = list.filter((s) => s.status === 'MENGERJAKAN' && !s.isLocked).length;
    const lockedCount = list.filter((s) => s.isLocked || s.status === 'TERKUNCI').length;
    const submittedCount = list.filter((s) => s.status === 'SELESAI').length;

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

      if (existing) {
        existing.isLocked = false;
        existing.lockRemainingSeconds = 0;
        existing.status = 'MENGERJAKAN';
        existing.forceUnlock = true;
        map.set(key, existing);
        persistProgress();

        return NextResponse.json({
          success: true,
          message: `Kunci ujian untuk siswa ${existing.studentName} berhasil dibuka oleh guru!`,
          student: existing,
        });
      }

      return NextResponse.json(
        { success: false, message: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
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

    if (existing && existing.forceUnlock) {
      // Teacher unlocked from monitor!
      shouldForceUnlock = true;
      existing.forceUnlock = false; // consume the flag
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
