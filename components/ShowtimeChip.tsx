import { ExternalLink, Ticket } from "lucide-react";
import { Screening } from "@/types";

/** 映画館詳細ページの1上映分のチップ */
export default function ShowtimeChip({ screening: s }: { screening: Screening }) {
  const isSoldOut = !s.isPast && s.availableSeats === 0 && !!s.totalSeats;
  const status = s.isPast ? "上映終了" : isSoldOut ? "満席" : null;
  const isClickable = !!s.ticketUrl && !status;
  const official = s.booking === "official";

  const body = (
    <>
      <span className="text-lg font-black leading-none tabular-nums">{s.startTime}</span>
      <span className="mt-1 text-[11px] text-muted-foreground tabular-nums">{s.endTime ? `〜${s.endTime}` : " "}</span>
      {status ? (
        <span className="mt-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{status}</span>
      ) : isClickable ? (
        <span
          className={`mt-2.5 inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-md py-1 text-[11px] font-bold ${
            official ? "border border-foreground/20 text-foreground/85" : "bg-primary text-primary-foreground"
          }`}
        >
          {official ? <ExternalLink className="hidden size-3 sm:block" /> : <Ticket className="size-3" />}
          {official ? "公式サイト" : "購入"}
        </span>
      ) : (
        <span className="mt-2.5 py-1 text-[11px] text-muted-foreground">—</span>
      )}
      {s.format && s.format !== "2D" && <span className="mt-1 text-[10px] text-foreground/70">{s.format}</span>}
    </>
  );

  const base = "flex flex-col items-center rounded-xl border px-2.5 pt-3 pb-2.5 text-center transition-all";

  if (isClickable) {
    return (
      <a
        href={s.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-secondary hover:-translate-y-0.5 ${official ? "hover:border-foreground/40" : "hover:border-primary/60 hover:bg-primary/10"}`}
      >
        {body}
      </a>
    );
  }
  return <div className={`${base} ${status ? "opacity-40" : "bg-secondary"}`}>{body}</div>;
}
