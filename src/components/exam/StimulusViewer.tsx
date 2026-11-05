"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Calculator,
  Compass,
  FileText,
  Maximize2,
  X,
  Highlighter,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { Stimulus, TipeStimulus } from "@/types/cbt";
import { FontSizeOption } from "./ExamHeader";

interface StimulusViewerProps {
  stimulus: Stimulus;
  fontSize: FontSizeOption;
  className?: string;
}

export const StimulusViewer: React.FC<StimulusViewerProps> = ({
  stimulus,
  fontSize,
  className = "",
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightedSentences, setHighlightedSentences] = useState<Set<number>>(new Set());

  // Determine type badge styles
  const getBadgeStyle = (tipe: TipeStimulus) => {
    switch (tipe) {
      case "Literasi":
        return {
          icon: <BookOpen className="w-3.5 h-3.5" />,
          label: "AKM Literasi Membaca",
          badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "Numerasi":
        return {
          icon: <Calculator className="w-3.5 h-3.5" />,
          label: "AKM Numerasi",
          badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "Sains":
        return {
          icon: <Compass className="w-3.5 h-3.5" />,
          label: "Saintifik (IPA)",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "Sosial Budaya":
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5" />,
          label: "Kearifan Lokal / Sosial Budaya",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        };
    }
  };

  const badgeInfo = getBadgeStyle(stimulus.tipe);

  // Font size mapping for stimulus body text
  const getFontSizeClass = (size: FontSizeOption) => {
    switch (size) {
      case "sm":
        return "text-sm leading-relaxed";
      case "lg":
        return "text-lg leading-loose";
      case "md":
      default:
        return "text-base leading-relaxed";
    }
  };

  // Toggle highlight on a specific paragraph/sentence block
  const toggleSentenceHighlight = (index: number) => {
    if (!highlightMode) return;
    setHighlightedSentences((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Split text into readable paragraphs or sentences
  const paragraphs = stimulus.kontenTeks
    ? stimulus.kontenTeks.split("\n\n").filter(Boolean)
    : [];

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 flex flex-col h-full overflow-hidden shadow-xs ${className}`}
    >
      {/* Header bar of Stimulus Pane */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Wacana Stimulus
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeInfo.badgeClass}`}
          >
            {badgeInfo.icon}
            <span>{badgeInfo.label}</span>
          </span>
        </div>

        {/* Action button: Stabilo / Highlighter tool */}
        <button
          type="button"
          onClick={() => setHighlightMode(!highlightMode)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
            highlightMode
              ? "bg-amber-100 text-amber-900 border-amber-300 shadow-inner"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
          title={
            highlightMode
              ? "Mode Stabilo aktif! Klik paragraf untuk menandai kuning."
              : "Aktifkan Stabilo untuk menandai bagian penting teks"
          }
        >
          <Highlighter
            className={`w-3.5 h-3.5 ${
              highlightMode ? "text-amber-600 fill-amber-500" : "text-slate-500"
            }`}
          />
          <span className="hidden sm:inline">
            {highlightMode ? "Stabilo Aktif (Klik Teks)" : "Gunakan Stabilo"}
          </span>
          {highlightMode && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Scrollable stimulus content area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scroll">
        {/* Stimulus Title */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {stimulus.judul}
          </h2>
          {stimulus.sumber && (
            <p className="mt-1 text-xs text-slate-400 italic flex items-center gap-1">
              <span>Sumber: {stimulus.sumber}</span>
            </p>
          )}
        </div>

        {/* Infographic / Image viewer if available */}
        {stimulus.gambarUrl && (
          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
            <img
              src={stimulus.gambarUrl}
              alt={stimulus.judul}
              className="w-full max-h-72 object-cover transition duration-300 group-hover:scale-[1.01]"
              loading="lazy"
            />
            {/* Zoom Hover Overlay */}
            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-semibold shadow-md">
                <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                Klik untuk memperbesar gambar
              </span>
            </div>
            {/* Click trigger button */}
            <button
              type="button"
              onClick={() => {
                setImageScale(1);
                setIsImageModalOpen(true);
              }}
              className="absolute inset-0 w-full h-full cursor-zoom-in"
              aria-label="Perbesar gambar stimulus"
            />
          </div>
        )}

        {/* Body Text / Reading Passage */}
        <div className={`space-y-4 text-slate-700 ${getFontSizeClass(fontSize)}`}>
          {paragraphs.map((p, idx) => {
            const isHighlighted = highlightedSentences.has(idx);
            return (
              <p
                key={idx}
                onClick={() => toggleSentenceHighlight(idx)}
                className={`transition-colors rounded-lg px-2 py-1 -mx-2 text-justify select-text ${
                  highlightMode ? "cursor-pointer hover:bg-amber-50" : ""
                } ${
                  isHighlighted
                    ? "bg-yellow-200/90 text-slate-900 ring-1 ring-yellow-400 font-medium"
                    : ""
                }`}
                title={highlightMode ? "Klik untuk tandai/hapus stabilo" : undefined}
              >
                {p}
              </p>
            );
          })}
        </div>

        {/* Informative AKM Context footer note */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Bacalah wacana dengan seksama untuk menjawab pertanyaan terkait.</span>
          {highlightedSentences.size > 0 && (
            <button
              type="button"
              onClick={() => setHighlightedSentences(new Set())}
              className="text-amber-700 hover:text-amber-900 font-medium underline"
            >
              Hapus Semua Stabilo ({highlightedSentences.size})
            </button>
          )}
        </div>
      </div>

      {/* Image Zoom Modal Preview */}
      {isImageModalOpen && stimulus.gambarUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between text-white max-w-5xl mx-auto w-full mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base truncate max-w-md">
                Pratinjau Infografis: {stimulus.judul}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setImageScale((prev) => Math.min(prev + 0.25, 2.5))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setImageScale((prev) => Math.max(prev - 0.25, 0.75))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {/* Reset Zoom */}
              <button
                type="button"
                onClick={() => setImageScale(1)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="Reset Ukuran"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {/* Close Modal */}
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition ml-2"
                title="Tutup Pratinjau (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Image Display */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <img
              src={stimulus.gambarUrl}
              alt={stimulus.judul}
              style={{ transform: `scale(${imageScale})` }}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-150 select-none"
            />
          </div>

          {/* Modal Footer Caption */}
          <div className="text-center text-xs text-slate-300 max-w-2xl mx-auto mt-2">
            <span>{stimulus.sumber ? `Sumber: ${stimulus.sumber}` : "Infografis Wacana Asesmen"}</span>
            <span className="mx-2">•</span>
            <span>Gunakan tombol zoom untuk memeriksa detail angka atau diagram secara lebih jelas.</span>
          </div>
        </div>
      )}
    </div>
  );
};
