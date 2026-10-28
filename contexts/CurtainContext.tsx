"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import CurtainOverlay, { CurtainPhase } from "@/components/CurtainOverlay";

// ページ遷移の幕。レイアウトに置いてページをまたいで生き残るようにしてあるので、
// 遷移先のページが描画されてから幕が開く（ページ側に置くと遷移と同時に消えてしまう）。

const CLOSE_MS = 1500; // 幕が閉じきるまで
const HOLD_MS = 400;   // 閉じた状態でロゴを見せてから遷移する
const OPEN_DELAY_MS = 200; // 遷移先の最初の描画を待ってから開く
const OPEN_MS = 1600;  // 幕が開ききるまで
const FALLBACK_MS = 8000; // 遷移が終わらなくても幕を開ける

interface CurtainContextType {
  /** 幕を閉じてからhrefへ遷移し、遷移先で幕を開ける */
  navigate: (href: string) => void;
}

const CurtainContext = createContext<CurtainContextType | null>(null);

export function useCurtain() {
  const ctx = useContext(CurtainContext);
  if (!ctx) throw new Error("useCurtain must be used within CurtainProvider");
  return ctx;
}

export function CurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<CurtainPhase>("idle");
  const targetRef = useRef<string | null>(null);

  const navigate = useCallback((href: string) => {
    setPhase((p) => {
      if (p !== "idle") return p;
      targetRef.current = href;
      return "ready";
    });
  }, []);

  useEffect(() => {
    if (phase === "ready") {
      // 画面外の位置で一度描画してから閉じ始める（transitionを効かせるため）
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setPhase("closing"));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    if (phase === "closing") {
      const t = setTimeout(() => setPhase("closed"), CLOSE_MS);
      return () => clearTimeout(t);
    }
    if (phase === "closed") {
      const t = setTimeout(() => targetRef.current && router.push(targetRef.current), HOLD_MS);
      const fallback = setTimeout(() => setPhase("opening"), FALLBACK_MS);
      return () => {
        clearTimeout(t);
        clearTimeout(fallback);
      };
    }
    if (phase === "opening") {
      const t = setTimeout(() => setPhase("idle"), OPEN_MS);
      return () => clearTimeout(t);
    }
  }, [phase, router]);

  // 遷移先のページに切り替わったら幕を開ける
  useEffect(() => {
    if (phase !== "closed" || pathname !== targetRef.current) return;
    const t = setTimeout(() => setPhase("opening"), OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname, phase]);

  return (
    <CurtainContext.Provider value={{ navigate }}>
      {children}

      <CurtainOverlay phase={phase} />
    </CurtainContext.Provider>
  );
}
