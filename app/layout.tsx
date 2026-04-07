import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

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
    <html lang="ja">
      <body className={`${geist.className} min-h-screen`} style={{ background: "#0d0d12", color: "#f2f2f5" }}>
        {children}
      </body>
    </html>
  );
}
