import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center py-20">
        <p className="text-6xl font-black mb-4 text-primary">404</p>
        <p className="text-lg font-bold mb-6">ページが見つかりません</p>
        <Button asChild variant="outline">
          <Link href="/">トップに戻る →</Link>
        </Button>
      </div>
    </div>
  );
}
