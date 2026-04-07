"use client";

import Link from "next/link";
import Image from "next/image";
import { Cinema } from "@/types";
import FavoriteButton from "./FavoriteButton";

export default function CinemaCard({ cinema }: { cinema: Cinema }) {
  return (
    <Link href={`/cinemas/${cinema.id}`} className="block group">
      <div className="relative rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]"
        style={{ aspectRatio: "16/10", background: "#16161e" }}>

        {/* Photo */}
        {cinema.photoUrl ? (
          <Image
            src={cinema.photoUrl}
            alt={cinema.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-10">🎬</span>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)"
        }} />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
          background: "rgba(229,55,58,0.08)"
        }} />

        {/* Top: distance + favorite */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          {cinema.distance !== undefined && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#e5373a", color: "#fff" }}>
              {cinema.distance < 1
                ? `${Math.round(cinema.distance * 1000)}m`
                : `${cinema.distance.toFixed(1)}km`}
            </span>
          )}
          <div className="ml-auto">
            <FavoriteButton cinema={cinema} />
          </div>
        </div>

        {/* Bottom: info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {cinema.rating && (
            <span className="text-xs font-semibold" style={{ color: "#fbbf24" }}>
              ★ {cinema.rating.toFixed(1)}
            </span>
          )}
          <h3 className="font-bold text-sm leading-snug text-white mt-0.5 line-clamp-2">
            {cinema.name}
          </h3>
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            {cinema.address}
          </p>
        </div>

        {/* Hover: "詳細を見る" reveal */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full border text-white"
            style={{ borderColor: "rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.5)" }}>
            スケジュールを見る
          </span>
        </div>
      </div>
    </Link>
  );
}
