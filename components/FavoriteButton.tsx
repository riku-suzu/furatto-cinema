"use client";

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
        toggleFavorite(cinema);
      }}
      aria-label={fav ? "お気に入りから削除" : "お気に入りに追加"}
      className={`transition-transform hover:scale-110 active:scale-95 ${className}`}
    >
      <span
        className={`text-2xl ${fav ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
      >
        ★
      </span>
    </button>
  );
}
