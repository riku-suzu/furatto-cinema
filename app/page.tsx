"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import FavoriteButton from "@/components/FavoriteButton";

export default function TopPage() {
  const { coords, loading, error, requestLocation } = useLocation();
  const { favorites } = useFavorites();

  useEffect(() => {
    if (coords) sessionStorage.setItem("userCoords", JSON.stringify(coords));
  }, [coords]);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center pt-14 pb-10 relative overflow-hidden">
        {/* Background film reel decoration */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #dc2626, transparent)" }} />
          <div className="absolute -bottom-16 -right-10 w-80 h-80 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #dc2626, transparent)" }} />
        </div>

        <div className="relative">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#dc2626" }}>
            Now Showing Near You
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-5 leading-tight" style={{ color: "#f4f4f5" }}>
            周辺の映画館を<br />
            <span style={{ color: "#dc2626" }}>すぐに探せる</span>
          </h1>
          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: "#71717a" }}>
            現在地から半径15km圏内の映画館と上映スケジュールを一覧表示
          </p>

          {!coords ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={requestLocation}
                disabled={loading}
                className="inline-flex items-center gap-3 font-bold px-10 py-4 rounded-full text-lg transition-all duration-200 disabled:opacity-50"
                style={{ background: "#dc2626", color: "#fff" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    位置情報を取得中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    現在地から映画館を検索
                  </>
                )}
              </button>
              {error && (
                <p className="text-sm px-4 py-2 rounded-lg" style={{ color: "#fca5a5", background: "#450a0a" }}>
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium" style={{ color: "#4ade80" }}>✓ 現在地を取得しました</p>
              <Link
                href="/cinemas"
                className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-full text-lg transition-all"
                style={{ background: "#dc2626", color: "#fff" }}
              >
                周辺の映画館を見る →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold tracking-widest uppercase mb-4 flex items-center gap-2"
            style={{ color: "#dc2626" }}>
            <span style={{ color: "#fbbf24" }}>★</span> お気に入り映画館
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favorites.map((cinema) => (
              <Link
                key={cinema.id}
                href={`/cinemas/${cinema.id}`}
                className="flex items-center justify-between p-4 rounded-xl border transition-all group"
                style={{ background: "#18181b", borderColor: "#2d2d33" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#dc2626")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#2d2d33")}
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate transition-colors group-hover:text-red-400" style={{ color: "#f4f4f5" }}>
                    {cinema.name}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#52525b" }}>{cinema.address}</p>
                </div>
                <FavoriteButton cinema={cinema} className="ml-3 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features — plain text list, not buttons */}
      <section className="border-t pt-10" style={{ borderColor: "#2d2d33" }}>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: "📍", title: "現在地から検索", desc: "GPSで半径15km圏内の映画館を自動検索します" },
            { icon: "🎞", title: "上映スケジュール", desc: "映画.comのリアルタイムデータで作品・時間を確認" },
            { icon: "★", title: "お気に入り保存", desc: "よく行く映画館を登録してすぐアクセス" },
          ].map((f) => (
            <div key={f.title}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <dt className="font-bold mb-1" style={{ color: "#f4f4f5" }}>{f.title}</dt>
              <dd className="text-sm" style={{ color: "#71717a" }}>{f.desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
