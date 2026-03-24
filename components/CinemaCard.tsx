"use client";

import Link from "next/link";
import Image from "next/image";
import { Cinema } from "@/types";
import FavoriteButton from "./FavoriteButton";

export default function CinemaCard({ cinema }: { cinema: Cinema }) {
  return (
    <Link href={`/cinemas/${cinema.id}`} className="block group">
      <div className="rounded-xl overflow-hidden border transition-all duration-200 group-hover:-translate-y-0.5"
        style={{ background: "#24242e", borderColor: "#3e3e50" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#e5373a")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#3e3e50")}>
        <div className="relative h-36" style={{ background: "#1a1a22" }}>
          {cinema.photoUrl ? (
            <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover opacity-75" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10">🎬</div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #24242e 0%, transparent 55%)" }} />
          <div className="absolute top-2 right-2"><FavoriteButton cinema={cinema} /></div>
          {cinema.distance !== undefined && (
            <div className="absolute bottom-2 left-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ background: "#e5373a" }}>
                {cinema.distance < 1 ? `${Math.round(cinema.distance * 1000)}m` : `${cinema.distance.toFixed(1)}km`}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2 transition-colors group-hover:text-red-400"
            style={{ color: "#f0f0f2" }}>{cinema.name}</h3>
          <p className="text-xs line-clamp-1 mb-3" style={{ color: "#9898ac" }}>{cinema.address}</p>
          <div className="flex items-center justify-between">
            {cinema.rating
              ? <span className="text-xs font-semibold" style={{ color: "#fbbf24" }}>★ {cinema.rating.toFixed(1)}</span>
              : <span />}
            <span className="text-xs font-medium transition-colors group-hover:text-red-400" style={{ color: "#9898ac" }}>
              スケジュール →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
