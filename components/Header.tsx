import Link from "next/link";
import { Clapperboard } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80">
          <Clapperboard className="size-5" />
          <span className="font-black text-lg tracking-tight">映画時間</span>
        </Link>
      </div>
    </header>
  );
}
