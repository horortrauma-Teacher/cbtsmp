"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  CheckCircle2,
  HelpCircle,
  Flag,
  FileCheck,
  X,
  Filter,
  Check,
  Send
} from "lucide-react";
import { Soal } from "@/types/cbt";
import { QuestionAnswerState } from "./QuestionArea";

export function isQuestionAnswered(
  soal: Soal,
  answerState?: QuestionAnswerState
): boolean {
  if (!answerState) return false;
  if (soal.tipeSoal === "PG") {
    return Boolean(answerState.pg);
  }
  if (soal.tipeSoal === "PGK") {
    return Boolean(answerState.pgk && answerState.pgk.length > 0);
  }
  if (soal.tipeSoal === "MENJODOHKAN") {
    if (!soal.pasanganMenjodohkan || soal.pasanganMenjodohkan.length === 0) return false;
    const matches = answerState.menjodohkan;
    if (!matches) return false;
    const answeredCount = Object.values(matches).filter(Boolean).length;
    return answeredCount > 0;
  }
  if (soal.tipeSoal === "URAIAN") {
    return Boolean(answerState.uraian && answerState.uraian.trim().length > 0);
  }
  return false;
}

export type FilterStatus = "all" | "unanswered" | "ragu";

interface QuestionNavGridProps {
  soalList: Soal[];
  currentIndex: number;
  answers: { [soalId: string]: QuestionAnswerState };
  onSelectQuestion: (index: number) => void;
  onSubmitExamModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export const QuestionNavGrid: React.FC<QuestionNavGridProps> = ({
  soalList,
  currentIndex,
  answers,
  onSelectQuestion,
  onSubmitExamModal,
  isOpenMobile = false,
  onCloseMobile,
  className = "",
}) => {
  const [filter, setFilter] = useState<FilterStatus>("all");

  // Calculate status counts
  const total = soalList.length;
  let answeredCount = 0;
  let raguCount = 0;

  soalList.forEach((soal) => {
    const ans = answers[soal.id];
    if (isQuestionAnswered(soal, ans)) {
      answeredCount++;
    }
    if (ans?.isRagu) {
      raguCount++;
    }
  });

  const unansweredCount = total - answeredCount;

  // Filter questions for display
  const filteredIndices = soalList
    .map((soal, index) => ({ soal, index }))
    .filter(({ soal }) => {
      const ans = answers[soal.id];
      const answered = isQuestionAnswered(soal, ans);
      const isRagu = Boolean(ans?.isRagu);

      if (filter === "unanswered") return !answered;
      if (filter === "ragu") return isRagu;
      return true; // "all"
    });

  const gridContent = (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Navigasi Soal
            </h3>
            <p className="text-[11px] text-slate-500">Klik nomor untuk melompat</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Summary Pills */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 grid grid-cols-3 gap-1.5 text-center text-xs shrink-0">
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg py-1.5 px-1">
          <span className="block text-[10px] text-emerald-600 font-medium">Dijawab</span>
          <span className="font-extrabold text-sm">{answeredCount}</span>
        </div>
        <div className="bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg py-1.5 px-1">
          <span className="block text-[10px] text-amber-600 font-medium">Ragu</span>
          <span className="font-extrabold text-sm">{raguCount}</span>
        </div>
        <div className="bg-slate-100 text-slate-700 border border-slate-200 rounded-lg py-1.5 px-1">
          <span className="block text-[10px] text-slate-500 font-medium">Belum</span>
          <span className="font-extrabold text-sm">{unansweredCount}</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="p-2.5 border-b border-slate-100 flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-md transition ${
            filter === "all"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Semua ({total})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unanswered")}
          className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-md transition ${
            filter === "unanswered"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Belum ({unansweredCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("ragu")}
          className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-md transition ${
            filter === "ragu"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Ragu ({raguCount})
        </button>
      </div>

      {/* Question Numbers Grid (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 custom-scroll">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {filteredIndices.map(({ soal, index }) => {
            const ans = answers[soal.id];
            const isAnswered = isQuestionAnswered(soal, ans);
            const isRagu = Boolean(ans?.isRagu);
            const isActive = index === currentIndex;

            // Determine button colors
            let btnStyle =
              "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50";

            if (isRagu) {
              btnStyle =
                "bg-amber-400 text-amber-950 border-amber-500 font-bold shadow-xs";
            } else if (isAnswered) {
              btnStyle =
                "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs";
            }

            return (
              <button
                key={soal.id}
                type="button"
                onClick={() => {
                  onSelectQuestion(index);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`relative h-11 rounded-lg border text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${btnStyle} ${
                  isActive
                    ? "ring-2 ring-sky-500 ring-offset-2 scale-105 z-10"
                    : ""
                }`}
                title={`Nomor ${index + 1}: ${
                  isRagu
                    ? "Ragu-ragu"
                    : isAnswered
                    ? "Sudah Dijawab"
                    : "Belum Dijawab"
                }`}
              >
                <span>{index + 1}</span>

                {/* Corner indicator badge for ragu flag */}
                {isRagu && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>

        {filteredIndices.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            Tidak ada nomor soal yang sesuai filter.
          </div>
        )}

        {/* Legend */}
        <div className="mt-5 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
            <span>Sudah Dijawab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500 shrink-0" />
            <span>Ragu-ragu (Ditinjau)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 shrink-0" />
            <span>Belum Dijawab</span>
          </div>
        </div>
      </div>

      {/* Bottom Submit Exam Button */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onSubmitExamModal();
          }}
          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Kumpulkan Ujian</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar View */}
      <div className={`hidden lg:block w-72 shrink-0 ${className}`}>
        {gridContent}
      </div>

      {/* Mobile / Tablet Drawer View */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {gridContent}
          </div>
        </div>
      )}
    </>
  );
};
