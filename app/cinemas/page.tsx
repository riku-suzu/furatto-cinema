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
  const [radius, setRadius] = useState(10000); // meters

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

  useEffect(() => {
    // Try to get coords from session storage if context not populated
    if (!coords) {
      const stored = sessionStorage.getItem("userCoords");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Coordinates;
          fetchCinemas(parsed, radius);
          return;
        } catch { /* ignore */ }
      }
      return;
    }
    fetchCinemas(coords, radius);
  }, [coords, radius, fetchCinemas]);

  const hasCoords = coords || !!sessionStorage.getItem("userCoords");

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">周辺の映画館</h1>
          {coords && (
            <p className="text-sm text-gray-400 mt-0.5">
              現在地: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Radius selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">検索範囲:</span>
          {[5000, 10000].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                radius === r
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r / 1000}km
            </button>
          ))}
        </div>
      </div>

      {/* No location */}
      {!hasCoords && !locLoading && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">位置情報が必要です</h2>
          <p className="text-gray-500 mb-6">周辺の映画館を検索するために現在地を取得します</p>
          <button
            onClick={requestLocation}
            disabled={locLoading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            現在地を取得する
          </button>
          {locError && <p className="text-red-500 text-sm mt-3">{locError}</p>}
        </div>
      )}

      {/* Loading */}
      {(loading || locLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-36 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && cinemas.length > 0 && (
        <>
          <p className="text-sm text-gray-500">{cinemas.length}件の映画館が見つかりました</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cinemas.map((cinema) => (
              <CinemaCard key={cinema.id} cinema={cinema} />
            ))}
          </div>
        </>
      )}

      {/* No results */}
      {!loading && hasCoords && cinemas.length === 0 && !error && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">映画館が見つかりませんでした</h2>
          <p className="text-gray-500 mb-4">検索範囲を広げてみてください</p>
          <button
            onClick={() => setRadius(20000)}
            className="text-indigo-600 font-medium hover:underline"
          >
            20km圏内で検索する
          </button>
        </div>
      )}

      <div className="text-center">
        <Link href="/" className="text-sm text-indigo-500 hover:underline">
          ← トップに戻る
        </Link>
      </div>
    </div>
  );
}
