"use client";

import { useState, useMemo } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { useLocation, useResolvedCoords } from "@/contexts/LocationContext";
import { useNearbyCinemas } from "@/hooks/useNearbyCinemas";
import { CINEMA_RADII_METERS } from "@/lib/constants";
import AnimatedNumber from "@/components/AnimatedNumber";
import BackLink from "@/components/BackLink";
import { AnimatedCinemaGrid, CinemaGridSkeleton } from "@/components/CinemaGrid";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import LocationPrompt from "@/components/LocationPrompt";
import SegmentedControl from "@/components/SegmentedControl";

const RADIUS_OPTIONS = CINEMA_RADII_METERS.map((r) => ({ value: r, label: `${r / 1000}km` }));

// 詳細ページから戻ってきたときに、前回の範囲のまま出せるよう覚えておく
let lastRadius = CINEMA_RADII_METERS[0];

export default function CinemasPage() {
  const { loading: locLoading } = useLocation();
  const coords = useResolvedCoords();
  const { cinemas: allCinemas, loading, error } = useNearbyCinemas(coords);
  const [radius, setRadiusState] = useState(lastRadius);
  const setRadius = (r: number) => {
    lastRadius = r;
    setRadiusState(r);
  };

  const cinemas = useMemo(
    () => allCinemas.filter((c) => (c.distance ?? Infinity) <= radius / 1000),
    [allCinemas, radius]
  );

  const hasCoords = coords !== null;
  const busy = loading || locLoading;
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

      {initialLoading && <CinemaGridSkeleton />}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* 範囲を切り替えたときは今のリストを残したまま差分だけ出し入れする */}
      <AnimatedCinemaGrid cinemas={cinemas} dimmed={busy} />

      {!busy && hasCoords && cinemas.length === 0 && !error && (
        <EmptyState icon={Clapperboard} title="映画館が見つかりませんでした">
          <p className="text-sm text-muted-foreground">検索範囲を広げてみてください</p>
        </EmptyState>
      )}

      <BackLink href="/">トップに戻る</BackLink>
    </div>
  );
}
