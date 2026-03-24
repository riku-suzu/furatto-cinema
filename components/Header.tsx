import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50" style={{ background: "#1a1a22", borderBottom: "1px solid #3e3e50" }}>
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #e5373a 0%, #7f1d1d 100%)" }} />
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-black text-white"
            style={{ background: "#e5373a" }}>映</div>
          <span className="font-bold text-lg tracking-wide" style={{ color: "#f0f0f2" }}>映画時間</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="transition-colors" style={{ color: "#c8c8d8" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f2f2f5")}
            onMouseLeave={e => (e.currentTarget.style.color = "#c8c8d8")}>トップ</Link>
          <Link href="/cinemas" className="px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-80"
            style={{ background: "#e5373a" }}>映画館を探す</Link>
        </nav>
      </div>
    </header>
  );
}
