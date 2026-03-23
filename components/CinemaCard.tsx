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
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:-translate-y-1">
        {/* Photo */}
        <div className="relative h-36 bg-gradient-to-br from-indigo-100 to-purple-100">
          {cinema.photoUrl ? (
            <Image
              src={cinema.photoUrl}
              alt={cinema.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-30">🎬</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <FavoriteButton cinema={cinema} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {cinema.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{cinema.address}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {cinema.distance !== undefined && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {cinema.distance < 1
                    ? `${Math.round(cinema.distance * 1000)}m`
                    : `${cinema.distance.toFixed(1)}km`}
                </span>
              )}
              {cinema.rating && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                  ★ {cinema.rating.toFixed(1)}
                </span>
              )}
            </div>
            <span className="text-xs text-indigo-500 font-medium group-hover:underline">
              スケジュール →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
