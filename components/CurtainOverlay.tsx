// ページ遷移の幕の見た目。状態の切り替えは contexts/CurtainContext.tsx が持つ。

/**
 * idle: 幕なし / ready: 画面外に置いた直後 / closing: 閉じている途中 /
 * closed: 閉じてロゴを表示中 / opening: 開いている途中
 */
export type CurtainPhase = "idle" | "ready" | "closing" | "closed" | "opening";

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

export default function CurtainOverlay({ phase }: { phase: CurtainPhase }) {
  if (phase === "idle") return null;

  const isOffScreen = phase === "ready" || phase === "opening";
  const hasTransition = phase !== "ready";
  // Logo is visible only during closing + closed phases
  const logoVisible = phase === "closing" || phase === "closed";

  return (
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
            className="text-5xl font-black tracking-wider mb-3 sm:text-7xl"
            style={{
              textShadow:
                "0 2px 32px rgba(0,0,0,1), 0 0 60px rgba(229,55,58,0.5)",
            }}
          >
            ふらっと
          </div>
          <div
            className="text-sm font-bold sm:text-base"
            style={{ opacity: 0.8, letterSpacing: "0.6em", textIndent: "0.6em" }}
          >
            シネマ
          </div>
        </div>
      </div>
    </div>
  );
}
