import { ExternalLink, Ticket } from "lucide-react";
import { Screening } from "@/types";
import { cn } from "@/lib/utils";

/** "字幕版" → "字幕" / "日本語吹替" → "吹替" */
export function languageLabel(language: string): string {
  return language === "日本語吹替" ? "吹替" : language === "字幕版" ? "字幕" : language;
}

export function LanguageBadge({ language, className }: { language: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center rounded-md border border-lang/25 bg-lang/10 px-1.5 py-0.5 text-[11px] font-bold leading-none text-lang",
        className
      )}
    >
      {languageLabel(language)}
    </span>
  );
}

/**
 * 購入ボタンの見た目。eiga.com経由で座席選択まで飛べる館は赤い「チケット購入」、
 * 公式サイトに飛ぶだけの館（kino cinema、シネマートなど）は枠線の「公式サイト」にして区別する。
 */
export function BookingButton({ booking, className }: { booking: Screening["booking"]; className?: string }) {
  const official = booking === "official";
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition-all",
        official
          ? "border border-foreground/20 text-foreground/90 group-hover:border-foreground/40 group-hover:bg-foreground/5"
          : "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(229,55,58,0.35)] group-hover:shadow-[0_0_24px_rgba(229,55,58,0.55)]",
        className
      )}
    >
      {official ? <ExternalLink className="size-4" /> : <Ticket className="size-4" />}
      {official ? "公式サイトで購入" : "チケット購入"}
    </span>
  );
}
