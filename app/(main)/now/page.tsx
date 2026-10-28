"use client";

import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { useLocation, useResolvedCoords } from "@/contexts/LocationContext";
import { useNearbyScreenings } from "@/hooks/useNearbyScreenings";
import { NOW_RADIUS_METERS } from "@/lib/constants";
import BackLink from "@/components/BackLink";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import LocationPrompt from "@/components/LocationPrompt";
import NowTimeline, { NowTimelineSkeleton } from "@/components/NowTimeline";
import { Button } from "@/components/ui/button";

export default function NowPlayingPage() {
  const { loading: locLoading } = useLocation();
  const coords = useResolvedCoords();
  const { screenings, loading, error } = useNearbyScreenings(coords);

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

      {busy && hasCoords && <NowTimelineSkeleton />}

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
