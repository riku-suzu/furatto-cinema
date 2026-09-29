"use client";

import { useState, useEffect } from "react";
import { Clapperboard } from "lucide-react";
import { useLocation, useResolvedCoords } from "@/contexts/LocationContext";
import { fetchNearbyCinemas } from "@/lib/api";
import { CINEMA_RADII_METERS } from "@/lib/constants";
import BackLink from "@/components/BackLink";
import CinemaCard from "@/components/CinemaCard";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import LocationPrompt from "@/components/LocationPrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Cinema } from "@/types";

const GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3";

export default function CinemasPage() {
  const { loading: locLoading } = useLocation();
  const coords = useResolvedCoords();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(CINEMA_RADII_METERS[0]);

  // サーバー側でeiga.com掲載の映画館だけに絞ってから返ってくるので、
  // ここで受け取ったものはそのまま全部表示してよい
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNearbyCinemas(coords, radius)
      .then((result) => { if (!cancelled) setCinemas(result); })
      .catch(() => { if (!cancelled) setError("映画館の取得に失敗しました。しばらくしてから再試行してください。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [coords, radius]);

  const hasCoords = coords !== null;
  const busy = loading || locLoading;

  return (
    <div className="space-y-8">
      {/* Title bar */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">周辺の映画館</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {busy ? "検索中..." : cinemas.length > 0 ? `${cinemas.length}件の映画館` : "上映スケジュールを確認できる映画館を表示"}
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={String(radius)}
          onValueChange={(v) => v && setRadius(Number(v))}
          aria-label="検索範囲"
        >
          {CINEMA_RADII_METERS.map((r) => (
            <ToggleGroupItem
              key={r}
              value={String(r)}
              className="px-3 font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              {r / 1000}km
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {!hasCoords && !locLoading && (
        <LocationPrompt description="周辺の映画館を検索するために現在地を取得します" />
      )}

      {busy && (
        <div className={GRID}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <Skeleton className="h-32 sm:h-36 rounded-none" />
              <div className="space-y-2 px-3 py-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!busy && cinemas.length > 0 && (
        <div className={GRID}>
          {cinemas.map((cinema) => (
            <CinemaCard key={cinema.id} cinema={cinema} />
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
