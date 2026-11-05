import {
  Soal,
  JenisSoal,
  TingkatKognitif,
  ScoreResult,
  QuestionBreakdown,
  ScoreCategoryBreakdown,
  ScoreDomainBreakdown,
} from './supabase/types';

/**
 * Check if a cognitive level qualifies as HOTS (Higher Order Thinking Skills).
 * In Indonesian AKM: C4 (Menganalisis), C5 (Mengevaluasi), C6 (Mengkreasi) are HOTS.
 */
export const isHotsLevel = (level: TingkatKognitif): boolean => {
  return level === 'C4' || level === 'C5' || level === 'C6';
};

/**
 * Score a Single Choice (PG - Pilihan Ganda) question.
 * Exact match awards 100% of bobot; mismatch awards 0.
 */
export const scorePG = (
  studentAnswer: any,
  correctAnswer: any,
  bobot: number
): { points: number; isCorrect: boolean } => {
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    return { points: 0, isCorrect: false };
  }

  const sAnswer = String(studentAnswer).trim().toUpperCase();
  const cAnswer = String(correctAnswer).trim().toUpperCase();

  const isCorrect = sAnswer === cAnswer;
  return {
    points: isCorrect ? bobot : 0,
    isCorrect,
  };
};

/**
 * Score a Multiple-Select / Complex Choice (PGK - Pilihan Ganda Kompleks).
 * Implements proportional credit with false-positive penalty to discourage blind guessing.
 *
 * Formula:
 * - True Positives (TP): Correct choices made by student.
 * - False Positives (FP): Wrong choices selected by student.
 * - Total Correct (TC): Total correct choices in answer key.
 *
 * Ratio = Max(0, (TP - (FP * 0.5)) / TC)
 * Points = Ratio * bobot
 */
export const scorePGK = (
  studentAnswer: any,
  correctAnswer: any,
  bobot: number
): { points: number; isCorrect: boolean; isPartiallyCorrect: boolean } => {
  // Normalize student answer to array of strings
  let sList: string[] = [];
  if (Array.isArray(studentAnswer)) {
    sList = studentAnswer.map((item) => String(item).trim().toUpperCase());
  } else if (typeof studentAnswer === 'string' && studentAnswer.trim() !== '') {
    sList = [studentAnswer.trim().toUpperCase()];
  }

  // Normalize correct answer to array of strings
  let cList: string[] = [];
  if (Array.isArray(correctAnswer)) {
    cList = correctAnswer.map((item) => String(item).trim().toUpperCase());
  } else if (typeof correctAnswer === 'string' && correctAnswer.trim() !== '') {
    cList = [correctAnswer.trim().toUpperCase()];
  }

  if (cList.length === 0) {
    return { points: 0, isCorrect: false, isPartiallyCorrect: false };
  }

  if (sList.length === 0) {
    return { points: 0, isCorrect: false, isPartiallyCorrect: false };
  }

  const correctSet = new Set(cList);
  const studentSet = new Set(sList);

  let truePositives = 0;
  let falsePositives = 0;

  studentSet.forEach((item) => {
    if (correctSet.has(item)) {
      truePositives++;
    } else {
      falsePositives++;
    }
  });

  const totalCorrect = correctSet.size;

  // Perfect match
  if (truePositives === totalCorrect && falsePositives === 0) {
    return { points: bobot, isCorrect: true, isPartiallyCorrect: false };
  }

  // Proportional score with moderate penalty for false positives
  const rawRatio = (truePositives - falsePositives * 0.5) / totalCorrect;
  const clampedRatio = Math.max(0, Math.min(1, rawRatio));
  const points = Math.round(clampedRatio * bobot * 100) / 100;

  return {
    points,
    isCorrect: points === bobot,
    isPartiallyCorrect: points > 0 && points < bobot,
  };
};

/**
 * Score a Matching (Menjodohkan) question.
 * Formula: (Number of correctly matched pairs / Total required pairs) * bobot.
 */
