"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Cinema } from "@/types";

interface FavoritesContextType {
  favorites: Cinema[];
  isFavorite: (cinemaId: string) => boolean;
  toggleFavorite: (cinema: Cinema) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);
const STORAGE_KEY = "eigazikan_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Cinema[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, loaded]);

  const isFavorite = useCallback(
    (cinemaId: string) => favorites.some((c) => c.id === cinemaId),
    [favorites]
  );

  const toggleFavorite = useCallback((cinema: Cinema) => {
    setFavorites((prev) => {
      const exists = prev.some((c) => c.id === cinema.id);
      return exists ? prev.filter((c) => c.id !== cinema.id) : [...prev, cinema];
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
