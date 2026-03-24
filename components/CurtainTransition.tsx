"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function CurtainTransition({ href, children, className, style }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "ready" | "closing" | "opening">("idle");

  const handleClick = () => {
    if (phase !== "idle") return;
    setPhase("ready"); // render curtains off-screen first
  };

  useEffect(() => {
    if (phase === "ready") {
      // Wait 2 animation frames so browser paints the off-screen position before transitioning
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("closing"))
      );
      return () => cancelAnimationFrame(raf);
    }
    if (phase === "closing") {
      const t1 = setTimeout(() => {
        router.push(href);
        setPhase("opening");
      }, 650);
      const t2 = setTimeout(() => setPhase("idle"), 1400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase, href, router]);

  const isOffScreen = phase === "ready" || phase === "opening";
  const hasTransition = phase !== "ready"; // no transition on initial render

  return (
    <>
      <button onClick={handleClick} className={className} style={style}>
        {children}
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex overflow-hidden">
          {/* Left curtain */}
          <div
            className="flex-1 h-full"
            style={{
              background: "linear-gradient(to right, #7a0000, #b01a1a, #e5373a)",
              transform: isOffScreen ? "translateX(-100%)" : "translateX(0)",
              transition: hasTransition ? "transform 0.6s cubic-bezier(0.4,0,0.2,1)" : "none",
            }}
          />
          {/* Right curtain */}
          <div
            className="flex-1 h-full"
            style={{
              background: "linear-gradient(to left, #7a0000, #b01a1a, #e5373a)",
              transform: isOffScreen ? "translateX(100%)" : "translateX(0)",
              transition: hasTransition ? "transform 0.6s cubic-bezier(0.4,0,0.2,1)" : "none",
            }}
          />
          {/* Center logo */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: phase === "closing" ? 1 : 0,
              transition: "opacity 0.2s 0.35s",
              pointerEvents: "none",
            }}
          >
            <div className="text-center text-white select-none">
              <div
                className="text-6xl font-black tracking-widest mb-1"
                style={{ textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}
              >
                映
              </div>
              <div className="text-sm font-bold tracking-widest opacity-80">映画時間</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
