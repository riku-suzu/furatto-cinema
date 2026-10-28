import { useEffect, useState } from "react";
import { fetchNearbyCinemas } from "@/lib/api";
import { Coordinates } from "@/types";

/**
 * 半径内にあるeiga.com掲載の映画館の数。座標がない・確認中はnull。
 * 確認に失敗したときは0（= 近くにない）として扱う。
 */
export function useNearbyCinemaCount(coords: Coordinates | null, radiusMeters: number): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(null);
    if (!coords) return;
    let cancelled = false;
    fetchNearbyCinemas(coords, radiusMeters)
      .then((cinemas) => { if (!cancelled) setCount(cinemas.length); })
      .catch(() => { if (!cancelled) setCount(0); });
    return () => { cancelled = true; };
  }, [coords, radiusMeters]);

  return count;
}
