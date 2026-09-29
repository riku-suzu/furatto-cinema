import { Screening } from "@/types";

/** 映画館詳細ページの1上映分のチップ */
export default function ShowtimeChip({ screening: s }: { screening: Screening }) {
  const isSoldOut = !s.isPast && s.availableSeats === 0 && !!s.totalSeats;
  const status = s.isPast ? "終了" : isSoldOut ? "満席" : null;
  const isClickable = !!s.ticketUrl && !status;

  const body = (
    <>
      <span className="text-lg font-black leading-none tabular-nums">{s.startTime}</span>
      <span className="mt-1 text-[11px] text-muted-foreground tabular-nums">{s.endTime ? `〜${s.endTime}` : " "}</span>
      <span className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold">
        {status ? (
          <span className="text-muted-foreground">{status}</span>
        ) : isClickable ? (
          <span className="text-primary">購入 →</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {s.language && <span className="text-lang">{s.language === "日本語吹替" ? "吹替" : "字幕"}</span>}
        {s.format && s.format !== "2D" && <span className="text-foreground/70">{s.format}</span>}
      </span>
    </>
  );

  const base = "flex flex-col items-center rounded-lg border px-2 py-2.5 text-center transition-all";

  if (isClickable) {
    return (
      <a
        href={s.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-secondary hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10`}
      >
        {body}
      </a>
    );
  }
  return <div className={`${base} ${status ? "opacity-40" : "bg-secondary"}`}>{body}</div>;
}
