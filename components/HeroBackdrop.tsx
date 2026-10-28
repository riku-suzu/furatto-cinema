/** トップページのヒーローの背景（赤いぼかしと薄いグリッド線） */
export default function HeroBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(229,55,58,0.14) 0%, transparent 70%)"
      }} />
      {/* Subtle grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 80%)",
      }} />
    </>
  );
}
