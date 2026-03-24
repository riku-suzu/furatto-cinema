import Image from "next/image";
import { Screening } from "@/types";
import { getPosterUrl } from "@/lib/tmdb";
import { getSeatsStatus } from "@/lib/mockSchedule";

interface ScreeningRowProps {
  screening: Screening & { ticketUrl?: string };
}

export default function ScreeningRow({ screening }: ScreeningRowProps) {
  const isSoldOut = !screening.isPast && screening.availableSeats === 0 && screening.totalSeats !== undefined;

  const status = (() => {
    if (screening.isPast) return { label: "上映終了", color: "#52525b" };
    if (screening.availableSeats !== undefined && screening.totalSeats) {
      const s = getSeatsStatus(screening.availableSeats, screening.totalSeats);
      const colorMap: Record<string, string> = {
        "text-emerald-600": "#22c55e",
        "text-amber-600": "#f59e0b",
        "text-red-600": "#ef4444",
        "text-gray-500": "#71717a",
      };
      return { label: s.label, color: colorMap[s.color] ?? "#71717a" };
    }
    return null;
  })();

  const isClickable = !!screening.ticketUrl && !isSoldOut && !screening.isPast;

  const inner = (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
      style={{
        borderColor: "#1f1f23",
        opacity: screening.isPast ? 0.45 : 1,
        background: isClickable ? undefined : "transparent",
      }}
    >
      {/* Poster */}
      <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden" style={{ background: "#27272a" }}>
        {screening.posterPath && !screening.posterPath.startsWith("/images/movie/") ? (
          <Image src={getPosterUrl(screening.posterPath, "w92")} alt={screening.movieTitle} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "#52525b" }}>🎬</div>
        )}
      </div>

      {/* Time */}
      <div className="flex-shrink-0 w-16 text-center">
        <p className="text-base font-black" style={{ color: screening.isPast ? "#52525b" : "#f4f4f5" }}>
          {screening.startTime}
        </p>
        {screening.endTime && (
          <p className="text-xs" style={{ color: "#52525b" }}>{screening.endTime}終</p>
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-1.5 flex-1 flex-wrap">
        {screening.language && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
            {screening.language}
          </span>
        )}
        {screening.format && screening.format !== "2D" && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1c1917", color: "#d6d3d1" }}>
            {screening.format}
          </span>
        )}
      </div>

      {/* Status / ticket */}
      <div className="flex-shrink-0 text-right">
        {status ? (
          <span className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</span>
        ) : isClickable ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#dc2626", color: "#fff" }}>
            購入 →
          </span>
        ) : null}
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <a href={screening.ticketUrl} target="_blank" rel="noopener noreferrer"
        className="block hover:bg-zinc-800 transition-colors" style={{ textDecoration: "none" }}>
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}
