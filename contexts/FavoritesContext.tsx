"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Cinema } from "@/types";

interface FavoritesContextType {
  favorites: Cinema[];
  isFavorite: (cinemaId: string) => boolean;
  toggleFavorite: (cinema: Cinema) => void;
  /** 旧形式のidで保存されたお気に入りを新しいidの映画館に置き換える */
  replaceFavorite: (oldId: string, cinema: Cinema) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);
const STORAGE_KEY = "furatto-cinema_favorites";
// 旧アプリ名（映画時間 / eigazikan）時代の保存キー。初回読み込み時に新しいキーへ移す
const LEGACY_STORAGE_KEY = "eigazikan_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Cinema[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
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

  const replaceFavorite = useCallback((oldId: string, cinema: Cinema) => {
    setFavorites((prev) =>
      prev.some((c) => c.id === oldId)
        ? prev.filter((c) => c.id !== cinema.id).map((c) => (c.id === oldId ? cinema : c))
        : prev
    );
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, replaceFavorite }),
    [favorites, isFavorite, toggleFavorite, replaceFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
