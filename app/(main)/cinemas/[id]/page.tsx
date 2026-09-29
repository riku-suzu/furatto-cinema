"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, ChevronRight, ExternalLink } from "lucide-react";
import { fetchCinema, fetchSchedules } from "@/lib/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { addDays, dateParts, todayJst } from "@/lib/time";
import { Cinema, Screening } from "@/types";
import BackLink from "@/components/BackLink";
import CinemaHero from "@/components/CinemaHero";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SegmentedControl from "@/components/SegmentedControl";
import ShowtimeChip from "@/components/ShowtimeChip";
import { LanguageBadge, languageLabel } from "@/components/ScreeningBadges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Schedules {
  dates: string[];
  schedules: Record<string, Screening[]>;
}

/** eiga.comの館ID（"13-130201-3263"）か。旧形式のGoogle place_idでなければtrue */
const isTheaterId = (id: string) => /^\d{1,2}-\d+-\d+$/.test(id);

/** "2026-09-29" → "今日 9/29" / "明日 9/30" / "木 10/1" */
function dateLabel(date: string): string {
  const { month, day, weekday } = dateParts(date);
  const today = todayJst();
  const prefix = date === today ? "今日" : date === addDays(today, 1) ? "明日" : weekday;
  return `${prefix} ${month}/${day}`;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 全日付分をまとめて1回だけ取得し、日付の切り替えは手元で行う
  const [schedules, setSchedules] = useState<Schedules | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayJst);

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

  // スケジュールは映画館情報と並行して取りに行く（旧形式のidは移行後のidで取る）
  useEffect(() => {
    if (!isTheaterId(decodedId)) return;
    let cancelled = false;
    setScheduleError(null);
    fetchSchedules(decodedId)
      .then((result) => { if (!cancelled) setSchedules(result); })
      .catch(() => { if (!cancelled) setScheduleError("スケジュールの取得に失敗しました"); });
    return () => { cancelled = true; };
  }, [decodedId]);

  const dates = schedules?.dates ?? [];
  const activeDate = dates.includes(selectedDate) ? selectedDate : dates[0];
  const screenings = (activeDate && schedules?.schedules[activeDate]) || [];
  const scheduleLoading = !schedules && !scheduleError;
  const nextDate = dates[dates.indexOf(activeDate) + 1];

  // 選んだ日に観られる回がない作品（主に今日の夜）は折りたたみに回す
  const groups = groupByMovie(screenings);
  const available = groups.filter(hasAvailable);
  const finished = groups.filter((g) => !hasAvailable(g));

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
      <BackLink href="/cinemas" position="top">映画館一覧に戻る</BackLink>

      <div className="animate-rise motion-reduce:animate-none">
        <CinemaHero cinema={cinema} />
      </div>

      {/* ── Date picker ── */}
      {dates.length > 0 && (
        <div className="-mx-5 animate-rise overflow-x-auto px-5 pb-1 scrollbar-hide motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>
          <SegmentedControl
            options={dates.map((d) => ({ value: d, label: dateLabel(d) }))}
            value={activeDate}
            onChange={setSelectedDate}
            label="日付"
          />
        </div>
      )}

      {/* ── Schedule loading ── */}
      {scheduleLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 space-y-4 sm:p-6">
              <Skeleton className="h-5 w-1/3" />
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-[84px] rounded-xl" />
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
        <div key={activeDate} className="space-y-5">
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-success shadow-[0_0_6px_var(--success)]" />
            映画.comのリアルタイムデータ
          </p>
          {available.length === 0 && nextDate && (
            <div className="flex animate-rise flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-10 text-center motion-reduce:animate-none">
              <CalendarX className="size-6 text-muted-foreground" />
              <p className="font-bold">この日の上映はすべて終了しました</p>
              <Button onClick={() => setSelectedDate(nextDate)} className="h-10 rounded-full px-5 font-bold">
                {dateLabel(nextDate)}のスケジュールを見る
                <ChevronRight />
              </Button>
            </div>
          )}
          {available.map((group, i) => (
            <div key={group[0].movieId} className="animate-rise motion-reduce:animate-none" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
              <MovieSchedule screenings={group} />
            </div>
          ))}
          {finished.length > 0 && (
            <details className="group/finished animate-rise rounded-xl border border-dashed motion-reduce:animate-none">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                <ChevronRight className="size-4 transition-transform group-open/finished:rotate-90" />
                上映が終了した作品（{finished.length}）
              </summary>
              <div className="space-y-5 p-4 pt-0">
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
  // 字幕・吹替が両方ある作品は行を分け、片方だけならタイトルの横にバッジで出す
  const byLanguage = new Map<string, Screening[]>();
  for (const s of screenings) {
    const key = s.language ?? "";
    byLanguage.set(key, [...(byLanguage.get(key) ?? []), s]);
  }
  const languages = [...byLanguage.keys()];
  const split = languages.length > 1;

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-1 h-5 w-1 flex-shrink-0 rounded-full bg-primary" />
        <h2 className="text-base font-bold leading-snug">
          {screenings[0].movieTitle}
          {!split && languages[0] && <LanguageBadge language={languages[0]} className="ml-2 align-[2px]" />}
        </h2>
        <span className="ml-auto flex-shrink-0 pt-0.5 text-xs text-muted-foreground">{screenings.length}回</span>
      </div>
      <div className="space-y-4">
        {[...byLanguage].map(([language, list]) => (
          <div key={language}>
            {split && (
              <p className="mb-2 text-xs font-bold text-lang">{language ? languageLabel(language) : "その他"}</p>
            )}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {list.map((s) => (
                <ShowtimeChip key={s.id} screening={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
