import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🎬</span>
          <span className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
            映画時間
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            トップ
          </Link>
          <Link href="/cinemas" className="hover:text-indigo-600 transition-colors">
            映画館一覧
          </Link>
        </nav>
      </div>
    </header>
  );
}
