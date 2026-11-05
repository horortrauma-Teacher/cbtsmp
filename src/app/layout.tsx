import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBT EduNusantara - Platform Ujian & AKM SMP Fase D / SMA",
  description: "Platform Computer Based Test (CBT) modern berbasis Asesmen Kompetensi Minimum (AKM) Literasi, Numerasi, dan HOTS untuk siswa SMP dan SMA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
