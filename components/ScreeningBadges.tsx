import { Clapperboard, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** 上映のポスター枠（eiga.comのポスターは外部表示できないためプレースホルダー） */
export function PosterPlaceholder({ className }: { className: string }) {
  return (
    <div className={cn("flex flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/60", className)}>
      <Clapperboard className="size-4" />
    </div>
  );
}

export function LanguageBadge({ language }: { language: string }) {
  return (
    <Badge variant="outline" className="rounded-md border-lang/20 bg-lang/10 text-lang">
      {language}
    </Badge>
  );
}

export function BuyBadge() {
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-[0_0_12px_rgba(229,55,58,0.3)]">
      <Ticket className="size-3.5" />
      購入
    </span>
  );
}
