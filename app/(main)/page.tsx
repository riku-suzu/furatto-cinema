"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import FavoriteButton from "@/components/FavoriteButton";
import CurtainTransition, { CurtainHandle } from "@/components/CurtainTransition";
import { searchNearbyCinemas } from "@/lib/googlePlaces";

type Destination = "now" | "cinemas";

// "今すぐ観れる映画" only searches this radius — a cinema further than this
// isn't reachable "right now", so there's no point listing it.
const NOW_RADIUS_METERS = 5000;

export default function TopPage() {
  const { coords, loading, error, requestLocation } = useLocation();
  const { favorites } = useFavorites();
  const curtainNowRef = useRef<CurtainHandle>(null);
  const curtainCinemasRef = useRef<CurtainHandle>(null);
  // ref (not state) so updating it doesn't retrigger this effect and race-cancel its own timeout
  const pendingRef = useRef<Destination | null>(null);
  const [pendingLabel, setPendingLabel] = useState<Destination | null>(null);
  // null = unknown/checking, otherwise the count of cinemas found within NOW_RADIUS_METERS
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);

  // Whenever we get coords, cache them and check whether any cinema is within
  // the "now" radius at all, so the button can be disabled when there's none.
  useEffect(() => {
    if (!coords) {
      setNearbyCount(null);
      return;
    }
    sessionStorage.setItem("userCoords", JSON.stringify(coords));
    let cancelled = false;
    setNearbyCount(null);
    searchNearbyCinemas(coords, NOW_RADIUS_METERS)
      .then((cinemas) => { if (!cancelled) setNearbyCount(cinemas.length); })
      .catch(() => { if (!cancelled) setNearbyCount(0); });
    return () => { cancelled = true; };
  }, [coords]);

  // Resolve whichever navigation is pending once we have what it needs:
  // "cinemas" only needs coords; "now" also waits on the nearby-cinema check.
  useEffect(() => {
    if (!coords || !pendingRef.current) return;
    const target = pendingRef.current;
    if (target === "cinemas") {
      pendingRef.current = null;
      const t = setTimeout(() => {
        curtainCinemasRef.current?.trigger();
        setPendingLabel(null);
      }, 300);
      return () => clearTimeout(t);
    }
    // target === "now"
    if (nearbyCount === null) return; // still checking
    pendingRef.current = null;
    setPendingLabel(null);
    if (nearbyCount > 0) {
      const t = setTimeout(() => curtainNowRef.current?.trigger(), 300);
      return () => clearTimeout(t);
    }
    // nearbyCount === 0: stay put, button will render as disabled with a note
  }, [coords, nearbyCount]);

  const nowDisabled = coords !== null && nearbyCount === 0;

  const choose = (destination: Destination) => {
    if (destination === "now" && nowDisabled) return;
    if (coords) {
      if (destination === "now") {
        if (nearbyCount === null) return; // still checking, ignore extra clicks
        curtainNowRef.current?.trigger();
      } else {
        curtainCinemasRef.current?.trigger();
      }
      return;
    }
    if (loading) return;
    pendingRef.current = destination;
    setPendingLabel(destination);
    requestLocation();
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center text-center overflow-hidden -mx-5 -mt-8 px-5">

        {/* Cinematic background */}
        <div className="absolute inset-0" style={{ background: "#0d0d12" }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(229,55,58,0.12) 0%, transparent 70%)"
        }} />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "#e5373a" }}>
              Now Playing Near You
            </p>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]" style={{ color: "#f2f2f5" }}>
              今すぐ見れる映画を<br />
              <span style={{
                background: "linear-gradient(135deg, #e5373a 0%, #ff6b6b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>探そう</span>
            </h1>
            <p className="text-base sm:text-lg" style={{ color: "#808090" }}>
              現在地から半径15km圏内の映画館と<br className="hidden sm:block" />上映スケジュールをリアルタイム表示
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <CurtainTransition
              ref={curtainNowRef}
              href="/now"
              onClick={() => choose("now")}
              className="inline-flex items-center gap-3 font-bold px-10 py-4 rounded-full text-lg text-white transition-all"
              style={{
                background: "#e5373a",
                boxShadow: "0 0 40px rgba(229,55,58,0.35)",
                opacity: nowDisabled ? 0.4 : 1,
                cursor: nowDisabled ? "not-allowed" : "pointer",
              }}
            >
              {pendingLabel === "now" ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {loading ? "位置情報を取得中..." : "近くの映画館を確認中..."}
                </>
              ) : (
                "今すぐ観れる映画を見る →"
              )}
            </CurtainTransition>
            {nowDisabled && (
              <p className="text-sm px-4 py-2.5 rounded-xl text-center" style={{ color: "#fca5a5", background: "rgba(229,55,58,0.1)", border: "1px solid rgba(229,55,58,0.2)" }}>
                現在地から{NOW_RADIUS_METERS / 1000}km圏内に映画館が見つかりませんでした
              </p>
            )}
            <CurtainTransition
              ref={curtainCinemasRef}
              href="/cinemas"
              onClick={() => choose("cinemas")}
              className="inline-flex items-center gap-3 font-bold px-10 py-4 rounded-full text-lg transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "#f2f2f5", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {loading && pendingLabel === "cinemas" ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  位置情報を取得中...
                </>
              ) : (
                "周辺の映画館を見る →"
              )}
            </CurtainTransition>
            {error && (
              <p className="text-sm px-4 py-2.5 rounded-xl" style={{ color: "#fca5a5", background: "rgba(229,55,58,0.1)", border: "1px solid rgba(229,55,58,0.2)" }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: "linear-gradient(to bottom, transparent, #0d0d12)"
        }} />
      </section>

      {/* ── Favorites ── */}
      {favorites.length > 0 && (
        <section className="mt-16 space-y-4">
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase flex items-center gap-2" style={{ color: "#808090" }}>
            <span style={{ color: "#fbbf24" }}>★</span> お気に入り
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {favorites.map((cinema) => (
              <Link key={cinema.id} href={`/cinemas/${cinema.id}`}
                className="flex items-center justify-between p-4 rounded-xl transition-all group"
                style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(229,55,58,0.4)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
                <div className="min-w-0">
                  <p className="font-semibold truncate transition-colors text-white group-hover:text-red-400">
                    {cinema.name}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#808090" }}>{cinema.address}</p>
                </div>
                <FavoriteButton cinema={cinema} className="ml-3 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="mt-20 pt-12 pb-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            { icon: "📍", title: "現在地から検索", desc: "GPSで半径15km圏内の映画館を自動検索" },
            { icon: "🎞", title: "上映スケジュール", desc: "映画.comのリアルタイムデータで作品・時間を確認" },
            { icon: "★", title: "お気に入り保存", desc: "よく行く映画館をすぐアクセス" },
          ].map((f) => (
            <div key={f.title} className="space-y-3">
              <div className="text-3xl">{f.icon}</div>
              <dt className="font-bold text-sm" style={{ color: "#f2f2f5" }}>{f.title}</dt>
              <dd className="text-sm leading-relaxed" style={{ color: "#808090" }}>{f.desc}</dd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
