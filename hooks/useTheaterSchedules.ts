import { useEffect, useState } from "react";
import { fetchSchedules } from "@/lib/api";
import { isTheaterId } from "@/lib/theaterId";
import { TheaterSchedules } from "@/types";

/**
 * 1館分の全日付のスケジュールをまとめて1回だけ取得する（日付の切り替えは手元で行う）。
 * 旧形式のidでは取得せず、新しいidに移行してから取る。
 */
export function useTheaterSchedules(id: string) {
  const [schedules, setSchedules] = useState<TheaterSchedules | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTheaterId(id)) return;
    let cancelled = false;
    setError(null);
    fetchSchedules(id)
      .then((result) => { if (!cancelled) setSchedules(result); })
      .catch(() => { if (!cancelled) setError("スケジュールの取得に失敗しました"); });
    return () => { cancelled = true; };
  }, [id]);

  return { schedules, error };
}
