import { useEffect, useRef, useState } from "react";
import { useLocation } from "@/contexts/LocationContext";
import { useCurtain } from "@/contexts/CurtainContext";
import { useNearbyCinemaCount } from "@/hooks/useNearbyCinemaCount";
import { NOW_RADIUS_METERS } from "@/lib/constants";

export type Destination = "now" | "cinemas";

const HREF: Record<Destination, string> = { now: "/now", cinemas: "/cinemas" };

/**
 * トップページのボタンからの遷移。現在地がまだなければ取得を待ってから遷移する。
 * 「今すぐ観る」は、近くに映画館があるかの確認も待ち、1館もなければ遷移しない。
 */
export function useLocationGatedNavigation() {
  const { coords, loading, error, requestLocation } = useLocation();
  const { navigate } = useCurtain();
  // Whenever we get coords, check whether any (eiga.com-listed) cinema is within
  // the "now" radius at all, so the button can be disabled when there's none.
  const nearbyCount = useNearbyCinemaCount(coords, NOW_RADIUS_METERS);
  // 位置情報の取得待ちの間に押された遷移先
  const pendingRef = useRef<Destination | null>(null);
  const [pending, setPending] = useState<Destination | null>(null);

  // 位置情報の取得待ちだった遷移を、必要なものが揃ったら実行する。
  // "cinemas" は座標だけ、"now" は近くに映画館があるかの確認結果も待つ。
  useEffect(() => {
    const target = pendingRef.current;
    if (!coords || !target) return;
    if (target === "now" && nearbyCount === null) return; // still checking
    pendingRef.current = null;
    setPending(null);
    // nearbyCount === 0: stay put, button will render as disabled with a note
    if (target === "cinemas" || nearbyCount! > 0) navigate(HREF[target]);
  }, [coords, nearbyCount, navigate]);

  // 位置情報の取得に失敗したら待機を解除する
  useEffect(() => {
    if (error) {
      pendingRef.current = null;
      setPending(null);
    }
  }, [error]);

  const nowDisabled = coords !== null && nearbyCount === 0;

  const choose = (destination: Destination) => {
    if (destination === "now" && nowDisabled) return;
    if (coords && !(destination === "now" && nearbyCount === null)) {
      navigate(HREF[destination]);
      return;
    }
    if (pendingRef.current) return; // already waiting
    pendingRef.current = destination;
    setPending(destination);
    if (!coords && !loading) requestLocation();
  };

  return {
    choose,
    /** 位置情報・映画館の確認待ちになっている遷移先 */
    pending,
    /** 近くに映画館がないので「今すぐ観る」を押せない */
    nowDisabled,
    /** 位置情報を取得中 */
    locating: loading,
    error,
  };
}
