"use client";

import { use } from "react";
import { useCinema } from "@/hooks/useCinema";
import { useTheaterSchedules } from "@/hooks/useTheaterSchedules";
import BackLink from "@/components/BackLink";
import CinemaHero from "@/components/CinemaHero";
import ErrorBanner from "@/components/ErrorBanner";
import TheaterSchedule from "@/components/TheaterSchedule";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CinemaDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);

  const { cinema, loading, error } = useCinema(decodedId);
  // スケジュールは映画館情報と並行して取りに行く
  const { schedules, error: scheduleError } = useTheaterSchedules(decodedId);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 sm:h-80 rounded-2xl bg-card" />
        <Skeleton className="h-10 w-72 rounded-full bg-card" />
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <div className="space-y-4 py-16">
        <ErrorBanner>{error || "映画館が見つかりませんでした"}</ErrorBanner>
        <BackLink href="/cinemas">映画館一覧に戻る</BackLink>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackLink href="/cinemas" position="top">映画館一覧に戻る</BackLink>

      <div className="animate-rise motion-reduce:animate-none">
        <CinemaHero cinema={cinema} />
      </div>

      <TheaterSchedule schedules={schedules} error={scheduleError} eigaUrl={cinema.eigaUrl} />

      <BackLink href="/cinemas">映画館一覧に戻る</BackLink>
    </div>
  );
}
