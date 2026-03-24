import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: "#0d0d0f", borderColor: "#2d2d33" }}>
      {/* Red accent line */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #dc2626, #7f1d1d)" }} />
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-black"
            style={{ background: "#dc2626" }}>
            映
          </div>
          <span className="font-bold text-lg tracking-wide" style={{ color: "#f4f4f5" }}>
            映画時間
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium" style={{ color: "#a1a1aa" }}>
          <Link href="/" className="hover:text-white transition-colors">トップ</Link>
          <Link href="/cinemas"
            className="px-3 py-1.5 rounded text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#dc2626", color: "#fff" }}>
            映画館を探す
          </Link>
        </nav>
      </div>
    </header>
  );
}
