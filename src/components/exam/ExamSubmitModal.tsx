"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Flag,
  FileCheck,
  X,
  ArrowLeft,
  Send,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Database
} from "lucide-react";
import { Soal } from "@/types/cbt";
import { QuestionAnswerState } from "./QuestionArea";
import { isQuestionAnswered } from "./QuestionNavGrid";

interface ExamSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  soalList: Soal[];
  answers: { [soalId: string]: QuestionAnswerState };
  remainingSeconds: number;
  isSubmitting?: boolean;
  submitError?: string | null;
  onRetrySubmit?: () => void;
}

export const ExamSubmitModal: React.FC<ExamSubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  soalList,
  answers,
  remainingSeconds,
  isSubmitting = false,
  submitError = null,
  onRetrySubmit,
}) => {
  const [confirmedAgreement, setConfirmedAgreement] = useState(false);

  if (!isOpen) return null;

  // Calculate statistics
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
  const hasIncompleteQuestions = unansweredCount > 0 || raguCount > 0;

  // Format remaining time
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTimer = `${minutes} Menit ${seconds} Detik`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* ============================================================== */}
        {/* CASE 1: SEDANG MENGIRIM & MEMVERIFIKASI KE SERVER DATABASE   */}
        {/* ============================================================== */}
        {isSubmitting ? (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-sky-100 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
                <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900">
                Memverifikasi & Menyimpan ke Server...
              </h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Sistem sedang mengirim lembar jawaban ke database server Supabase dan menunggu konfirmasi tersimpan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Jawaban Anda tetap tersimpan aman di browser sampai ada konfirmasi server.</span>
            </div>
          </div>
        ) : submitError ? (
          /* ============================================================== */
          /* CASE 2: KONEKSI GANGGUAN / TIMEOUT - ANTI JAWABAN HILANG      */
          /* ============================================================== */
          <div className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Gagal Terhubung ke Database
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Koneksi Database Sedang Gangguan
                </h2>
              </div>
            </div>

            {/* Kotak Pesan Proteksi Anti-Hilang */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-2 text-xs">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Jawaban Anda 100% AMAN di perangkat ini.
              </p>
              <p className="text-amber-800 leading-relaxed">
                Server database tidak merespons atau sedang waktu tunggu (timeout). Sistem <strong className="text-rose-700 font-black">TIDAK MENGHAPUS</strong> lembar jawaban Anda.
              </p>
              <div className="mt-2 p-2 bg-white/80 rounded-lg border border-amber-200 font-mono text-[11px] text-slate-600 break-all">
                Detail: {submitError}
              </div>
            </div>

            {/* Tombol Aksi Retry & Kembali */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onRetrySubmit || onConfirmSubmit}
                className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Klik di sini untuk Kirim Ulang</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Tutup & Cek Soal</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* CASE 3: TAMPILAN NORMAL KONFIRMASI PENGUMPULAN UJIAN          */
          /* ============================================================== */
          <>
            {/* Modal Top Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Konfirmasi Kumpulkan Ujian
                  </h2>
                  <p className="text-xs text-slate-500">
                    Periksa kembali ringkasan jawaban sebelum mengakhiri sesi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-700 block">
                    Sudah Dijawab
                  </span>
                  <span className="text-2xl font-black text-emerald-800 mt-1 block">
                    {answeredCount}
                  </span>
                  <span className="text-[10px] text-emerald-600">dari {total} Soal</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xs font-semibold text-amber-700 block">
                    Masih Ragu
                  </span>
                  <span className="text-2xl font-black text-amber-800 mt-1 block">
                    {raguCount}
                  </span>
                  <span className="text-[10px] text-amber-600">tanda bendera</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-xs font-semibold text-rose-700 block">
                    Belum Dijawab
                  </span>
                  <span className="text-2xl font-black text-rose-800 mt-1 block">
                    {unansweredCount}
                  </span>
                  <span className="text-[10px] text-rose-600">soal kosong</span>
                </div>
              </div>

              {/* Remaining Time Notice */}
              <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Sisa Waktu Pengerjaan Anda:</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{formattedTimer}</span>
              </div>

              {/* Warning Alert if there are unfinished or flagged questions */}
              {hasIncompleteQuestions && (
                <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Perhatian: Ada Soal Belum Selesai!</p>
                    <p className="text-amber-900/90 leading-relaxed">
                      {unansweredCount > 0 &&
                        `Masih terdapat ${unansweredCount} nomor soal yang belum dijawab sama sekali. `}
                      {raguCount > 0 &&
                        `Terdapat ${raguCount} nomor soal berstatus ragu-ragu. `}
                      Apakah Anda yakin ingin menyelesaikan ujian sekarang?
                    </p>
                  </div>
                </div>
              )}

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={confirmedAgreement}
                  onChange={(e) => setConfirmedAgreement(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  Saya telah memeriksa lembar jawaban dan menyatakan dengan sungguh-sungguh untuk mengakhiri sesi ujian ini secara final.
                </span>
              </label>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Kembali Periksa Jawaban</span>
              </button>

              <button
                type="button"
                onClick={onConfirmSubmit}
                disabled={!confirmedAgreement}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  confirmedAgreement
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Ya, Selesaikan Ujian</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
