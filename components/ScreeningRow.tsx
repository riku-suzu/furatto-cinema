import Image from "next/image";
import { Screening } from "@/types";
import { getPosterUrl } from "@/lib/tmdb";
import { getSeatsStatus } from "@/lib/mockSchedule";

interface ScreeningRowProps {
  screening: Screening & { ticketUrl?: string };
}

export default function ScreeningRow({ screening }: ScreeningRowProps) {
  const isSoldOut = !screening.isPast && screening.availableSeats === 0 && !!screening.totalSeats;

  const status = (() => {
    if (screening.isPast) return { label: "上映終了", color: "#808090" };
    if (isSoldOut) return { label: "満席", color: "#808090" };
    if (screening.availableSeats !== undefined && screening.totalSeats) {
      const s = getSeatsStatus(screening.availableSeats, screening.totalSeats);
      const map: Record<string, string> = {
        "text-emerald-600": "#4ade80",
        "text-amber-600":   "#fbbf24",
        "text-red-600":     "#f87171",
        "text-gray-500":    "#808090",
      };
      return { label: s.label, color: map[s.color] ?? "#808090" };
    }
    return null;
  })();

  const isClickable = !!screening.ticketUrl && !isSoldOut && !screening.isPast;
  const dimmed = screening.isPast || isSoldOut;

  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
      style={{ borderColor: "#2e2e3a", opacity: dimmed ? 0.5 : 1 }}>
      {/* Poster */}
      <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden" style={{ background: "#2e2e3a" }}>
        {screening.posterPath && !screening.posterPath.startsWith("/images/movie/") ? (
          <Image src={getPosterUrl(screening.posterPath, "w92")} alt={screening.movieTitle} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "#808090" }}>🎬</div>
        )}
      </div>

      {/* Time */}
      <div className="flex-shrink-0 w-20">
        <p className="text-base font-black" style={{ color: dimmed ? "#808090" : "#f0f0f2" }}>
          {screening.startTime}
        </p>
        {screening.endTime && (
          <p className="text-xs" style={{ color: "#808090" }}>〜 {screening.endTime}</p>
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
        {screening.language && (
          <span className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ background: "#1e3050", color: "#93c5fd" }}>{screening.language}</span>
        )}
        {screening.format && screening.format !== "2D" && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#26262c", color: "#b8b8c2" }}>
            {screening.format}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="flex-shrink-0 text-right">
        {status ? (
          <span className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</span>
        ) : isClickable ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "#e5373a" }}>
            購入 →
          </span>
        ) : null}
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <a href={screening.ticketUrl} target="_blank" rel="noopener noreferrer" className="block hover:bg-zinc-800/50 transition-colors">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}
