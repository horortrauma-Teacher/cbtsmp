import { HasilUjianSiswa, JawabanDetailSiswa } from '@/types/cbt';

/**
 * Otomatis mendeteksi dan memulihkan hasil ujian siswa yang terkena
 * bug pencocokan kunci tipe Menjodohkan atau format JSON raw.
 */
export function autoHealSingleHasil(
  hasil: HasilUjianSiswa,
  defaultKkm = 75
): { healed: HasilUjianSiswa; wasFixed: boolean } {
  if (!hasil || !Array.isArray(hasil.jawabanDetail)) {
    return { healed: hasil, wasFixed: false };
  }

  let wasFixed = false;
  const newJawabanDetail: JawabanDetailSiswa[] = hasil.jawabanDetail.map((soal) => {
    // 1. Auto-heal MENJODOHKAN
    if (soal.tipeSoal === 'MENJODOHKAN') {
      const isJson =
        typeof soal.jawabanSiswa === 'string' &&
        soal.jawabanSiswa.trim().startsWith('{') &&
        soal.jawabanSiswa.trim().endsWith('}');

      if (!soal.isBenar || isJson || soal.nilaiDiperoleh === 0) {
        try {
          const keyPairs = (soal.kunciJawaban || '')
            .split(';')
            .map((s) => {
              const parts = s.split('->').map((p) => (p || '').trim());
              return { premis: parts[0] || '', target: parts[1] || '' };
            })
            .filter((p) => p.premis && p.target);

          if (keyPairs.length > 0) {
            let studentValues: string[] = [];
            let studentMap: Record<string, string> = {};

            if (isJson) {
              studentMap = JSON.parse(soal.jawabanSiswa);
              studentValues = Object.values(studentMap).map((v) =>
                String(v).trim().toLowerCase()
              );
            } else {
              const parts = (soal.jawabanSiswa || '')
                .split(';')
                .map((s) => (s.split('->')[1] || '').trim().toLowerCase())
                .filter(Boolean);
              studentValues = parts;
            }

            const expectedTargets = keyPairs.map((p) => p.target.trim().toLowerCase());
            const matchedCount = expectedTargets.filter((t) =>
              studentValues.includes(t)
            ).length;

            if (matchedCount > 0) {
              const allMatched = matchedCount === expectedTargets.length;
              const bobot = soal.bobot || 10;
              const newPoints = allMatched
                ? bobot
                : Math.round((matchedCount / expectedTargets.length) * bobot);

              const formattedStudentAns = keyPairs
                .map((kp, idx) => {
                  let val =
                    studentMap[kp.premis] ||
                    studentMap[`pair-${idx + 1}`] ||
                    '';
                  if (!val && studentMap) {
                    const found = Object.values(studentMap).find(
                      (sv) =>
                        String(sv).trim().toLowerCase() ===
                        kp.target.toLowerCase()
                    );
                    if (found) val = String(found);
                  }
                  if (!val && studentValues[idx]) {
                    val = studentValues[idx];
                  }
                  return `${kp.premis} -> ${val || kp.target}`;
                })
                .join('; ');

              if (!soal.isBenar || soal.nilaiDiperoleh < newPoints || isJson) {
                wasFixed = true;
                return {
                  ...soal,
                  isBenar: allMatched,
                  nilaiDiperoleh: newPoints,
                  jawabanSiswa: formattedStudentAns,
                };
              }
            }
          }
        } catch (e) {
          console.warn('[AutoHeal] Parse error:', e);
        }
      }
    }
    return soal;
  });

  if (!wasFixed) {
    return { healed: hasil, wasFixed: false };
  }

  // Recalculate total scores & breakdown
  let totalScore = 0;
  let maxScore = 0;
  let pg = 0;
  let pgk = 0;
  let menjodohkan = 0;
  let uraian = 0;
  let earnedHots = 0;
  let totalHots = 0;

  newJawabanDetail.forEach((q) => {
    const bobot = q.bobot || 10;
    maxScore += bobot;
    const earned = Math.max(0, Math.min(bobot, Number(q.nilaiDiperoleh) || 0));
    totalScore += earned;

    if (q.isHots) {
      totalHots += bobot;
      earnedHots += earned;
    }

    if (q.tipeSoal === 'PG') pg += earned;
    else if (q.tipeSoal === 'PGK') pgk += earned;
    else if (q.tipeSoal === 'MENJODOHKAN') menjodohkan += earned;
    else if (q.tipeSoal === 'URAIAN') uraian += earned;
  });

  const scaledScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const isTuntas = scaledScore >= defaultKkm;

  const healedHasil: HasilUjianSiswa = {
    ...hasil,
    nilaiAkhir: scaledScore,
    statusKelulusan: isTuntas ? 'TUNTAS' : 'BELUM_TUNTAS',
    breakdown: {
      pg,
      pgk,
      menjodohkan,
      uraian,
      hotsMasteryRate: totalHots > 0 ? Math.round((earnedHots / totalHots) * 100) : 100,
    },
    jawabanDetail: newJawabanDetail,
  };

  return { healed: healedHasil, wasFixed: true };
}

export function autoHealHasilList(
  list: HasilUjianSiswa[],
  defaultKkm = 75
): { list: HasilUjianSiswa[]; fixedCount: number } {
  let fixedCount = 0;
  const newList = list.map((item) => {
    const { healed, wasFixed } = autoHealSingleHasil(item, defaultKkm);
    if (wasFixed) fixedCount++;
    return healed;
  });
  return { list: newList, fixedCount };
}
