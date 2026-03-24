"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { searchNearbyCinemas } from "@/lib/googlePlaces";
import CinemaCard from "@/components/CinemaCard";
import { Cinema, Coordinates } from "@/types";

export default function CinemasPage() {
  const { coords, loading: locLoading, error: locError, requestLocation } = useLocation();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(15000);

  const fetchCinemas = useCallback(async (c: Coordinates, r: number) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchNearbyCinemas(c, r);
      setCinemas(results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)));
    } catch {
      setError("映画館の取得に失敗しました。APIキーを確認してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  const [hasCoords, setHasCoords] = useState(!!coords);

  useEffect(() => {
    if (!coords) {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem("userCoords") : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Coordinates;
          setHasCoords(true);
          fetchCinemas(parsed, radius);
          return;
        } catch { /* ignore */ }
      }
      return;
    }
    setHasCoords(true);
    fetchCinemas(coords, radius);
  }, [coords, radius, fetchCinemas]);

  const RADII = [5000, 10000, 15000];

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b" style={{ borderColor: "#3e3e50" }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#f2f2f5" }}>周辺の映画館</h1>
          {coords && (
            <p className="text-xs mt-0.5" style={{ color: "#9898ac" }}>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#9898ac" }}>検索範囲:</span>
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: radius === r ? "#e5373a" : "#2e2e3a",
                color: radius === r ? "#fff" : "#c8c8d8",
                border: `1px solid ${radius === r ? "#e5373a" : "#3e3e50"}`,
              }}
            >
              {r / 1000}km
            </button>
          ))}
        </div>
      </div>

      {/* No location */}
      {!hasCoords && !locLoading && (
        <div className="text-center py-16 rounded-xl border" style={{ background: "#24242e", borderColor: "#3e3e50" }}>
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f2f2f5" }}>位置情報が必要です</h2>
          <p className="mb-6 text-sm" style={{ color: "#c8c8d8" }}>周辺の映画館を検索するために現在地を取得します</p>
          <button
            onClick={requestLocation}
            disabled={locLoading}
            className="font-bold px-6 py-3 rounded-full transition-colors text-sm"
            style={{ background: "#e5373a", color: "#fff" }}
          >
            現在地を取得する
          </button>
          {locError && <p className="text-sm mt-3" style={{ color: "#fca5a5" }}>{locError}</p>}
        </div>
      )}

      {/* Loading skeleton */}
      {(loading || locLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border animate-pulse"
              style={{ background: "#24242e", borderColor: "#3e3e50" }}>
              <div className="h-36" style={{ background: "#2e2e3a" }} />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded w-3/4" style={{ background: "#2e2e3a" }} />
                <div className="h-3 rounded" style={{ background: "#2e2e3a" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 text-sm border" style={{ background: "#450a0a", borderColor: "#991b1b", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && cinemas.length > 0 && (
        <>
          <p className="text-xs" style={{ color: "#9898ac" }}>{cinemas.length}件の映画館が見つかりました</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cinemas.map((cinema) => (
              <CinemaCard key={cinema.id} cinema={cinema} />
            ))}
          </div>
        </>
      )}

      {/* No results */}
      {!loading && hasCoords && cinemas.length === 0 && !error && (
        <div className="text-center py-16 rounded-xl border" style={{ background: "#24242e", borderColor: "#3e3e50" }}>
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f2f2f5" }}>映画館が見つかりませんでした</h2>
          <p className="text-sm" style={{ color: "#c8c8d8" }}>検索範囲を広げてみてください</p>
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/" className="text-sm transition-colors" style={{ color: "#9898ac" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e5373a")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9898ac")}>
          ← トップに戻る
        </Link>
      </div>
    </div>
  );
}
