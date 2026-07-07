"use client";

export const dynamic = "force-dynamic";

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
  const [radius, setRadius] = useState(5000);
  const [hiddenIds, setHiddenIds] = useState(new Set<string>());

  const fetchCinemas = useCallback(async (c: Coordinates, r: number) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchNearbyCinemas(c, r);
      const sorted = results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
      setCinemas(sorted);
      setLoading(false);

      fetch("/api/schedule/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cinemas: sorted.map((c) => ({ id: c.id, name: c.name, address: c.address, lat: c.lat, lng: c.lng })),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if ((data.checkedPrefs ?? 0) > 0) {
            const checked: { id: string; found: boolean; confirmedAbsent?: boolean }[] = data.results ?? [];
            // Only hide cinemas we positively confirmed have no screenings today —
            // unmatched/unscraped cinemas (e.g. chain-name mismatches) stay visible.
            const absentIds = new Set<string>(checked.filter((r) => r.confirmedAbsent).map((r) => r.id));
            if (absentIds.size === 0) return;
            setCinemas((prev) => {
              const toRemove = prev.filter((c) => absentIds.has(c.id));
              if (toRemove.length === 0) return prev;
              setHiddenIds(absentIds);
              setTimeout(() => {
                setCinemas((p) => p.filter((c) => !absentIds.has(c.id)));
                setHiddenIds(new Set());
              }, 400);
              return prev;
            });
          }
        })
        .catch(() => {});
    } catch {
      setError("映画館の取得に失敗しました。APIキーを確認してください。");
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
    <div className="space-y-8">
      {/* Title bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#f2f2f5" }}>周辺の映画館</h1>
          {cinemas.length > 0 && !loading && (
            <p className="text-sm mt-1" style={{ color: "#808090" }}>{cinemas.length}件が見つかりました</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs mr-1" style={{ color: "#808090" }}>範囲:</span>
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: radius === r ? "#e5373a" : "rgba(255,255,255,0.06)",
                color: radius === r ? "#fff" : "#808090",
                border: `1px solid ${radius === r ? "#e5373a" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {r / 1000}km
            </button>
          ))}
        </div>
      </div>

      {/* No location */}
      {!hasCoords && !locLoading && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-center"
          style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-5xl mb-6">📍</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f2f2f5" }}>位置情報が必要です</h2>
          <p className="mb-8 text-sm" style={{ color: "#808090" }}>周辺の映画館を検索するために現在地を取得します</p>
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

      {/* Loading skeleton */}
      {(loading || locLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden animate-pulse h-24 sm:h-auto"
              style={{ background: "#16161e", aspectRatio: undefined }} />
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
      {!loading && cinemas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              style={{
                opacity: hiddenIds.has(cinema.id) ? 0 : 1,
                transition: "opacity 0.35s ease",
                pointerEvents: hiddenIds.has(cinema.id) ? "none" : undefined,
              }}
            >
              <CinemaCard cinema={cinema} />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && hasCoords && cinemas.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-center"
          style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-5xl mb-6">🎬</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f2f2f5" }}>映画館が見つかりませんでした</h2>
          <p className="text-sm" style={{ color: "#808090" }}>検索範囲を広げてみてください</p>
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
