"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import FavoriteButton from "@/components/FavoriteButton";

export default function TopPage() {
  const { coords, loading, error, requestLocation } = useLocation();
  const { favorites } = useFavorites();

  // Auto-redirect to cinema list when location obtained
  useEffect(() => {
    if (coords) {
      // store coords so cinemas page can read them
      sessionStorage.setItem("userCoords", JSON.stringify(coords));
    }
  }, [coords]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          周辺の映画館を<br className="sm:hidden" />
          <span className="text-indigo-600">すぐに探せる</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
          現在地から半径10km圏内の映画館を検索し、
          今日の上映スケジュールをまとめて確認できます。
        </p>

        {!coords ? (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={requestLocation}
              disabled={loading}
              className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  取得中...
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
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              現在地を取得しました
            </div>
            <Link
              href="/cinemas"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              周辺の映画館を見る →
            </Link>
          </div>
        )}
      </section>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-yellow-400">★</span> お気に入り映画館
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favorites.map((cinema) => (
              <Link
                key={cinema.id}
                href={`/cinemas/${cinema.id}`}
                className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm hover:shadow-md border border-gray-100 hover:border-indigo-100 transition-all group"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {cinema.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{cinema.address}</p>
                </div>
                <FavoriteButton cinema={cinema} className="ml-3 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: "📍",
            title: "現在地から検索",
            desc: "GPSで半径10km圏内の映画館を自動検索",
          },
          {
            icon: "🎥",
            title: "上映スケジュール",
            desc: "作品名・開始時間・残席状況を一覧表示",
          },
          {
            icon: "★",
            title: "お気に入り保存",
            desc: "よく行く映画館をワンタップで登録・管理",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
