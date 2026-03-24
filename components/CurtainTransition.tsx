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
  const [phase, setPhase] = useState<"idle" | "closing" | "opening">("idle");

  const handleClick = () => {
    if (phase !== "idle") return;
    setPhase("closing");
  };

  useEffect(() => {
    if (phase === "closing") {
      // After curtains close (0.6s), navigate and start opening
      const t1 = setTimeout(() => {
        router.push(href);
        setPhase("opening");
      }, 600);
      // Reset after open animation
      const t2 = setTimeout(() => setPhase("idle"), 1400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase, href, router]);

  return (
    <>
      <button onClick={handleClick} className={className} style={style}>
        {children}
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex">
          {/* Left curtain */}
          <div
            className="flex-1 h-full"
            style={{
              background: "linear-gradient(to right, #8b0000, #c41e3a, #e5373a)",
              transform: phase === "closing" ? "translateX(0)" : "translateX(-100%)",
              transition: phase === "closing"
                ? "transform 0.55s cubic-bezier(0.4,0,0.2,1)"
                : "transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.1s",
            }}
          />
          {/* Right curtain */}
          <div
            className="flex-1 h-full"
            style={{
              background: "linear-gradient(to left, #8b0000, #c41e3a, #e5373a)",
              transform: phase === "closing" ? "translateX(0)" : "translateX(100%)",
              transition: phase === "closing"
                ? "transform 0.55s cubic-bezier(0.4,0,0.2,1)"
                : "transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.1s",
            }}
          />
          {/* Center logo during close */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: phase === "closing" ? 1 : 0,
              transition: "opacity 0.2s 0.4s",
            }}
          >
            <div className="text-center text-white select-none">
              <div className="text-5xl font-black tracking-widest mb-1"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>映</div>
              <div className="text-sm font-bold tracking-widest opacity-80">映画時間</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
