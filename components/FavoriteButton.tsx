"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Cinema } from "@/types";

interface FavoriteButtonProps {
  cinema: Cinema;
  className?: string;
}

export default function FavoriteButton({ cinema, className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(cinema.id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(cinema);
        toast(fav ? "お気に入りから削除しました" : "お気に入りに追加しました", { description: cinema.name });
      }}
      aria-label={fav ? "お気に入りから削除" : "お気に入りに追加"}
      aria-pressed={fav}
      className={`flex size-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 ${className}`}
    >
      <Star className={`size-4 ${fav ? "fill-gold text-gold" : "text-white/70"}`} />
    </button>
  );
}
