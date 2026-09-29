"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

// ページ遷移の幕。レイアウトに置いてページをまたいで生き残るようにしてあるので、
// 遷移先のページが描画されてから幕が開く（ページ側に置くと遷移と同時に消えてしまう）。

type Phase = "idle" | "ready" | "closing" | "closed" | "opening";

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

function CurtainFolds({ side }: { side: "left" | "right" }) {
  const folds = [0.15, 0.35, 0.55, 0.75, 0.9];
  return (
    <>
      {folds.map((pos, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: side === "left" ? `${pos * 100}%` : undefined,
            right: side === "right" ? `${(1 - pos) * 100}%` : undefined,
            background:
              "linear-gradient(to bottom, transparent, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 80%, transparent)",
          }}
        />
      ))}
      {folds.map((pos, i) => (
        <div
          key={`h-${i}`}
          className="absolute top-0 bottom-0 w-[3px]"
          style={{
            left: side === "left" ? `calc(${pos * 100}% + 2px)` : undefined,
            right:
              side === "right" ? `calc(${(1 - pos) * 100}% + 2px)` : undefined,
            background:
              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 80%, transparent)",
          }}
        />
      ))}
    </>
  );
}

function Curtain({ side, isOffScreen, hasTransition }: { side: "left" | "right"; isOffScreen: boolean; hasTransition: boolean }) {
  const dir = side === "left" ? -1 : 1;
  return (
    <div
      className="relative flex-1 h-full overflow-hidden"
      style={{
        background: `linear-gradient(to ${side === "left" ? "right" : "left"}, #4a0000 0%, #7a0000 30%, #b01a1a 70%, #e5373a 100%)`,
        transform: isOffScreen ? `translateX(${dir * 100}%)` : "translateX(0)",
        transition: hasTransition
          ? `transform ${isOffScreen ? "1.4s" : "1.5s"} cubic-bezier(0.7,0,0.3,1)`
          : "none",
        boxShadow: isOffScreen ? "none" : `${-dir * 4}px 0 28px rgba(0,0,0,0.7)`,
      }}
    >
      <CurtainFolds side={side} />
      <div
        className="absolute top-0 left-0 right-0 h-8"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }}
      />
    </div>
  );
}

export function CurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
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

  const isOffScreen = phase === "ready" || phase === "opening";
  const hasTransition = phase !== "ready";
  // Logo is visible only during closing + closed phases
  const logoVisible = phase === "closing" || phase === "closed";

  return (
    <CurtainContext.Provider value={{ navigate }}>
      {children}

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex overflow-hidden">
          <Curtain side="left" isOffScreen={isOffScreen} hasTransition={hasTransition} />
          <Curtain side="right" isOffScreen={isOffScreen} hasTransition={hasTransition} />

          {/* Gold seam */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px]"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, #d4a017 15%, #f5c842 50%, #d4a017 85%, transparent 100%)",
              opacity: phase === "closed" ? 0.8 : 0,
              transition:
                phase === "closed" ? "opacity 0.3s 0s" : "opacity 0.2s 0s",
            }}
          />

          {/* Logo — rendered only while curtains are closed, fades out before opening */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: logoVisible ? 1 : 0,
              transition: logoVisible
                ? "opacity 0.4s 0.9s" // fade in after curtains mostly closed
                : "opacity 0.25s 0s", // fade out immediately before curtains open
              pointerEvents: "none",
            }}
          >
            <div
              className="text-center text-white select-none"
              style={{
                transform: phase === "closed" ? "scale(1)" : "scale(0.9)",
                transition: "transform 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <div
                className="text-7xl font-black tracking-widest mb-2"
                style={{
                  textShadow:
                    "0 2px 32px rgba(0,0,0,1), 0 0 60px rgba(229,55,58,0.5)",
                }}
              >
                映
              </div>
              <div
                className="text-xs font-bold"
                style={{ opacity: 0.75, letterSpacing: "0.3em" }}
              >
                映画時間
              </div>
            </div>
          </div>
        </div>
      )}
    </CurtainContext.Provider>
  );
}