export const scoreMenjodohkan = (
  studentAnswer: any,
  correctAnswer: Record<string, string>,
  bobot: number
): { points: number; isCorrect: boolean; isPartiallyCorrect: boolean } => {
  if (!studentAnswer || typeof studentAnswer !== 'object' || !correctAnswer) {
    return { points: 0, isCorrect: false, isPartiallyCorrect: false };
  }

  const keys = Object.keys(correctAnswer);
  if (keys.length === 0) {
    return { points: 0, isCorrect: false, isPartiallyCorrect: false };
  }

  let correctPairs = 0;
  keys.forEach((k) => {
    const studentVal = String(studentAnswer[k] || '').trim();
    const correctVal = String(correctAnswer[k] || '').trim();
    if (studentVal !== '' && studentVal === correctVal) {
      correctPairs++;
    }
  });

  const ratio = correctPairs / keys.length;
  const points = Math.round(ratio * bobot * 100) / 100;

  return {
    points,
    isCorrect: correctPairs === keys.length,
    isPartiallyCorrect: correctPairs > 0 && correctPairs < keys.length,
  };
};

/**
 * Score a True/False statement table (Benar / Salah).
 * Formula: (Number of correct statements / Total statements) * bobot.
 */
export const scoreBenarSalah = (
  studentAnswer: any,
  correctAnswer: Record<string, boolean>,
  bobot: number
): { points: number; isCorrect: boolean; isPartiallyCorrect: boolean } => {
  if (!studentAnswer || typeof studentAnswer !== 'object' || !correctAnswer) {
    return { points: 0, isCorrect: false, isPartiallyCorrect: false };
  }

  const keys = Object.keys(correctAnswer);
  if (keys.length === 0) {
    return { points: 0, isCorrect: false, isPartiallyCorrect: false };
  }

  let correctCount = 0;
  keys.forEach((k) => {
    if (studentAnswer[k] !== undefined && Boolean(studentAnswer[k]) === Boolean(correctAnswer[k])) {
      correctCount++;
    }
  });

  const ratio = correctCount / keys.length;
  const points = Math.round(ratio * bobot * 100) / 100;

  return {
    points,
    isCorrect: correctCount === keys.length,
    isPartiallyCorrect: correctCount > 0 && correctCount < keys.length,
  };
};

/**
 * Score an Essay / Short Answer (Uraian) question.
 * Supports manual grading override or smart heuristic evaluation based on rubrics.
 */
export const scoreUraian = (
  studentAnswer: any,
  correctAnswer: string,
  bobot: number,
  manualScore?: number
): { points: number; isCorrect: boolean; isPartiallyCorrect: boolean; evaluationNote: string } => {
  // If teacher has explicitly provided a manual score
  if (typeof manualScore === 'number' && !isNaN(manualScore)) {
    const clamped = Math.max(0, Math.min(bobot, manualScore));
    return {
      points: clamped,
      isCorrect: clamped === bobot,
      isPartiallyCorrect: clamped > 0 && clamped < bobot,
      evaluationNote: `Dinilai manual oleh guru: ${clamped}/${bobot} poin.`,
    };
  }

  const text = typeof studentAnswer === 'string' ? studentAnswer.trim() : '';

  if (text.length === 0) {
    return {
      points: 0,
      isCorrect: false,
      isPartiallyCorrect: false,
      evaluationNote: 'Siswa tidak menjawab uraian.',
    };
  }

  // Smart heuristic for automated estimation (e.g. word length & conceptual keywords)
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 5) {
    const points = Math.round(bobot * 0.2 * 100) / 100;
    return {
      points,
      isCorrect: false,
      isPartiallyCorrect: true,
      evaluationNote: 'Jawaban terlalu singkat (perlu verifikasi guru).',
    };
  }

  // Keywords detection from answer key or rubric
  const lowerText = text.toLowerCase();
  const sampleKey = String(correctAnswer || '').toLowerCase();
  const sampleKeywords = sampleKey
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  let matchedKeywords = 0;
  const uniqueKeywords = Array.from(new Set(sampleKeywords));
  uniqueKeywords.forEach((kw) => {
    if (lowerText.includes(kw)) {
      matchedKeywords++;
    }
  });

  const keywordRatio = uniqueKeywords.length > 0 ? matchedKeywords / Math.min(uniqueKeywords.length, 6) : 0.5;
  const lengthBonus = Math.min(0.3, (wordCount / 50) * 0.3);
  const estimatedRatio = Math.min(0.9, Math.max(0.4, keywordRatio * 0.6 + lengthBonus));
  const estimatedPoints = Math.round(estimatedRatio * bobot * 100) / 100;

  return {
    points: estimatedPoints,
    isCorrect: estimatedPoints >= bobot * 0.85,
    isPartiallyCorrect: estimatedPoints > 0,
    evaluationNote: `Estimasi rubrik otomatis (${wordCount} kata). Menunggu konfirmasi guru.`,
  };
};

