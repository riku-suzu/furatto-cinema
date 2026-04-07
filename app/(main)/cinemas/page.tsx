"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { searchNearbyCinemas } from "@/lib/googlePlaces";
import CinemaCard from "@/components/CinemaCard";
import { Cinema, Coordinates, Screening } from "@/types";

interface MovieResult {
  movieTitle: string;
  posterPath?: string;
  cinemas: { cinema: Cinema; times: string[] }[];
}

export default function CinemasPage() {
  const { coords, loading: locLoading, error: locError, requestLocation } = useLocation();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000);
  const [hiddenIds, setHiddenIds] = useState(new Set<string>());

  // Movie cross-search
  const [movieQuery, setMovieQuery] = useState("");
  const [movieSearching, setMovieSearching] = useState(false);
  const [movieResults, setMovieResults] = useState<MovieResult[] | null>(null);
  const cinemasRef = useRef<Cinema[]>([]);

  const fetchCinemas = useCallback(async (c: Coordinates, r: number) => {
    setLoading(true);
    setError(null);
    setMovieResults(null);
    setMovieQuery("");
    try {
      const results = await searchNearbyCinemas(c, r);
      const sorted = results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
      setCinemas(sorted);
      cinemasRef.current = sorted;
      setLoading(false);

      // eiga.comチェックはバックグラウンドで実行（フェードアウト付き）
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
            const checked: { id: string; found: boolean }[] = data.results ?? [];
            const foundIds = new Set<string>(checked.filter((r) => r.found).map((r) => r.id));
            setCinemas((prev) => {
              const toRemove = prev.filter((c) => !foundIds.has(c.id));
              if (toRemove.length === 0) return prev;
              const hideSet = new Set(toRemove.map((c) => c.id));
              setHiddenIds(hideSet);
              setTimeout(() => {
                setCinemas((p) => {
                  const filtered = p.filter((c) => foundIds.has(c.id));
                  cinemasRef.current = filtered;
                  return filtered;
                });
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

  const searchMovies = useCallback(async () => {
    const query = movieQuery.trim();
    if (!query || cinemasRef.current.length === 0) return;
    setMovieSearching(true);
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

    const schedules = await Promise.all(
      cinemasRef.current.map(async (cinema) => {
        const p = new URLSearchParams({ name: cinema.name, address: cinema.address, date: today });
        const res = await fetch(`/api/schedule?${p}`).catch(() => null);
        const data = res ? await res.json().catch(() => ({})) : {};
        return { cinema, screenings: (data.screenings ?? []) as Screening[] };
      })
    );

    const movieMap = new Map<string, MovieResult>();
    for (const { cinema, screenings } of schedules) {
      for (const s of screenings) {
        if (!s.movieTitle.toLowerCase().includes(query.toLowerCase())) continue;
        if (!movieMap.has(s.movieTitle)) {
          movieMap.set(s.movieTitle, { movieTitle: s.movieTitle, posterPath: s.posterPath, cinemas: [] });
        }
        const entry = movieMap.get(s.movieTitle)!;
        const cinemaEntry = entry.cinemas.find((c) => c.cinema.id === cinema.id);
        if (cinemaEntry) {
          if (!cinemaEntry.times.includes(s.startTime)) cinemaEntry.times.push(s.startTime);
        } else {
          entry.cinemas.push({ cinema, times: [s.startTime] });
        }
      }
    }
    setMovieResults([...movieMap.values()]);
    setMovieSearching(false);
  }, [movieQuery]);

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

      {/* Movie search bar */}
      {!loading && cinemas.length > 0 && (
        <form
          onSubmit={(e) => { e.preventDefault(); searchMovies(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={movieQuery}
            onChange={(e) => setMovieQuery(e.target.value)}
            placeholder="映画タイトルで横断検索..."
            className="flex-1 px-4 py-2 rounded-full text-sm outline-none border"
            style={{ background: "#24242e", color: "#f2f2f5", borderColor: "#3e3e50" }}
          />
          <button
            type="submit"
            disabled={movieSearching || !movieQuery.trim()}
            className="px-5 py-2 rounded-full text-sm font-bold transition-opacity disabled:opacity-40"
            style={{ background: "#e5373a", color: "#fff" }}
          >
            {movieSearching ? "検索中…" : "検索"}
          </button>
          {movieResults !== null && (
            <button
              type="button"
              onClick={() => { setMovieResults(null); setMovieQuery(""); }}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "#2e2e3a", color: "#c8c8d8", border: "1px solid #3e3e50" }}
            >
              ✕
            </button>
          )}
        </form>
      )}

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

      {/* Movie search results */}
      {movieResults !== null && !movieSearching && (
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "#9898ac" }}>
            「{movieQuery}」の上映情報 — {movieResults.length}件
          </p>
          {movieResults.length === 0 ? (
            <div className="text-center py-12 rounded-xl border" style={{ background: "#24242e", borderColor: "#3e3e50" }}>
              <p className="text-lg font-bold mb-1" style={{ color: "#f2f2f5" }}>該当する映画が見つかりませんでした</p>
              <p className="text-sm" style={{ color: "#9898ac" }}>タイトルを変えて検索してみてください</p>
            </div>
          ) : (
            movieResults.map((movie) => (
              <div key={movie.movieTitle} className="rounded-xl border p-4 space-y-3"
                style={{ background: "#24242e", borderColor: "#3e3e50" }}>
                <h3 className="font-bold text-base" style={{ color: "#f2f2f5" }}>{movie.movieTitle}</h3>
                <div className="space-y-2">
                  {movie.cinemas.map(({ cinema, times }) => (
                    <Link key={cinema.id} href={`/cinemas/${cinema.id}`}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg transition-colors hover:bg-[#2e2e3a]">
                      <span className="text-sm font-medium" style={{ color: "#c8c8d8" }}>{cinema.name}</span>
                      <div className="flex flex-wrap gap-1 justify-end shrink-0">
                        {times.sort().map((t) => (
                          <span key={t} className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: "#2e2e3a", color: "#f2f2f5", border: "1px solid #3e3e50" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cinema grid */}
      {!loading && !movieResults && cinemas.length > 0 && (
        <>
          <p className="text-xs" style={{ color: "#9898ac" }}>{cinemas.length}件の映画館が見つかりました</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <Link href="/" className="text-sm transition-colors text-[#9898ac] hover:text-[#e5373a]">
          ← トップに戻る
        </Link>
      </div>
    </div>
  );
}
