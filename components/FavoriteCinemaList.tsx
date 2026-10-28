"use client";

import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import FavoriteButton from "./FavoriteButton";

/** トップページのお気に入りの映画館一覧（お気に入りがなければ何も出さない） */
export default function FavoriteCinemaList() {
  const { favorites } = useFavorites();
  if (favorites.length === 0) return null;

  return (
    <section className="mt-16 space-y-4">
      <h2 className="text-xs font-bold tracking-[0.25em] uppercase flex items-center gap-2 text-muted-foreground">
        <Star className="size-3.5 fill-gold text-gold" /> お気に入り
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {favorites.map((cinema) => (
          <Link
            key={cinema.id}
            href={`/cinemas/${cinema.id}`}
            className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate transition-colors group-hover:text-primary">{cinema.name}</p>
              <p className="text-xs truncate mt-0.5 text-muted-foreground">{cinema.address}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <FavoriteButton cinema={cinema} className="bg-transparent" />
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
