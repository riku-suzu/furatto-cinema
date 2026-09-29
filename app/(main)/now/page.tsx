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
import NearbyScreeningRow from "@/components/NearbyScreeningRow";
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
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-xl bg-card" />
          ))}
        </div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!busy && screenings.length > 0 && (
        <div className="space-y-2">
          {screenings.map((s, i) => (
            <NearbyScreeningRow key={s.id + s.cinema.id} screening={s} highlight={i === 0} />
          ))}
        </div>
      )}

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
