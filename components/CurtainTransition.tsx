"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

type Phase = "idle" | "ready" | "closing" | "closed" | "opening";

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

export default function CurtainTransition({
  href,
  children,
  className,
  style,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");

  const handleClick = () => {
    if (phase !== "idle") return;
    setPhase("ready");
  };

  useEffect(() => {
    if (phase === "ready") {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("closing"))
      );
      return () => cancelAnimationFrame(raf);
    }

    if (phase === "closing") {
      // Switch to "closed" after curtains fully meet (1.5s)
      const t = setTimeout(() => setPhase("closed"), 1500);
      return () => clearTimeout(t);
    }

    if (phase === "closed") {
      // Navigate after a brief hold, then open curtains after logo fades (300ms)
      const t1 = setTimeout(() => router.push(href), 400);
      const t2 = setTimeout(() => setPhase("opening"), 700);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (phase === "opening") {
      // Wait for curtains to fully leave screen (1.4s)
      const t = setTimeout(() => setPhase("idle"), 1600);
      return () => clearTimeout(t);
    }
  }, [phase, href, router]);

  const isOffScreen = phase === "ready" || phase === "opening";
  const hasTransition = phase !== "ready";

  // Logo is visible only during closing + closed phases
  const logoVisible = phase === "closing" || phase === "closed";

  return (
    <>
      <button onClick={handleClick} className={className} style={style}>
        {children}
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex overflow-hidden">
          {/* Left curtain */}
          <div
            className="relative flex-1 h-full overflow-hidden"
            style={{
              background:
                "linear-gradient(to right, #4a0000 0%, #7a0000 30%, #b01a1a 70%, #e5373a 100%)",
              transform: isOffScreen ? "translateX(-100%)" : "translateX(0)",
              transition: hasTransition
                ? `transform ${isOffScreen ? "1.4s" : "1.5s"} cubic-bezier(0.7,0,0.3,1)`
                : "none",
              boxShadow: isOffScreen ? "none" : "4px 0 28px rgba(0,0,0,0.7)",
            }}
          >
            <CurtainFolds side="left" />
            <div
              className="absolute top-0 left-0 right-0 h-8"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
              }}
            />
          </div>

          {/* Right curtain */}
          <div
            className="relative flex-1 h-full overflow-hidden"
            style={{
              background:
                "linear-gradient(to left, #4a0000 0%, #7a0000 30%, #b01a1a 70%, #e5373a 100%)",
              transform: isOffScreen ? "translateX(100%)" : "translateX(0)",
              transition: hasTransition
                ? `transform ${isOffScreen ? "1.4s" : "1.5s"} cubic-bezier(0.7,0,0.3,1)`
                : "none",
              boxShadow: isOffScreen ? "none" : "-4px 0 28px rgba(0,0,0,0.7)",
            }}
          >
            <CurtainFolds side="right" />
            <div
              className="absolute top-0 left-0 right-0 h-8"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
              }}
            />
          </div>

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
    </>
  );
}
