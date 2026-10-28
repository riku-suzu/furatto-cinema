import { Clock, MapPin } from "lucide-react";
import { NearbyScreening } from "@/types";
import { formatDistance, formatStartsIn } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingButton, LanguageBadge } from "./ScreeningBadges";

/** 開始時刻ごとにまとめる（入力は開始時刻順） */
function groupByStartTime(screenings: NearbyScreening[]) {
  const groups: { time: string; screenings: NearbyScreening[] }[] = [];
  for (const s of screenings) {
    const last = groups.at(-1);
    if (last?.time === s.startTime) last.screenings.push(s);
    else groups.push({ time: s.startTime, screenings: [s] });
  }
  return groups;
}

function ScreeningCard({ screening: s }: { screening: NearbyScreening }) {
  const official = s.booking === "official";
  return (
    <a
      href={s.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-all duration-300 sm:flex-row sm:items-center sm:p-5 ${
        official ? "hover:border-foreground/30" : "hover:border-primary/50 hover:bg-primary/[0.06]"
      }`}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-base font-bold leading-snug transition-colors group-hover:text-primary">
          {s.language && <LanguageBadge language={s.language} className="mr-2 align-[2px]" />}
          {s.movieTitle}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 flex-shrink-0 text-primary" />
            <span className="truncate">{s.cinema.name}</span>
            {s.cinema.distance !== undefined && (
              <span className="flex-shrink-0 text-foreground/60">{formatDistance(s.cinema.distance)}</span>
            )}
          </span>
          {s.endTime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {s.endTime} 終了
            </span>
          )}
        </div>
      </div>
      <BookingButton booking={s.booking} className="w-full sm:w-auto" />
    </a>
  );
}

/** 「今すぐ観れる映画」の開始時刻順タイムライン */
export default function NowTimeline({ screenings }: { screenings: NearbyScreening[] }) {
  return (
    <ol>
      {groupByStartTime(screenings).map((group, gi) => {
        const next = gi === 0;
        const label = formatStartsIn(group.time);
        return (
          <li
            key={group.time}
            className="animate-rise motion-reduce:animate-none sm:grid sm:grid-cols-[6rem_1fr] sm:gap-x-6"
            style={{ animationDelay: `${Math.min(gi, 10) * 90}ms` }}
          >
            {/* 時刻（スマホでは上に横並び、PCでは左の列） */}
            <div className="pb-3 sm:pb-0 sm:pt-4 sm:text-right">
              <div className="flex items-baseline gap-2.5 sm:sticky sm:top-20 sm:block">
                <p className={`text-2xl font-black tabular-nums leading-none ${next ? "text-primary" : ""}`}>
                  {group.time}
                </p>
                {label && (
                  <p className={`text-xs font-semibold sm:mt-1.5 ${next ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
                )}
              </div>
            </div>

            {/* 線と上映 */}
            <div className="relative min-w-0 space-y-3 border-l border-border pb-10 pl-4 sm:pl-7">
              <span
                className={`absolute -left-[6px] top-5 size-[11px] rounded-full border-2 border-background ${
                  next ? "bg-primary shadow-[0_0_0_4px_rgba(229,55,58,0.2)]" : "bg-muted-foreground/60"
                }`}
              />
              {group.screenings.map((s) => (
                <ScreeningCard key={s.id + s.cinema.id} screening={s} />
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function NowTimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3 sm:grid sm:grid-cols-[6rem_1fr] sm:gap-x-6 sm:space-y-0">
          <Skeleton className="mt-4 h-6 w-16 bg-card sm:ml-auto" />
          <Skeleton className="h-24 rounded-2xl bg-card" />
        </div>
      ))}
    </div>
  );
}
