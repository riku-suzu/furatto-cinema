import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { LocationProvider } from "@/contexts/LocationContext";

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
      <body className={`${geist.className} min-h-screen`} style={{ background: "#1a1a22", color: "#f2f2f5" }}>
        <FavoritesProvider>
          <LocationProvider>
            <Header />
            <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
          </LocationProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
