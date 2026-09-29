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
import { Coordinates } from "@/types";

interface LocationContextType {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

// 取得した現在地はタブを閉じるまで保持し、リロード後も一覧ページで使い回す
const COORDS_KEY = "userCoords";

function readStoredCoords(): Coordinates | null {
  try {
    const stored = sessionStorage.getItem(COORDS_KEY);
    return stored ? (JSON.parse(stored) as Coordinates) : null;
  } catch {
    return null;
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  1: "位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください",
  2: "位置情報を取得できませんでした。しばらくしてから再試行してください",
  3: "位置情報の取得がタイムアウトしました。再度お試しください",
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報に対応していません");
      return;
    }
    setLoading(true);
    setError(null);
    // スマホでは enableHighAccuracy: false の方が成功しやすい
    const attempt = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          try {
            sessionStorage.setItem(COORDS_KEY, JSON.stringify(next));
          } catch { /* ignore */ }
          setCoords(next);
          setLoading(false);
        },
        (err) => {
          // 高精度で失敗した場合は低精度で再試行
          if (highAccuracy && err.code !== err.PERMISSION_DENIED) {
            attempt(false);
            return;
          }
          setError(ERROR_MESSAGES[err.code] || "位置情報の取得に失敗しました");
          setLoading(false);
        },
        { timeout: highAccuracy ? 10000 : 20000, maximumAge: 60000, enableHighAccuracy: highAccuracy }
      );
    };
    attempt(true);
  }, []);

  const value = useMemo(
    () => ({ coords, loading, error, requestLocation }),
    [coords, loading, error, requestLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}

/**
 * 現在地。このページでまだ取得していなければ、同じタブで以前に取得した
 * 座標（sessionStorage）にフォールバックする。
 */
export function useResolvedCoords(): Coordinates | null {
  const { coords } = useLocation();
  const [stored, setStored] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (!coords) setStored(readStoredCoords());
  }, [coords]);

  return coords ?? stored;
}
