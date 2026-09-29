"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import FavoriteButton from "@/components/FavoriteButton";
import CurtainTransition, { CurtainHandle } from "@/components/CurtainTransition";
import ErrorBanner from "@/components/ErrorBanner";
import { buttonVariants } from "@/components/ui/button";
import { fetchNearbyCinemas } from "@/lib/api";
import { NOW_RADIUS_METERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CalendarClock, ChevronRight, Loader2, MapPin, Star, Ticket } from "lucide-react";

type Destination = "now" | "cinemas";

const FEATURES = [
  { icon: MapPin, title: "現在地から検索", desc: "GPSで半径15km圏内の映画館を自動検索" },
  { icon: CalendarClock, title: "上映スケジュール", desc: "映画.comのリアルタイムデータで作品・時間を確認" },
  { icon: Star, title: "お気に入り保存", desc: "よく行く映画館をすぐアクセス" },
];

export default function TopPage() {
  const { coords, loading, error, requestLocation } = useLocation();
  const curtainNowRef = useRef<CurtainHandle>(null);
  const curtainCinemasRef = useRef<CurtainHandle>(null);
  // ref (not state) so updating it doesn't retrigger this effect and race-cancel its own timeout
  const pendingRef = useRef<Destination | null>(null);
  const [pendingLabel, setPendingLabel] = useState<Destination | null>(null);
  // null = unknown/checking, otherwise the count of cinemas found within NOW_RADIUS_METERS
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);

  // Whenever we get coords, check whether any (eiga.com-listed) cinema is within
  // the "now" radius at all, so the button can be disabled when there's none.
  useEffect(() => {
    setNearbyCount(null);
    if (!coords) return;
    let cancelled = false;
    fetchNearbyCinemas(coords, NOW_RADIUS_METERS)
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
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(229,55,58,0.14) 0%, transparent 70%)"
        }} />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 80%)",
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold tracking-[0.2em] uppercase text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Now Playing Near You
            </p>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
              今すぐ見れる映画を<br />
              <span className="bg-clip-text text-transparent" style={{
                backgroundImage: "linear-gradient(135deg, #e5373a 0%, #ff6b6b 100%)",
              }}>探そう</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              現在地から半径15km圏内の映画館と<br className="hidden sm:block" />上映スケジュールをリアルタイム表示
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <CurtainTransition
              ref={curtainNowRef}
              href="/now"
              onClick={() => choose("now")}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-14 gap-2.5 rounded-full px-9 text-lg font-bold shadow-[0_0_40px_rgba(229,55,58,0.35)] hover:bg-primary hover:shadow-[0_0_56px_rgba(229,55,58,0.5)] [&_svg:not([class*='size-'])]:size-5",
                nowDisabled && "opacity-40 cursor-not-allowed hover:shadow-[0_0_40px_rgba(229,55,58,0.35)]"
              )}
            >
              {pendingLabel === "now" ? (
                <>
                  <Loader2 className="animate-spin" />
                  {loading ? "位置情報を取得中..." : "近くの映画館を確認中..."}
                </>
              ) : (
                <>
                  <Ticket />
                  今すぐ観れる映画を見る
                  <ChevronRight />
                </>
              )}
            </CurtainTransition>
            {nowDisabled && (
              <ErrorBanner className="w-auto">
                現在地から{NOW_RADIUS_METERS / 1000}km圏内に映画館が見つかりませんでした
              </ErrorBanner>
            )}
            <CurtainTransition
              ref={curtainCinemasRef}
              href="/cinemas"
              onClick={() => choose("cinemas")}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-14 gap-2.5 rounded-full px-9 text-lg font-bold [&_svg:not([class*='size-'])]:size-5"
              )}
            >
              {loading && pendingLabel === "cinemas" ? (
                <>
                  <Loader2 className="animate-spin" />
                  位置情報を取得中...
                </>
              ) : (
                <>
                  <MapPin />
                  周辺の映画館を見る
                </>
              )}
            </CurtainTransition>
            {error && <ErrorBanner className="w-auto">{error}</ErrorBanner>}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-transparent to-background" />
      </section>

      <FavoritesSection />

      {/* ── Features ── */}
      <section className="mt-20 pt-12 pb-8 border-t">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card/50 p-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <dt className="font-bold text-sm">{f.title}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function FavoritesSection() {
  const { favorites } = useFavorites();
  if (favorites.length === 0) return null;

  return (
    <section className="mt-16 space-y-4">
      <h2 className="text-xs font-bold tracking-[0.25em] uppercase flex items-center gap-2 text-muted-foreground">
        <Star className="size-3.5 fill-gold text-gold" /> お気に入り
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {favorites.map((cinema) => (
          <Link
            key={cinema.id}
            href={`/cinemas/${cinema.id}`}
            className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate transition-colors group-hover:text-primary">{cinema.name}</p>
              <p className="text-xs truncate mt-0.5 text-muted-foreground">{cinema.address}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <FavoriteButton cinema={cinema} className="bg-transparent" />
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
