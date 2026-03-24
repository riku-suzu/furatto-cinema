"use client";

import Link from "next/link";
import Image from "next/image";
import { Cinema } from "@/types";
import FavoriteButton from "./FavoriteButton";

interface CinemaCardProps {
  cinema: Cinema;
}

export default function CinemaCard({ cinema }: CinemaCardProps) {
  return (
    <Link href={`/cinemas/${cinema.id}`} className="block group">
      <div
        className="rounded-xl overflow-hidden border transition-all duration-300"
        style={{ background: "#18181b", borderColor: "#2d2d33" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#dc2626";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#2d2d33";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Photo */}
        <div className="relative h-36" style={{ background: "#111113" }}>
          {cinema.photoUrl ? (
            <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover opacity-80" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-10">🎬</span>
            </div>
          )}
          {/* Red gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #18181b 0%, transparent 60%)" }} />
          <div className="absolute top-2 right-2">
            <FavoriteButton cinema={cinema} />
          </div>
          {cinema.distance !== undefined && (
            <div className="absolute bottom-2 left-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: "#dc2626", color: "#fff" }}>
                {cinema.distance < 1
                  ? `${Math.round(cinema.distance * 1000)}m`
                  : `${cinema.distance.toFixed(1)}km`}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2 transition-colors group-hover:text-red-400"
            style={{ color: "#f4f4f5" }}>
            {cinema.name}
          </h3>
          <p className="text-xs line-clamp-1 mb-3" style={{ color: "#52525b" }}>{cinema.address}</p>
          <div className="flex items-center justify-between">
            {cinema.rating ? (
              <span className="text-xs font-semibold" style={{ color: "#fbbf24" }}>
                ★ {cinema.rating.toFixed(1)}
              </span>
            ) : <span />}
            <span className="text-xs font-medium transition-colors group-hover:text-red-400"
              style={{ color: "#71717a" }}>
              スケジュール →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
