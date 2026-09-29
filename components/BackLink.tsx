import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href: string;
  children: ReactNode;
  /** top: ページ上部の小さめのボタン / bottom: ページ末尾の中央寄せの大きめのボタン */
  position?: "top" | "bottom";
}

export default function BackLink({ href, children, position = "bottom" }: BackLinkProps) {
  const link = (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border bg-card font-semibold text-foreground/80 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-foreground",
        position === "top" ? "h-9 px-4 text-sm" : "h-12 px-7 text-base"
      )}
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {children}
    </Link>
  );
  return position === "top" ? <div>{link}</div> : <div className="flex justify-center pt-6">{link}</div>;
}
