import Image from "next/image";
import { Screening } from "@/types";
import { getPosterUrl } from "@/lib/tmdb";
import { getSeatsStatus } from "@/lib/mockSchedule";

interface ScreeningRowProps {
  screening: Screening & { ticketUrl?: string };
}

export default function ScreeningRow({ screening }: ScreeningRowProps) {
  const seats =
    screening.availableSeats !== undefined && screening.totalSeats
      ? getSeatsStatus(screening.availableSeats, screening.totalSeats)
      : null;

  const isSoldOut = seats?.label === "満席";

  const content = (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent ${
        isSoldOut
          ? "opacity-50"
          : screening.ticketUrl
          ? "hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer"
          : "hover:bg-gray-50 hover:border-gray-100"
      }`}
    >
      {/* Poster */}
      <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {screening.posterPath && !screening.posterPath.startsWith("/images/movie/") ? (
          <Image
            src={getPosterUrl(screening.posterPath, "w92")}
            alt={screening.movieTitle}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-lg">
            🎬
          </div>
        )}
      </div>

      {/* Time */}
      <div className="text-center flex-shrink-0 w-20">
        <p className="text-lg font-bold text-gray-900">{screening.startTime}</p>
        {screening.endTime && (
          <p className="text-xs text-gray-400">{screening.endTime} 終</p>
        )}
      </div>

      {/* Movie info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
          {screening.movieTitle}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {screening.screen && (
            <span className="text-xs text-gray-500">{screening.screen}</span>
          )}
          {screening.format && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {screening.format}
            </span>
          )}
          {screening.language && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {screening.language}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="text-right flex-shrink-0">
        {seats ? (
          <span className={`text-xs font-medium ${seats.color}`}>{seats.label}</span>
        ) : screening.ticketUrl ? (
          <span className="text-xs font-medium text-indigo-600">チケット購入 →</span>
        ) : null}
      </div>
    </div>
  );

  if (screening.ticketUrl && !isSoldOut) {
    return (
      <a href={screening.ticketUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
