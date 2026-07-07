"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocation } from "@/contexts/LocationContext";
import { searchNearbyCinemas } from "@/lib/googlePlaces";
import { getPosterUrl } from "@/lib/tmdb";
import { Coordinates, NearbyScreening } from "@/types";

const RADIUS_METERS = 10000;

export default function NowPlayingPage() {
  const { coords, loading: locLoading, error: locError, requestLocation } = useLocation();
  const [screenings, setScreenings] = useState<NearbyScreening[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCoords, setHasCoords] = useState(!!coords);

  const load = useCallback(async (c: Coordinates) => {
    setLoading(true);
    setError(null);
    try {
      const cinemas = await searchNearbyCinemas(c, RADIUS_METERS);
      const res = await fetch("/api/schedule/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cinemas }),
      });
      const data = await res.json();
      setScreenings(data.screenings || []);
    } catch {
      setError("上映情報の取得に失敗しました。しばらくしてから再試行してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords) {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem("userCoords") : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Coordinates;
          setHasCoords(true);
          load(parsed);
          return;
        } catch { /* ignore */ }
      }
      return;
    }
    setHasCoords(true);
    load(coords);
  }, [coords, load]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#f2f2f5" }}>今すぐ観れる映画</h1>
        <p className="text-sm mt-1" style={{ color: "#808090" }}>
          周辺{RADIUS_METERS / 1000}km圏内で、これから始まる上映を開始時刻順に表示
        </p>
      </div>

      {/* No location */}
      {!hasCoords && !locLoading && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-center"
          style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-5xl mb-6">📍</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f2f2f5" }}>位置情報が必要です</h2>
          <p className="mb-8 text-sm" style={{ color: "#808090" }}>今から観れる映画を探すために現在地を取得します</p>
          <button
            onClick={requestLocation}
            disabled={locLoading}
            className="font-bold px-8 py-3 rounded-full transition-all text-sm text-white"
            style={{ background: "#e5373a", boxShadow: "0 0 30px rgba(229,55,58,0.3)" }}
          >
            現在地を取得する
          </button>
          {locError && <p className="text-sm mt-4" style={{ color: "#fca5a5" }}>{locError}</p>}
        </div>
      )}

      {/* Loading */}
      {(loading || locLoading) && hasCoords && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#16161e" }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(229,55,58,0.1)", border: "1px solid rgba(229,55,58,0.2)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && !locLoading && screenings.length > 0 && (
        <div className="space-y-2">
          {screenings.map((s, i) => (
            <a
              key={s.id + s.cinema.id}
              href={s.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all group"
              style={{
                background: i === 0 ? "rgba(229,55,58,0.14)" : "#16161e",
                border: i === 0 ? "1px solid rgba(229,55,58,0.5)" : "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(229,55,58,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = i === 0 ? "rgba(229,55,58,0.5)" : "rgba(255,255,255,0.06)")}
            >
              {/* Poster */}
              <div className="relative w-9 h-13 flex-shrink-0 rounded-md overflow-hidden" style={{ background: "#1e1e28", width: 36, height: 52 }}>
                {s.posterPath && !s.posterPath.startsWith("/images/movie/") ? (
                  <Image src={getPosterUrl(s.posterPath, "w92")} alt={s.movieTitle} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "#808090" }}>🎬</div>
                )}
              </div>

              {/* Time */}
              <div className="flex-shrink-0 w-16 text-center">
                <p className="text-xl font-black leading-none" style={{ color: "#f2f2f5" }}>{s.startTime}</p>
                {s.endTime && <p className="text-xs mt-0.5" style={{ color: "#808090" }}>〜{s.endTime}</p>}
              </div>

              {/* Movie / cinema */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate transition-colors text-white group-hover:text-red-400">
                  {s.movieTitle}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "#808090" }}>
                  {s.cinema.name}
                  {s.cinema.distance !== undefined && (
                    <span> ・ {s.cinema.distance < 1 ? `${Math.round(s.cinema.distance * 1000)}m` : `${s.cinema.distance.toFixed(1)}km`}</span>
                  )}
                </p>
              </div>

              {/* Badges */}
              <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                {s.language && (
                  <span className="text-xs px-2 py-0.5 rounded-md whitespace-nowrap font-medium"
                    style={{ background: "rgba(147,197,253,0.1)", color: "#93c5fd", border: "1px solid rgba(147,197,253,0.15)" }}>
                    {s.language}
                  </span>
                )}
              </div>

              <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: "#e5373a" }}>
                購入 →
              </span>
            </a>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && !locLoading && hasCoords && screenings.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-center"
          style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-5xl mb-6">🎬</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f2f2f5" }}>これから始まる上映が見つかりませんでした</h2>
          <p className="text-sm" style={{ color: "#808090" }}>
            本日の上映が終了しているか、周辺に対応映画館がない可能性があります
          </p>
          <Link href="/cinemas" className="text-sm mt-4 hover:underline" style={{ color: "#e5373a" }}>
            映画館一覧から探す →
          </Link>
        </div>
      )}

      <div className="text-center pt-4">
        <Link href="/" className="text-sm transition-colors" style={{ color: "#808090" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e5373a")}
          onMouseLeave={e => (e.currentTarget.style.color = "#808090")}>
          ← トップに戻る
        </Link>
      </div>
    </div>
  );
}
