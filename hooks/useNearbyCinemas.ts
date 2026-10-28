import { useEffect, useState } from "react";
import { fetchNearbyCinemas } from "@/lib/api";
import { CINEMA_RADII_METERS } from "@/lib/constants";
import { Cinema, Coordinates } from "@/types";

// 最大範囲で1回だけ取得して、範囲の切り替えは手元で絞り込む（切り替えのたびに読み込まない）
const MAX_RADIUS_METERS = Math.max(...CINEMA_RADII_METERS);

// 詳細ページから戻ってきたときに、前回の一覧をすぐ出せるよう覚えておく
// （モジュールの変数なのでページを再読み込みするまで保持される）
let lastResult: { coordsKey: string; cinemas: Cinema[] } | null = null;
const coordsKey = (c: Coordinates) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;

/**
 * 現在地から最大範囲内の、eiga.com掲載の映画館（近い順）。
 * サーバー側でeiga.com掲載の映画館だけに絞ってから返ってくるので、そのまま全部表示してよい。
 */
export function useNearbyCinemas(coords: Coordinates | null) {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    const key = coordsKey(coords);
    const cached = lastResult?.coordsKey === key ? lastResult.cinemas : null;
    let cancelled = false;
    if (cached) setCinemas(cached);
    // 覚えている一覧があれば、それを出したまま裏で最新にする
    setLoading(!cached);
    setError(null);
    fetchNearbyCinemas(coords, MAX_RADIUS_METERS)
      .then((result) => {
        if (cancelled) return;
        lastResult = { coordsKey: key, cinemas: result };
        setCinemas(result);
      })
      .catch(() => { if (!cancelled) setError("映画館の取得に失敗しました。しばらくしてから再試行してください。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [coords]);

  return { cinemas, loading, error };
}
