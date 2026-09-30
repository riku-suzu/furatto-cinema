import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "ふらっとシネマ - 今から観られる映画を近くの映画館から",
  description: "思い立ったらすぐ映画へ。現在地から近くの映画館と、これから始まる上映を探せます。",
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
