import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "映画時間 - 周辺映画館の上映スケジュール",
  description: "現在地から周辺の映画館を検索し、上映スケジュールを確認できます。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`dark ${geist.variable}`}>
      <body className="min-h-screen">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
