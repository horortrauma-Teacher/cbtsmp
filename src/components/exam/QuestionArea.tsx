"use client";

import React, { useEffect, useRef } from "react";
import {
  HelpCircle,
  BrainCircuit,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
  Check,
  CheckCircle2,
  FileEdit,
  ArrowRightLeft,
  Shuffle,
  AlertCircle
} from "lucide-react";
import { Soal, TipeSoal } from "@/types/cbt";
import { FontSizeOption } from "./ExamHeader";

export interface QuestionAnswerState {
  pg?: string;
  pgk?: string[];
  menjodohkan?: { [premisId: string]: string };
  uraian?: string;
  isRagu?: boolean;
}

interface QuestionAreaProps {
  soal: Soal;
  soalIndex: number; // 0-based
  totalSoal: number;
  currentAnswer?: QuestionAnswerState;
  onUpdateAnswer: (updated: Partial<QuestionAnswerState>) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmitExamModal: () => void;
  fontSize: FontSizeOption;
  hasStimulus: boolean;
}

export const QuestionArea: React.FC<QuestionAreaProps> = ({
  soal,
  soalIndex,
  totalSoal,
  currentAnswer = {},
  onUpdateAnswer,
  onPrev,
  onNext,
  onSubmitExamModal,
  fontSize,
  hasStimulus,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Font size mapping for question body
  const getFontSizeClass = (size: FontSizeOption) => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      case "md":
      default:
        return "text-base";
    }
  };

  // Keyboard shortcut listener (1-4 for PG options, Alt+Left/Right for prev/next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // 1, 2, 3, 4, 5 for PG shortcuts
      if (soal.tipeSoal === "PG" && soal.opsiPG) {
        const keyNum = parseInt(e.key, 10);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= soal.opsiPG.length) {
          const selectedOption = soal.opsiPG[keyNum - 1];
          if (selectedOption) {
            onUpdateAnswer({ pg: selectedOption.id });
          }
        }
      }

      // R for ragu-ragu
      if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
        onUpdateAnswer({ isRagu: !currentAnswer.isRagu });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [soal, currentAnswer.isRagu, onUpdateAnswer]);

  // Handler for PG option click
  const handleSelectPG = (optionId: string) => {
    onUpdateAnswer({ pg: optionId });
  };

  // Handler for PGK multi-select toggle
  const handleTogglePGK = (optionId: string) => {
    const prevList = currentAnswer.pgk || [];
    const exists = prevList.includes(optionId);
    const updated = exists
      ? prevList.filter((id) => id !== optionId)
      : [...prevList, optionId];
    onUpdateAnswer({ pgk: updated });
  };

  // Handler for Menjodohkan pair assignment
  const handleAssignMatch = (premisId: string, targetValue: string) => {
    const prevMatches = currentAnswer.menjodohkan || {};
    const updated = {
      ...prevMatches,
      [premisId]: targetValue,
    };
    onUpdateAnswer({ menjodohkan: updated });
  };

  // Handler for Uraian text change
  const handleUraianChange = (val: string) => {
    onUpdateAnswer({ uraian: val });
  };

  // Word & Char counter for Uraian
  const uraianText = currentAnswer.uraian || "";
  const wordCount = uraianText.trim() ? uraianText.trim().split(/\s+/).length : 0;
  const charCount = uraianText.length;

  // Is last question
  const isFirst = soalIndex === 0;
  const isLast = soalIndex === totalSoal - 1;

  // HOTS Cognitive Level formatting
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "C4":
        return { label: "HOTS - C4 Menganalisis", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "C5":
        return { label: "HOTS - C5 Mengevaluasi", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "C6":
        return { label: "HOTS - C6 Mencipta", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case "C3":
        return { label: "MOTS - C3 Menerapkan", color: "bg-sky-50 text-sky-700 border-sky-200" };
      default:
        return { label: `Level ${level}`, color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const levelInfo = getLevelBadge(soal.levelKognitif);

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full overflow-hidden shadow-xs">
      {/* Question Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Question Number Badge */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-sky-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              {soalIndex + 1}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Soal {soalIndex + 1} dari {totalSoal}
            </span>
          </div>

          {/* Question Type Pill */}
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {soal.tipeSoal === "PG" && "Pilihan Ganda"}
            {soal.tipeSoal === "PGK" && "Pilihan Ganda Kompleks"}
            {soal.tipeSoal === "MENJODOHKAN" && "Menjodohkan"}
            {soal.tipeSoal === "URAIAN" && "Uraian Essai"}
          </span>

          {/* HOTS / Cognitive Badge */}
          {soal.isHots && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${levelInfo.color}`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>{levelInfo.label}</span>
            </span>
          )}
        </div>

        {/* Bobot Nilai Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bobot: {soal.bobot} Poin</span>
        </div>
      </div>

      {/* Main Question Body Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scroll">
        {/* Question Prompt */}
        <div className="space-y-3">
          <p
            className={`font-semibold text-slate-800 leading-relaxed ${getFontSizeClass(
              fontSize
            )}`}
          >
            {soal.pertanyaan}
          </p>

          {/* Optional inline image for question */}
          {soal.gambarUrl && (
            <div className="rounded-lg overflow-hidden border border-slate-200 max-w-lg my-2">
              <img
                src={soal.gambarUrl}
                alt={`Gambar Soal ${soalIndex + 1}`}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* TYPE 1: PG (Pilihan Ganda) */}
        {/* ============================================================== */}
        {soal.tipeSoal === "PG" && soal.opsiPG && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span>Pilihlah salah satu jawaban yang paling tepat (Tombol 1 - {soal.opsiPG.length}):</span>
            </p>

            <div className="space-y-2.5">
              {soal.opsiPG.map((opt, i) => {
                const isSelected = currentAnswer.pg === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPG(opt.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                      isSelected
                        ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-400/20 text-slate-900 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700"
                    }`}
                  >
                    {/* Option Label Letter Circle (A, B, C, D) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                        isSelected
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {opt.label || String.fromCharCode(65 + i)}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 pt-0.5 sm:pt-1">
                      <span className={`leading-relaxed ${getFontSizeClass(fontSize)}`}>
                        {opt.teks}
                      </span>
                    </div>

                    {/* Radio indicator */}
                    <div className="pt-1 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? "border-sky-600 bg-sky-600 text-white"
                            : "border-slate-300 group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TYPE 2: PGK (Pilihan Ganda Kompleks) */}
        {/* ============================================================== */}
        {soal.tipeSoal === "PGK" && soal.opsiPGK && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Pilihan Ganda Kompleks: Anda dapat memilih lebih dari satu jawaban yang benar.
              </span>
            </div>

            <div className="space-y-2.5">
              {soal.opsiPGK.map((opt, i) => {
                const isChecked = Boolean(currentAnswer.pgk?.includes(opt.id));
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleTogglePGK(opt.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                      isChecked
                        ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-400/20 text-slate-900 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700"
                    }`}
                  >
                    {/* Checkbox Icon */}
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked
                          ? "border-sky-600 bg-sky-600 text-white shadow-xs"
                          : "border-slate-300 bg-white group-hover:border-slate-400"
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <span className={`leading-relaxed ${getFontSizeClass(fontSize)}`}>
                        {opt.teks}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TYPE 3: MENJODOHKAN */}
        {/* ============================================================== */}
        {soal.tipeSoal === "MENJODOHKAN" && soal.pasanganMenjodohkan && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Menjodohkan: Pasangkan setiap pernyataan di kolom kiri dengan pilihan pasangan yang sesuai di kolom kanan.
              </span>
            </div>

            {/* Target Options Reference Pool */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2">
                Daftar Pilihan Jawaban Target:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {soal.pasanganMenjodohkan.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs">{p.target}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Matching Rows */}
            <div className="space-y-3">
              {soal.pasanganMenjodohkan.map((pair, idx) => {
                const selectedTarget = currentAnswer.menjodohkan?.[pair.id] || "";
                return (
                  <div
                    key={pair.id}
                    className={`p-4 rounded-xl border transition ${
                      selectedTarget
                        ? "bg-sky-50/50 border-sky-300 shadow-xs"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Left: Premis */}
                      <div className="md:col-span-6 flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div>
                          <span className="text-xs uppercase font-bold text-slate-400 block">
                            Pernyataan {idx + 1}
                          </span>
                          <p
                            className={`font-medium text-slate-800 ${getFontSizeClass(
                              fontSize
                            )}`}
                          >
                            {pair.premis}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Arrow indicator */}
                      <div className="hidden md:flex md:col-span-1 justify-center text-slate-400">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>

                      {/* Right: Dropdown selection */}
                      <div className="md:col-span-5">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          Pasangan yang Cocok:
                        </label>
                        <select
                          value={selectedTarget}
                          onChange={(e) => handleAssignMatch(pair.id, e.target.value)}
                          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white ${
                            selectedTarget
                              ? "border-sky-500 text-sky-900 bg-sky-50/50"
                              : "border-slate-300 text-slate-700"
                          }`}
                        >
                          <option value="">-- Pilih Pasangan Jawaban --</option>
                          {soal.pasanganMenjodohkan?.map((targetOpt, tIdx) => (
                            <option key={tIdx} value={targetOpt.target}>
                              [Pilihan {tIdx + 1}] {targetOpt.target}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TYPE 4: URAIAN */}
        {/* ============================================================== */}
        {soal.tipeSoal === "URAIAN" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-sky-600" />
                Lembar Jawaban Uraian:
              </span>
              <div className="flex items-center gap-3">
                <span>
                  Kata: <strong className="text-slate-700">{wordCount}</strong>
                </span>
                <span>
                  Karakter: <strong className="text-slate-700">{charCount}</strong>
                </span>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={8}
              value={uraianText}
              onChange={(e) => handleUraianChange(e.target.value)}
              placeholder="Ketikkan jawaban Anda secara komprehensif di sini..."
              className={`w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800 leading-relaxed custom-scroll bg-slate-50/40 focus:bg-white transition ${getFontSizeClass(
                fontSize
              )}`}
            />

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Petunjuk Pengerjaan Uraian:</p>
                <p className="text-amber-800">
                  Uraikan alasan, argumen logis, dan kaitkan dengan data yang ada pada wacana. Jawaban Anda akan dinilai berdasarkan kelengkapan aspek dan kejelasan penalaran.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Previous Question Button */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition ${
            isFirst
              ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
              : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-xs cursor-pointer"
          }`}
          title="Ke soal sebelumnya (Alt + Panah Kiri)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        {/* Center: "Ragu-ragu" Toggle Button */}
        <button
          type="button"
          onClick={() => onUpdateAnswer({ isRagu: !currentAnswer.isRagu })}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold border transition shadow-xs cursor-pointer ${
            currentAnswer.isRagu
              ? "bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-300/50"
              : "bg-white text-amber-700 hover:bg-amber-50 border-amber-300"
          }`}
          title="Tandai ragu-ragu untuk diperiksa kembali nanti (Shortcut: R)"
        >
          <Flag
            className={`w-4 h-4 ${
              currentAnswer.isRagu ? "fill-amber-950 text-amber-950" : "text-amber-600"
            }`}
          />
          <span>{currentAnswer.isRagu ? "Ragu-ragu (Ditandai)" : "Ragu-ragu"}</span>
        </button>

        {/* Next Question / Finish Exam Button */}
        {isLast ? (
          <button
            type="button"
            onClick={onSubmitExamModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-600 shadow-sm shadow-emerald-500/25 transition cursor-pointer"
          >
            <span>Kumpulkan Ujian</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 border border-sky-600 shadow-xs transition cursor-pointer"
            title="Ke soal berikutnya (Alt + Panah Kanan)"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
