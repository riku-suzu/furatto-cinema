import { Screening } from "@/types";
import { groupByLanguage } from "@/lib/screenings";
import ShowtimeChip from "./ShowtimeChip";
import { LanguageBadge, languageLabel } from "./ScreeningBadges";

/** 映画館詳細ページの、1作品分の上映回の一覧 */
export default function MovieSchedule({ screenings }: { screenings: Screening[] }) {
  // 字幕・吹替が両方ある作品は行を分け、片方だけならタイトルの横にバッジで出す
  const byLanguage = groupByLanguage(screenings);
  const languages = [...byLanguage.keys()];
  const split = languages.length > 1;

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-1 h-5 w-1 flex-shrink-0 rounded-full bg-primary" />
        <h2 className="text-base font-bold leading-snug">
          {screenings[0].movieTitle}
          {!split && languages[0] && <LanguageBadge language={languages[0]} className="ml-2 align-[2px]" />}
        </h2>
        <span className="ml-auto flex-shrink-0 pt-0.5 text-xs text-muted-foreground">{screenings.length}回</span>
      </div>
      <div className="space-y-4">
        {[...byLanguage].map(([language, list]) => (
          <div key={language}>
            {split && (
              <p className="mb-2 text-xs font-bold text-lang">{language ? languageLabel(language) : "その他"}</p>
            )}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {list.map((s) => (
                <ShowtimeChip key={s.id} screening={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
