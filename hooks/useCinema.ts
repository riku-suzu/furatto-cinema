import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCinema } from "@/lib/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Cinema } from "@/types";

/**
 * 映画館1件を取得する。旧形式のid（Google place_id）で開かれた場合は、
 * 新しいidのURLに置き換え、お気に入りも新しいidに移行する。
 */
export function useCinema(id: string) {
  const router = useRouter();
  const { replaceFavorite } = useFavorites();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCinema(id)
      .then((data) => {
        if (cancelled) return;
        setCinema(data);
        if (data.id !== id) {
          replaceFavorite(id, data);
          router.replace(`/cinemas/${data.id}`);
        }
      })
      .catch(() => { if (!cancelled) setError("映画館が見つかりませんでした"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, replaceFavorite, router]);

  return { cinema, loading, error };
}