/**
 * Evaluates a single question based on its type.
 */
export const gradeSingleQuestion = (
  soal: Soal,
  studentAnswer: any,
  manualScore?: number
): QuestionBreakdown => {
  const isHots = isHotsLevel(soal.tingkat_kognitif);
  let pointsEarned = 0;
  let isCorrect = false;
  let isPartiallyCorrect = false;
  let rubrikEvaluation: string | undefined;
  let feedback: string | undefined;

  switch (soal.jenis_soal) {
    case 'PG': {
      const res = scorePG(studentAnswer, soal.kunci_jawaban, soal.bobot_soal);
      pointsEarned = res.points;
      isCorrect = res.isCorrect;
      feedback = isCorrect
        ? 'Jawaban Anda benar!'
        : `Jawaban kurang tepat. Jawaban yang benar adalah ${soal.kunci_jawaban}.`;
      break;
    }

    case 'PGK': {
      const res = scorePGK(studentAnswer, soal.kunci_jawaban, soal.bobot_soal);
      pointsEarned = res.points;
      isCorrect = res.isCorrect;
      isPartiallyCorrect = res.isPartiallyCorrect;
      feedback = isCorrect
        ? 'Semua pilihan benar!'
        : isPartiallyCorrect
        ? `Sebagian benar (${pointsEarned}/${soal.bobot_soal} poin). Kunci: ${Array.isArray(soal.kunci_jawaban) ? soal.kunci_jawaban.join(', ') : soal.kunci_jawaban}`
        : 'Pilihan Anda belum tepat.';
      break;
    }

    case 'Menjodohkan': {
      const res = scoreMenjodohkan(studentAnswer, soal.kunci_jawaban, soal.bobot_soal);
      pointsEarned = res.points;
      isCorrect = res.isCorrect;
      isPartiallyCorrect = res.isPartiallyCorrect;
      feedback = isCorrect
        ? 'Semua pasangan cocok sempurna!'
        : `Pasangan cocok (${pointsEarned}/${soal.bobot_soal} poin).`;
      break;
    }

    case 'BenarSalah': {
      const res = scoreBenarSalah(studentAnswer, soal.kunci_jawaban, soal.bobot_soal);
      pointsEarned = res.points;
      isCorrect = res.isCorrect;
      isPartiallyCorrect = res.isPartiallyCorrect;
      feedback = isCorrect
        ? 'Semua pernyataan terjawab tepat!'
        : `Pernyataan benar (${pointsEarned}/${soal.bobot_soal} poin).`;
      break;
    }

    case 'Uraian': {
      const res = scoreUraian(studentAnswer, soal.kunci_jawaban, soal.bobot_soal, manualScore);
      pointsEarned = res.points;
      isCorrect = res.isCorrect;
      isPartiallyCorrect = res.isPartiallyCorrect;
      rubrikEvaluation = res.evaluationNote;
      feedback = res.evaluationNote;
      break;
    }

    default: {
      pointsEarned = 0;
      isCorrect = false;
      feedback = 'Tipe soal tidak dikenali.';
      break;
    }
  }

  return {
    soalId: soal.id,
    nomorUrut: soal.nomor_urut || 1,
    jenisSoal: soal.jenis_soal,
    tingkatKognitif: soal.tingkat_kognitif,
    isHots,
    domain: soal.domain,
    bobot: soal.bobot_soal,
    pointsEarned,
    maxPoints: soal.bobot_soal,
    isCorrect,
    isPartiallyCorrect,
    studentAnswer,
    correctAnswer: soal.kunci_jawaban,
    rubrikEvaluation,
    feedback,
  };
};

/**
 * Calculates complete assessment score for an entire exam session.
 * Normalized to standard 0-100 scale, with detailed analytical categories and HOTS mastery.
 */
