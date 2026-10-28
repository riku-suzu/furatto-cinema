"use client";

import { ComponentProps, ReactNode } from "react";
import { ChevronRight, Loader2, MapPin, Ticket } from "lucide-react";
import { useLocationGatedNavigation } from "@/hooks/useLocationGatedNavigation";
import ErrorBanner from "@/components/ErrorBanner";
import FavoriteCinemaList from "@/components/FavoriteCinemaList";
import HeroBackdrop from "@/components/HeroBackdrop";
import { Button } from "@/components/ui/button";
import { NOW_RADIUS_METERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function TopPage() {
  const { choose, pending, nowDisabled, locating, error } = useLocationGatedNavigation();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center text-center overflow-hidden -mx-5 -mt-8 px-5">

        <HeroBackdrop />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold tracking-[0.2em] uppercase text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Now Playing Near You
            </p>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
              今すぐ見れる映画を<br />
              <span className="bg-clip-text text-transparent" style={{
                backgroundImage: "linear-gradient(135deg, #e5373a 0%, #ff6b6b 100%)",
              }}>探そう</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              現在地から半径15km圏内の映画館と<br className="hidden sm:block" />上映スケジュールをリアルタイム表示
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <PendingButton
              pending={pending === "now"}
              pendingText={locating ? "位置情報を取得中..." : "近くの映画館を確認中..."}
              size="lg"
              onClick={() => choose("now")}
              aria-disabled={nowDisabled}
              className={cn(
                "h-14 gap-2.5 rounded-full px-9 text-lg font-bold shadow-[0_0_40px_rgba(229,55,58,0.35)] hover:bg-primary hover:shadow-[0_0_56px_rgba(229,55,58,0.5)] [&_svg:not([class*='size-'])]:size-5",
                nowDisabled && "opacity-40 cursor-not-allowed hover:shadow-[0_0_40px_rgba(229,55,58,0.35)]"
              )}
            >
              <Ticket />
              今すぐ観れる映画を見る
              <ChevronRight />
            </PendingButton>
            {nowDisabled && (
              <ErrorBanner className="w-auto">
                現在地から{NOW_RADIUS_METERS / 1000}km圏内に映画館が見つかりませんでした
              </ErrorBanner>
            )}
            <PendingButton
              pending={pending === "cinemas"}
              pendingText="位置情報を取得中..."
              variant="outline"
              size="lg"
              onClick={() => choose("cinemas")}
              className="h-14 gap-2.5 rounded-full px-9 text-lg font-bold [&_svg:not([class*='size-'])]:size-5"
            >
              <MapPin />
              周辺の映画館を見る
            </PendingButton>
            {error && <ErrorBanner className="w-auto">{error}</ErrorBanner>}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-transparent to-background" />
      </section>

      <FavoriteCinemaList />
    </div>
  );
}

/** 待機中はスピナーと pendingText に表示を切り替えるボタン */
function PendingButton({
  pending,
  pendingText,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean; pendingText: string; children: ReactNode }) {
  return (
    <Button {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
