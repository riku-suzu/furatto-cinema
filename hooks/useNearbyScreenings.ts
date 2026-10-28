import { useEffect, useState } from "react";
import { fetchNearbyScreenings } from "@/lib/api";
import { Coordinates, NearbyScreening } from "@/types";

/** 近隣の映画館の、これから始まる購入可能な上映（開始時刻順） */
export function useNearbyScreenings(coords: Coordinates | null) {
  const [screenings, setScreenings] = useState<NearbyScreening[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNearbyScreenings(coords)
      .then((result) => { if (!cancelled) setScreenings(result); })
      .catch(() => { if (!cancelled) setError("上映情報の取得に失敗しました。しばらくしてから再試行してください。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [coords]);

  return { screenings, loading, error };
}
