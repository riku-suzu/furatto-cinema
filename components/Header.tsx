"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50" style={{
      background: "rgba(13,13,18,0.88)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tight" style={{ color: "#e5373a" }}>映画時間</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="transition-colors" style={{ color: "#808090" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f2f2f5")}
            onMouseLeave={e => (e.currentTarget.style.color = "#808090")}>
            トップ
          </Link>
        </nav>
      </div>
    </header>
  );
}
