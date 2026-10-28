"use client";

import { Cinema } from "@/types";
import { useAnimatedList } from "@/hooks/useAnimatedList";
import { Skeleton } from "@/components/ui/skeleton";
import CinemaCard from "./CinemaCard";

const GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6";

const cinemaKey = (c: Cinema) => c.id;

/**
 * 映画館カードのグリッド。リストが変わったとき（範囲の切り替えなど）は
 * 今のカードを残したまま、増えた分・減った分だけを出し入れする。
 */
export function AnimatedCinemaGrid({ cinemas, dimmed }: { cinemas: Cinema[]; dimmed: boolean }) {
  const listed = useAnimatedList(cinemas, cinemaKey);
  if (listed.length === 0) return null;

  return (
    <div className={`${GRID} transition-opacity duration-500 ${dimmed ? "opacity-60" : ""}`}>
      {listed.map(({ key, item, state, delayMs }) => (
        <div
          key={key}
          className={
            state === "enter"
              ? "animate-rise motion-reduce:animate-none"
              : state === "exit"
              ? "pointer-events-none animate-sink motion-reduce:animate-none"
              : undefined
          }
          style={state !== "stay" ? { animationDelay: `${delayMs}ms` } : undefined}
        >
          <CinemaCard cinema={item} />
        </div>
      ))}
    </div>
  );
}

export function CinemaGridSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card">
          <Skeleton className="aspect-[16/9] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
