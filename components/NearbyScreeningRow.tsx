import { MapPin } from "lucide-react";
import { NearbyScreening } from "@/types";
import { formatDistance } from "@/lib/geo";
import { minutesUntilJst } from "@/lib/time";
import { BuyBadge, LanguageBadge, PosterPlaceholder } from "./ScreeningBadges";

function StartsIn({ time }: { time: string }) {
  const min = minutesUntilJst(time);
  if (min < 0) return null;
  const soon = min <= 30;
  const label = min < 60 ? `あと${min}分` : `あと${Math.floor(min / 60)}時間${min % 60 ? `${min % 60}分` : ""}`;
  return (
    <span className={`mt-1 inline-block rounded px-1.5 py-px text-[10px] font-bold ${soon ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
      {label}
    </span>
  );
}

/** 「今すぐ観れる映画」の1上映分の行。highlightは次に始まる上映 */
export default function NearbyScreeningRow({ screening: s, highlight }: { screening: NearbyScreening; highlight: boolean }) {
  return (
    <a
      href={s.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-3 rounded-xl border px-3 py-3 sm:gap-4 sm:px-4 transition-all hover:border-primary/70 ${
        highlight ? "border-primary/50 bg-primary/[0.12]" : "bg-card"
      }`}
    >
      <PosterPlaceholder className="hidden h-[52px] w-9 sm:flex" />

      {/* Time */}
      <div className="w-14 flex-shrink-0 text-center sm:w-16">
        <p className="text-xl font-black leading-none tabular-nums">{s.startTime}</p>
        <StartsIn time={s.startTime} />
      </div>

      {/* Movie / cinema */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary sm:line-clamp-1">{s.movieTitle}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 flex-shrink-0" />
          <span className="truncate">{s.cinema.name}</span>
          {s.cinema.distance !== undefined && <span className="flex-shrink-0">・{formatDistance(s.cinema.distance)}</span>}
          {s.endTime && <span className="hidden flex-shrink-0 sm:inline">・〜{s.endTime}</span>}
        </p>
      </div>

      <div className="hidden flex-shrink-0 items-center gap-1.5 sm:flex">
        {s.language && <LanguageBadge language={s.language} />}
      </div>

      <BuyBadge />
    </a>
  );
}
