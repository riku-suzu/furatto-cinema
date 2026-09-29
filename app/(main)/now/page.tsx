"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { useLocation, useResolvedCoords } from "@/contexts/LocationContext";
import { fetchNearbyScreenings } from "@/lib/api";
import { NOW_RADIUS_METERS } from "@/lib/constants";
import BackLink from "@/components/BackLink";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import LocationPrompt from "@/components/LocationPrompt";
import NowTimeline from "@/components/NowTimeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NearbyScreening } from "@/types";

export default function NowPlayingPage() {
  const { loading: locLoading } = useLocation();
  const coords = useResolvedCoords();
  const [screenings, setScreenings] = useState<NearbyScreening[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNearbyScreenings(coords)
      .then((result) => { if (!cancelled) setScreenings(result); })
      .catch(() => { if (!cancelled) setError("上映情報の取得に失敗しました。しばらくしてから再試行してください。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [coords]);

  const hasCoords = coords !== null;
  const busy = loading || locLoading;

  return (
    <div className="space-y-8">
      <BackLink href="/" position="top">トップに戻る</BackLink>

      <div>
        <h1 className="text-3xl font-black tracking-tight">今すぐ観れる映画</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          周辺{NOW_RADIUS_METERS / 1000}km圏内で、これから始まる上映を開始時刻順に表示
        </p>
      </div>

      {!hasCoords && !locLoading && (
        <LocationPrompt description="今から観れる映画を探すために現在地を取得します" />
      )}

      {busy && hasCoords && (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 sm:grid sm:grid-cols-[6rem_1fr] sm:gap-x-6 sm:space-y-0">
              <Skeleton className="mt-4 h-6 w-16 bg-card sm:ml-auto" />
              <Skeleton className="h-24 rounded-2xl bg-card" />
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!busy && screenings.length > 0 && <NowTimeline screenings={screenings} />}

      {!busy && hasCoords && screenings.length === 0 && !error && (
        <EmptyState icon={Clapperboard} title="これから始まる上映が見つかりませんでした">
          <p className="text-sm text-muted-foreground">
            本日の上映が終了しているか、周辺に対応映画館がない可能性があります
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/cinemas">映画館一覧から探す →</Link>
          </Button>
        </EmptyState>
      )}

      <BackLink href="/">トップに戻る</BackLink>
    </div>
  );
}
