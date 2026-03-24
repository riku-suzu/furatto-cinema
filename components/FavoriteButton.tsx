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
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite(cinema); }}
      aria-label={fav ? "お気に入りから削除" : "お気に入りに追加"}
      className={`transition-transform hover:scale-110 active:scale-95 ${className}`}
    >
      <span style={{ fontSize: "1.25rem", color: fav ? "#fbbf24" : "#3f3f46" }}>★</span>
    </button>
  );
}
