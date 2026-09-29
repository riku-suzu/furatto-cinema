"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarX, ChevronRight, ExternalLink } from "lucide-react";
import { fetchCinema, fetchSchedule } from "@/lib/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { addDays, dateParts, todayJst } from "@/lib/time";
import { Cinema, Screening } from "@/types";
import BackLink from "@/components/BackLink";
import CinemaHero from "@/components/CinemaHero";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import ShowtimeChip from "@/components/ShowtimeChip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** 今日から1週間分の日付（JST） */
function getWeekDates() {
  const today = todayJst();
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    const parts = dateParts(date);
    const label = i === 0 ? "今日" : i === 1 ? "明日" : parts.weekday;
    return { date, label, ...parts };
  });
}

/** まだ観られる回（終了・満席でない回）があるか */
const hasAvailable = (screenings: Screening[]) =>
  screenings.some((s) => !s.isPast && s.availableSeats !== 0);

/** 上映を映画ごとにまとめる（出現順を維持） */
function groupByMovie(screenings: Screening[]): Screening[][] {
  const groups = new Map<number, Screening[]>();
  for (const s of screenings) {
    groups.set(s.movieId, [...(groups.get(s.movieId) ?? []), s]);
  }
  return [...groups.values()];
}

export default function CinemaDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);

  const router = useRouter();
  const { replaceFavorite } = useFavorites();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayJst);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCinema(decodedId)
      .then((data) => {
        if (cancelled) return;
        setCinema(data);
        // 旧形式（Google place_id）のURL・お気に入りを新しいidに移行する
        if (data.id !== decodedId) {
          replaceFavorite(decodedId, data);
          router.replace(`/cinemas/${data.id}`);
        }
      })
      .catch(() => { if (!cancelled) setError("映画館が見つかりませんでした"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [decodedId, replaceFavorite, router]);

  useEffect(() => {
    if (!cinema) return;
    // 日付を素早く切り替えたとき、古いリクエストの結果で上書きしないようにする
    let cancelled = false;
    setScheduleLoading(true);
    setScheduleError(null);
    fetchSchedule(cinema.id, selectedDate)
      .then((result) => { if (!cancelled) setScreenings(result); })
      .catch(() => {
        if (cancelled) return;
        setScheduleError("スケジュールの取得に失敗しました");
        setScreenings([]);
      })
      .finally(() => { if (!cancelled) setScheduleLoading(false); });
    return () => { cancelled = true; };
  }, [cinema, selectedDate]);

  // 選んだ日に観られる回がない作品（主に今日の夜）は折りたたみに回す
  const groups = groupByMovie(screenings);
  const available = groups.filter(hasAvailable);
  const finished = groups.filter((g) => !hasAvailable(g));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 sm:h-80 rounded-2xl bg-card" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-14 rounded-lg bg-card" />
          ))}
        </div>
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

  const eigaUrl = cinema.eigaUrl;
  const eigaLink = (label: string) =>
    eigaUrl && (
      <Button asChild variant="link" size="sm" className="h-auto px-0">
        <a href={eigaUrl} target="_blank" rel="noopener noreferrer">
          {label}
          <ExternalLink />
        </a>
      </Button>
    );

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1 text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">トップ</Link>
        <ChevronRight className="size-3" />
        <Link href="/cinemas" className="hover:text-foreground transition-colors">映画館一覧</Link>
        <ChevronRight className="size-3" />
        <span className="truncate max-w-[200px] text-foreground/70">{cinema.name}</span>
      </nav>

      <CinemaHero cinema={cinema} />

      {/* ── Date picker ── */}
      <ToggleGroup
        type="single"
        spacing={2}
        value={selectedDate}
        onValueChange={(v) => v && setSelectedDate(v)}
        aria-label="日付"
        className="w-full overflow-x-auto pb-1 scrollbar-hide"
      >
        {getWeekDates().map(({ date, label, month, day, dayOfWeek }) => (
          <ToggleGroupItem
            key={date}
            value={date}
            className="h-auto min-w-14 flex-col gap-0.5 border bg-card px-3 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <span
              className={`text-[11px] font-semibold ${
                dayOfWeek === 0 ? "text-red-400" : dayOfWeek === 6 ? "text-sky-400" : "text-muted-foreground"
              } group-data-[state=on]/toggle:text-primary-foreground/80`}
            >
              {label}
            </span>
            <span className="text-base font-black tabular-nums leading-none">
              {day === 1 || date === selectedDate ? `${month}/${day}` : day}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* ── Schedule loading ── */}
      {scheduleLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-[76px] rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Schedule error ── */}
      {!scheduleLoading && scheduleError && (
        <ErrorBanner title="スケジュール取得エラー">
          <p>{scheduleError}</p>
          {eigaLink("映画.comで直接確認する")}
        </ErrorBanner>
      )}

      {/* ── No screenings ── */}
      {!scheduleLoading && !scheduleError && screenings.length === 0 && (
        <EmptyState icon={CalendarX} title="この日の上映情報がありません">
          {eigaLink("映画.comで確認する")}
        </EmptyState>
      )}

      {/* ── Screenings grouped by movie ── */}
      {!scheduleLoading && screenings.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-success shadow-[0_0_6px_var(--success)]" />
            映画.comのリアルタイムデータ
          </p>
          {available.map((group) => (
            <MovieSchedule key={group[0].movieId} screenings={group} />
          ))}
          {finished.length > 0 && (
            <details className="group/finished rounded-xl border border-dashed">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                <ChevronRight className="size-4 transition-transform group-open/finished:rotate-90" />
                本日の上映が終了した作品（{finished.length}）
              </summary>
              <div className="space-y-4 p-4 pt-0">
                {finished.map((group) => (
                  <MovieSchedule key={group[0].movieId} screenings={group} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <BackLink href="/cinemas">映画館一覧に戻る</BackLink>
    </div>
  );
}

function MovieSchedule({ screenings }: { screenings: Screening[] }) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-4 w-1 flex-shrink-0 rounded-full bg-primary" />
        <h2 className="font-bold text-sm truncate">{screenings[0].movieTitle}</h2>
        <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground">{screenings.length}回</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
        {screenings.map((s) => (
          <ShowtimeChip key={s.id} screening={s} />
        ))}
      </div>
    </section>
  );
}
