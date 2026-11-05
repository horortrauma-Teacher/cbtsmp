"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  User,
  BookOpen,
  LayoutGrid,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  AlertTriangle
} from "lucide-react";

export type FontSizeOption = "sm" | "md" | "lg";

export interface ExamHeaderProps {
  studentName?: string;
  studentNisn?: string;
  studentClass?: string;
  examTitle: string;
  subject: string;
  durationMinutes: number;
  remainingSeconds: number;
  isOnline: boolean;
  lastSavedAt?: string;
  fontSize: FontSizeOption;
  onChangeFontSize: (size: FontSizeOption) => void;
  onOpenNavGridMobile?: () => void;
  totalAnswered?: number;
  totalQuestions?: number;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  studentName = "Ahmad Fauzi",
  studentNisn = "0081293841",
  studentClass = "SMP Kelas VIII - Fase D",
  examTitle,
  subject,
  remainingSeconds,
  isOnline,
  lastSavedAt,
  fontSize,
  onChangeFontSize,
  onOpenNavGridMobile,
  totalAnswered = 0,
  totalQuestions = 0,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  // Format timer MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTimer = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Timer alert styling
  const isCritical = remainingSeconds <= 60; // < 1 minute
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60; // < 5 minutes

  let timerContainerClasses =
    "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/80";
  let timerBadgeClasses = "bg-white text-slate-700";

  if (isCritical) {
    timerContainerClasses =
      "bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-200";
    timerBadgeClasses = "bg-rose-700 text-white font-bold";
  } else if (isWarning) {
    timerContainerClasses =
      "bg-amber-100 text-amber-900 border-amber-300 shadow-sm";
    timerBadgeClasses = "bg-amber-200 text-amber-950 font-semibold";
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left Section: Student Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ring-2 ring-white">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">
                {studentName}
              </span>
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                {studentClass}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Kelas: <span className="font-bold text-slate-700">{studentClass}</span></span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-600 font-medium truncate max-w-[220px]">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{subject}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Section: Controls & Live Timer */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Connection Status Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
            title={
              isOnline
                ? "Terhubung ke Server CBT. Jawaban tersimpan otomatis."
                : "Jaringan offline. Jawaban disimpan lokal di perangkat ini."
            }
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Disimpan Lokal</span>
              </>
            )}
            {lastSavedAt && (
              <span className="text-[10px] text-slate-400 hidden lg:inline border-l border-slate-200 pl-1.5 ml-0.5">
                {lastSavedAt}
              </span>
            )}
          </div>

          {/* Accessibility Font Size Resizer */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeFontSize("sm")}
              aria-label="Ukuran teks kecil"
              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                fontSize === "sm"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Ukuran teks kecil (A-)"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize("md")}
              aria-label="Ukuran teks standar"
              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                fontSize === "md"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Ukuran teks sedang (A)"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize("lg")}
              aria-label="Ukuran teks besar"
              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                fontSize === "lg"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Ukuran teks besar (A+)"
            >
              A+
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition hidden sm:inline-flex items-center justify-center"
            title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Masuk Mode Layar Penuh (F11)"}
            aria-label={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-slate-700" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Mobile Grid Toggle Drawer Trigger */}
          {onOpenNavGridMobile && (
            <button
              type="button"
              onClick={onOpenNavGridMobile}
              className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-800 text-xs font-medium hover:bg-sky-100 transition"
              title="Buka Daftar Nomor Soal"
            >
              <LayoutGrid className="w-4 h-4 text-sky-600" />
              <span>
                {totalAnswered}/{totalQuestions}
              </span>
            </button>
          )}

          {/* Live Countdown Timer Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${timerContainerClasses}`}
            title="Sisa waktu pengerjaan ujian"
          >
            <Clock
              className={`w-4 h-4 shrink-0 ${
                isCritical ? "text-white animate-spin" : isWarning ? "text-amber-700" : "text-sky-600"
              }`}
            />
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
                Sisa Waktu
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-tight">
                {formattedTimer}
              </span>
            </div>
            {isCritical && (
              <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar for mobile exam title */}
      <div className="sm:hidden px-3 py-1 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-medium truncate max-w-[260px]">{examTitle}</span>
        <span className="font-semibold text-sky-700">{subject}</span>
      </div>
    </header>
  );
};
