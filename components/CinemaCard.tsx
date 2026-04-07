"use client";

import Link from "next/link";
import Image from "next/image";
import { Cinema } from "@/types";
import FavoriteButton from "./FavoriteButton";

export default function CinemaCard({ cinema }: { cinema: Cinema }) {
  const distanceLabel = cinema.distance !== undefined
    ? (cinema.distance < 1
        ? `${Math.round(cinema.distance * 1000)}m`
        : `${cinema.distance.toFixed(1)}km`)
    : null;

  return (
    <Link href={`/cinemas/${cinema.id}`} className="block group">
      <div className="rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5"
        style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(229,55,58,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>

        {/* Image */}
        <div className="relative h-32 sm:h-36" style={{ background: "#1e1e28" }}>
          {cinema.photoUrl ? (
            <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl opacity-10">🎬</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(22,22,30,0.6) 0%, transparent 60%)" }} />

          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
            {distanceLabel && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#e5373a", color: "#fff" }}>
                {distanceLabel}
              </span>
            )}
            <div className="ml-auto">
              <FavoriteButton cinema={cinema} />
            </div>
          </div>
        </div>

        {/* Text — 画像の外 */}
        <div className="px-3 py-2.5">
          <h3 className="font-bold text-sm leading-snug text-white line-clamp-2 group-hover:text-red-400 transition-colors">
            {cinema.name}
          </h3>
          <p className="text-xs mt-1 line-clamp-1" style={{ color: "#808090" }}>
            {cinema.address}
          </p>
        </div>
      </div>
    </Link>
  );
}
