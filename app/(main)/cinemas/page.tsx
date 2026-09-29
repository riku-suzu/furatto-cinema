"use client";

import { useState, useEffect, useMemo } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { useLocation, useResolvedCoords } from "@/contexts/LocationContext";
import { fetchNearbyCinemas } from "@/lib/api";
import { CINEMA_RADII_METERS } from "@/lib/constants";
import AnimatedNumber from "@/components/AnimatedNumber";
import BackLink from "@/components/BackLink";
import CinemaCard from "@/components/CinemaCard";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import LocationPrompt from "@/components/LocationPrompt";
import SegmentedControl from "@/components/SegmentedControl";
import { Skeleton } from "@/components/ui/skeleton";
import { Cinema, Coordinates } from "@/types";
import { useAnimatedList } from "@/hooks/useAnimatedList";

const GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6";
const RADIUS_OPTIONS = CINEMA_RADII_METERS.map((r) => ({ value: r, label: `${r / 1000}km` }));

const cinemaKey = (c: Cinema) => c.id;

// 最大範囲で1回だけ取得して、範囲の切り替えは手元で絞り込む（切り替えのたびに読み込まない）
const MAX_RADIUS_METERS = Math.max(...CINEMA_RADII_METERS);

// 詳細ページから戻ってきたときに、前回の一覧と範囲をすぐ出せるよう覚えておく
// （モジュールの変数なのでページを再読み込みするまで保持される）
let lastResult: { coordsKey: string; cinemas: Cinema[] } | null = null;
let lastRadius = CINEMA_RADII_METERS[0];
const coordsKey = (c: Coordinates) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;

export default function CinemasPage() {
  const { loading: locLoading } = useLocation();
  const coords = useResolvedCoords();
  const [allCinemas, setAllCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadiusState] = useState(lastRadius);
  const setRadius = (r: number) => {
    lastRadius = r;
    setRadiusState(r);
  };

  // サーバー側でeiga.com掲載の映画館だけに絞ってから返ってくるので、
  // ここで受け取ったものはそのまま全部表示してよい
  useEffect(() => {
    if (!coords) return;
    const key = coordsKey(coords);
    const cached = lastResult?.coordsKey === key ? lastResult.cinemas : null;
    let cancelled = false;
    if (cached) setAllCinemas(cached);
    // 覚えている一覧があれば、それを出したまま裏で最新にする
    setLoading(!cached);
    setError(null);
    fetchNearbyCinemas(coords, MAX_RADIUS_METERS)
      .then((result) => {
        if (cancelled) return;
        lastResult = { coordsKey: key, cinemas: result };
        setAllCinemas(result);
      })
      .catch(() => { if (!cancelled) setError("映画館の取得に失敗しました。しばらくしてから再試行してください。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [coords]);

  const cinemas = useMemo(
    () => allCinemas.filter((c) => (c.distance ?? Infinity) <= radius / 1000),
    [allCinemas, radius]
  );

  const hasCoords = coords !== null;
  const busy = loading || locLoading;
  // 範囲を切り替えたときは今のリストを残したまま差分だけ出し入れする
  const listed = useAnimatedList(cinemas, cinemaKey);
  const initialLoading = busy && cinemas.length === 0;

  return (
    <div className="space-y-8">
      <BackLink href="/" position="top">トップに戻る</BackLink>

      {/* Title bar */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">周辺の映画館</h1>
          <p className="mt-1 flex h-5 items-center gap-1.5 text-sm text-muted-foreground">
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {cinemas.length > 0 ? (
              <>
                <AnimatedNumber value={cinemas.length} />件の映画館
              </>
            ) : busy ? (
              "検索中..."
            ) : (
              "上映スケジュールを確認できる映画館を表示"
            )}
          </p>
        </div>
        <SegmentedControl options={RADIUS_OPTIONS} value={radius} onChange={setRadius} label="検索範囲" />
      </div>

      {!hasCoords && !locLoading && (
        <LocationPrompt description="周辺の映画館を検索するために現在地を取得します" />
      )}

      {initialLoading && (
        <div className={GRID}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {listed.length > 0 && (
        <div className={`${GRID} transition-opacity duration-500 ${busy ? "opacity-60" : ""}`}>
          {listed.map(({ key, item, state, delayMs }) => (
            <div
              key={key}
              className={
                state === "enter"
                  ? "animate-rise motion-reduce:animate-none"
                  : state === "exit"
                  ? "pointer-events-none animate-sink motion-reduce:animate-none"
                  : undefined
              }
              style={state !== "stay" ? { animationDelay: `${delayMs}ms` } : undefined}
            >
              <CinemaCard cinema={item} />
            </div>
          ))}
        </div>
      )}

      {!busy && hasCoords && cinemas.length === 0 && !error && (
        <EmptyState icon={Clapperboard} title="映画館が見つかりませんでした">
          <p className="text-sm text-muted-foreground">検索範囲を広げてみてください</p>
        </EmptyState>
      )}

      <BackLink href="/">トップに戻る</BackLink>
    </div>
  );
}
