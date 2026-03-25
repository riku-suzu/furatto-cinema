export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl font-black mb-4" style={{ color: "#e5373a" }}>404</p>
      <p className="text-lg font-bold mb-6" style={{ color: "#f2f2f5" }}>ページが見つかりません</p>
      <a href="/" className="text-sm font-medium" style={{ color: "#9898ac" }}>
        トップに戻る →
      </a>
    </div>
  );
}
