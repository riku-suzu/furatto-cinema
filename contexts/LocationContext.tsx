"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
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
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoading(false);
        },
        (err) => {
          // 高精度で失敗した場合は低精度で再試行
          if (highAccuracy && err.code !== 1) {
            attempt(false);
            return;
          }
          const messages: Record<number, string> = {
            1: "位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください",
            2: "位置情報を取得できませんでした。しばらくしてから再試行してください",
            3: "位置情報の取得がタイムアウトしました。再度お試しください",
          };
          setError(messages[err.code] || "位置情報の取得に失敗しました");
          setLoading(false);
        },
        { timeout: highAccuracy ? 10000 : 20000, maximumAge: 60000, enableHighAccuracy: highAccuracy }
      );
    };
    attempt(true);
  }, []);

  return (
    <LocationContext.Provider value={{ coords, loading, error, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
