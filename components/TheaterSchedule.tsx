"use client";

import { ReactNode, useState } from "react";
import { CalendarX, ChevronRight, ExternalLink } from "lucide-react";
import { Screening, TheaterSchedules } from "@/types";
import { formatDateLabel } from "@/lib/format";
import { groupByMovie, isStillAvailable } from "@/lib/screenings";
import { todayJst } from "@/lib/time";
import EmptyState from "./EmptyState";
import ErrorBanner from "./ErrorBanner";
import MovieSchedule from "./MovieSchedule";
import SegmentedControl from "./SegmentedControl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TheaterScheduleProps {
  /** 未取得ならnull */
  schedules: TheaterSchedules | null;
  error: string | null;
  /** 取得できなかった・上映がないときに案内する映画.comのページ */
  eigaUrl?: string;
}

/** まだ観られる回（終了・満席でない回）があるか */
const hasAvailable = (screenings: Screening[]) => screenings.some(isStillAvailable);

/** 映画館詳細ページの、日付の切り替えと作品ごとの上映スケジュール */
export default function TheaterSchedule({ schedules, error, eigaUrl }: TheaterScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(todayJst);

  const dates = schedules?.dates ?? [];
  const activeDate = dates.includes(selectedDate) ? selectedDate : dates[0];
  const screenings = (activeDate && schedules?.schedules[activeDate]) || [];
  const loading = !schedules && !error;
  const nextDate = dates[dates.indexOf(activeDate) + 1];

  // 選んだ日に観られる回がない作品（主に今日の夜）は折りたたみに回す
  const groups = groupByMovie(screenings);
  const available = groups.filter(hasAvailable);
  const finished = groups.filter((g) => !hasAvailable(g));

  return (
    <>
      {dates.length > 0 && (
        <div className="-mx-5 animate-rise overflow-x-auto px-5 pb-1 scrollbar-hide motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>
          <SegmentedControl
            options={dates.map((d) => ({ value: d, label: formatDateLabel(d) }))}
            value={activeDate}
            onChange={setSelectedDate}
            label="日付"
          />
        </div>
      )}

      {loading && <ScheduleSkeleton />}

      {!loading && error && (
        <ErrorBanner title="スケジュール取得エラー">
          <p>{error}</p>
          <EigaComLink href={eigaUrl}>映画.comで直接確認する</EigaComLink>
        </ErrorBanner>
      )}

      {!loading && !error && screenings.length === 0 && (
        <EmptyState icon={CalendarX} title="この日の上映情報がありません">
          <EigaComLink href={eigaUrl}>映画.comで確認する</EigaComLink>
        </EmptyState>
      )}

      {!loading && screenings.length > 0 && (
        <div key={activeDate} className="space-y-5">
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-success shadow-[0_0_6px_var(--success)]" />
            映画.comのリアルタイムデータ
          </p>
          {available.length === 0 && nextDate && (
            <AllEndedNotice nextDate={nextDate} onShowNextDate={() => setSelectedDate(nextDate)} />
          )}
          {available.map((group, i) => (
            <div key={group[0].movieId} className="animate-rise motion-reduce:animate-none" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
              <MovieSchedule screenings={group} />
            </div>
          ))}
          {finished.length > 0 && <FinishedMovies groups={finished} />}
        </div>
      )}
    </>
  );
}

function ScheduleSkeleton() {
  return (
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
  );
}

/** 映画.comの映画館ページへのリンク（URLがなければ何も出さない） */
function EigaComLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return null;
  return (
    <Button asChild variant="link" size="sm" className="h-auto px-0">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ExternalLink />
      </a>
    </Button>
  );
}

/** 選んだ日の上映がすべて終わっているときの、次の日への案内 */
function AllEndedNotice({ nextDate, onShowNextDate }: { nextDate: string; onShowNextDate: () => void }) {
  return (
    <div className="flex animate-rise flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-10 text-center motion-reduce:animate-none">
      <CalendarX className="size-6 text-muted-foreground" />
      <p className="font-bold">この日の上映はすべて終了しました</p>
      <Button onClick={onShowNextDate} className="h-10 rounded-full px-5 font-bold">
        {formatDateLabel(nextDate)}のスケジュールを見る
        <ChevronRight />
      </Button>
    </div>
  );
}

/** 上映が終わった作品（折りたたみ） */
function FinishedMovies({ groups }: { groups: Screening[][] }) {
  return (
    <details className="group/finished animate-rise rounded-xl border border-dashed motion-reduce:animate-none">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
        <ChevronRight className="size-4 transition-transform group-open/finished:rotate-90" />
        上映が終了した作品（{groups.length}）
      </summary>
      <div className="space-y-5 p-4 pt-0">
        {groups.map((group) => (
          <MovieSchedule key={group[0].movieId} screenings={group} />
        ))}
      </div>
    </details>
  );
}