export const calculateAKMScore = (
  questions: Soal[],
  answers: Record<string, any>,
  manualScores?: Record<string, number>
): ScoreResult => {
  let rawScore = 0;
  let maxScore = 0;
  let hotsEarned = 0;
  let hotsTotal = 0;
  let needsTeacherGrading = false;

  const categoryBreakdown: ScoreCategoryBreakdown = {
    pgScore: { earned: 0, max: 0, count: 0 },
    pgkScore: { earned: 0, max: 0, count: 0 },
    menjodohkanScore: { earned: 0, max: 0, count: 0 },
    uraianScore: { earned: 0, max: 0, count: 0 },
    benarSalahScore: { earned: 0, max: 0, count: 0 },
  };

  const domainScores = {
    literasi: { earned: 0, max: 0 },
    numerasi: { earned: 0, max: 0 },
  };

  const breakdown: QuestionBreakdown[] = questions.map((soal, idx) => {
    const studentAns = answers ? answers[soal.id] : undefined;
    const manualScore = manualScores ? manualScores[soal.id] : undefined;

    const result = gradeSingleQuestion(
      { ...soal, nomor_urut: soal.nomor_urut || idx + 1 },
      studentAns,
      manualScore
    );

    rawScore += result.pointsEarned;
    maxScore += result.maxPoints;

    // HOTS Tracking
    if (result.isHots) {
      hotsEarned += result.pointsEarned;
      hotsTotal += result.maxPoints;
    }

    // Category breakdown
    switch (soal.jenis_soal) {
      case 'PG':
        categoryBreakdown.pgScore.earned += result.pointsEarned;
        categoryBreakdown.pgScore.max += result.maxPoints;
        categoryBreakdown.pgScore.count += 1;
        break;
      case 'PGK':
        categoryBreakdown.pgkScore.earned += result.pointsEarned;
        categoryBreakdown.pgkScore.max += result.maxPoints;
        categoryBreakdown.pgkScore.count += 1;
        break;
      case 'Menjodohkan':
        categoryBreakdown.menjodohkanScore.earned += result.pointsEarned;
        categoryBreakdown.menjodohkanScore.max += result.maxPoints;
        categoryBreakdown.menjodohkanScore.count += 1;
        break;
      case 'BenarSalah':
        categoryBreakdown.benarSalahScore.earned += result.pointsEarned;
        categoryBreakdown.benarSalahScore.max += result.maxPoints;
        categoryBreakdown.benarSalahScore.count += 1;
        break;
      case 'Uraian':
        categoryBreakdown.uraianScore.earned += result.pointsEarned;
        categoryBreakdown.uraianScore.max += result.maxPoints;
        categoryBreakdown.uraianScore.count += 1;
        if (manualScore === undefined) {
          needsTeacherGrading = true;
        }
        break;
    }

    // Domain breakdown
    if (soal.domain === 'Literasi Membaca') {
      domainScores.literasi.earned += result.pointsEarned;
      domainScores.literasi.max += result.maxPoints;
    } else if (soal.domain === 'Numerasi') {
      domainScores.numerasi.earned += result.pointsEarned;
      domainScores.numerasi.max += result.maxPoints;
    }

    return result;
  });

  // Calculate final normalized score (0 - 100)
  const normalizedFinalScore =
    maxScore > 0 ? Math.round((rawScore / maxScore) * 100 * 10) / 10 : 0;

  // HOTS mastery percentage
  const hotsMasteryRate =
    hotsTotal > 0 ? Math.round((hotsEarned / hotsTotal) * 100 * 10) / 10 : 0;

  const domainBreakdown: ScoreDomainBreakdown = {
    literasi: {
      earned: Math.round(domainScores.literasi.earned * 100) / 100,
      max: domainScores.literasi.max,
      percentage:
        domainScores.literasi.max > 0
          ? Math.round((domainScores.literasi.earned / domainScores.literasi.max) * 100 * 10) / 10
          : 0,
    },
    numerasi: {
      earned: Math.round(domainScores.numerasi.earned * 100) / 100,
      max: domainScores.numerasi.max,
      percentage:
        domainScores.numerasi.max > 0
          ? Math.round((domainScores.numerasi.earned / domainScores.numerasi.max) * 100 * 10) / 10
          : 0,
    },
  };

  return {
    finalScore: normalizedFinalScore,
    rawScore: Math.round(rawScore * 100) / 100,
    maxScore,
    breakdown,
    categoryBreakdown,
    domainBreakdown,
    hotsMasteryRate,
    hotsEarned: Math.round(hotsEarned * 100) / 100,
    hotsTotal,
    needsTeacherGrading,
    completedAt: new Date().toISOString(),
  };
};
