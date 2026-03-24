"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCinemaDetails } from "@/lib/googlePlaces";
import { Cinema, Screening } from "@/types";
import FavoriteButton from "@/components/FavoriteButton";
import ScreeningRow from "@/components/ScreeningRow";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekDates(): { date: Date; label: string }[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const labels = ["日", "月", "火", "水", "木", "金", "土"];
    const label = i === 0 ? "今日" : i === 1 ? "明日"
      : `${d.getMonth() + 1}/${d.getDate()}(${labels[d.getDay()]})`;
    return { date: d, label };
  });
}

export default function CinemaDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);

  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [eigaUrl, setEigaUrl] = useState<string | null>(null);

  const weekDates = getWeekDates();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cinemaData = await getCinemaDetails(decodedId);
        if (!cinemaData) throw new Error("映画館が見つかりませんでした");
        setCinema(cinemaData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [decodedId]);

  useEffect(() => {
    if (!cinema) return;
    async function loadSchedule() {
      if (!cinema) return;
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const p = new URLSearchParams({ name: cinema.name, address: cinema.address, date: selectedDate });
        const res = await fetch(`/api/schedule?${p}`);
        const data = await res.json();
        if (data.error && data.screenings?.length === 0) {
          setScheduleError(data.error);
          setScreenings([]);
        } else {
          setScreenings(data.screenings || []);
          setEigaUrl(data.eigaUrl || null);
        }
      } catch {
        setScheduleError("スケジュールの取得に失敗しました");
        setScreenings([]);
      } finally {
        setScheduleLoading(false);
      }
    }
    loadSchedule();
  }, [cinema, selectedDate]);

  const movieOrder: number[] = [];
  const byMovie: Record<number, Screening[]> = {};
  screenings.forEach((s) => {
    if (!byMovie[s.movieId]) { movieOrder.push(s.movieId); byMovie[s.movieId] = []; }
    byMovie[s.movieId].push(s);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 rounded-xl animate-pulse" style={{ background: "#18181b" }} />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#18181b" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <div className="text-center py-16">
        <p className="mb-4" style={{ color: "#fca5a5" }}>{error || "映画館が見つかりませんでした"}</p>
        <Link href="/cinemas" style={{ color: "#dc2626" }}>← 映画館一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5" style={{ color: "#52525b" }}>
        <Link href="/" className="hover:text-white transition-colors">トップ</Link>
        <span>/</span>
        <Link href="/cinemas" className="hover:text-white transition-colors">映画館一覧</Link>
        <span>/</span>
        <span className="truncate max-w-[180px]" style={{ color: "#a1a1aa" }}>{cinema.name}</span>
      </nav>

      {/* Cinema header */}
      <div className="rounded-xl overflow-hidden border" style={{ background: "#18181b", borderColor: "#2d2d33" }}>
        <div className="relative h-52" style={{ background: "#111113" }}>
          {cinema.photoUrl ? (
            <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover opacity-70" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl opacity-10">🎬</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #18181b 0%, transparent 50%)" }} />
          {/* Red bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#dc2626" }} />
        </div>
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-tight" style={{ color: "#f4f4f5" }}>{cinema.name}</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>{cinema.address}</p>
            <div className="flex items-center gap-3 mt-2">
              {cinema.rating && (
                <span className="text-sm font-semibold" style={{ color: "#fbbf24" }}>★ {cinema.rating.toFixed(1)}</span>
              )}
              {eigaUrl && (
                <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs hover:underline" style={{ color: "#dc2626" }}>
                  映画.comで見る →
                </a>
              )}
            </div>
          </div>
          <FavoriteButton cinema={cinema} className="flex-shrink-0" />
        </div>
      </div>

      {/* Date picker */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {weekDates.map(({ date, label }) => {
          const dateStr = formatDate(date);
          const selected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
              style={{
                background: selected ? "#dc2626" : "#18181b",
                color: selected ? "#fff" : "#a1a1aa",
                borderColor: selected ? "#dc2626" : "#2d2d33",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Schedule loading */}
      {scheduleLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#18181b" }}>
              <div className="h-4 rounded w-1/3 mb-3" style={{ background: "#27272a" }} />
              <div className="h-12 rounded" style={{ background: "#27272a" }} />
            </div>
          ))}
        </div>
      )}

      {/* Schedule error */}
      {!scheduleLoading && scheduleError && (
        <div className="rounded-xl px-4 py-4 text-sm space-y-2 border"
          style={{ background: "#1c1007", borderColor: "#78350f", color: "#fcd34d" }}>
          <p className="font-semibold">スケジュール取得エラー</p>
          <p style={{ color: "#d97706" }}>{scheduleError}</p>
          {eigaUrl && (
            <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
              className="block hover:underline" style={{ color: "#dc2626" }}>
              映画.comで直接確認する →
            </a>
          )}
        </div>
      )}

      {/* No screenings */}
      {!scheduleLoading && !scheduleError && screenings.length === 0 && (
        <div className="text-center py-12 rounded-xl border" style={{ background: "#18181b", borderColor: "#2d2d33" }}>
          <p style={{ color: "#52525b" }}>この日の上映情報がありません</p>
          {eigaUrl && (
            <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
              className="block mt-2 text-sm hover:underline" style={{ color: "#dc2626" }}>
              映画.comで確認する →
            </a>
          )}
        </div>
      )}

      {/* Screenings grouped by movie */}
      {!scheduleLoading && screenings.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#52525b" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }}></span>
            映画.comのリアルタイムデータ
            {eigaUrl && (
              <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
                className="ml-1 hover:underline" style={{ color: "#dc2626" }}>元ページ →</a>
            )}
          </p>
          {movieOrder.map((movieId) => {
            const movieScreenings = byMovie[movieId];
            return (
              <div key={movieId} className="rounded-xl overflow-hidden border" style={{ background: "#18181b", borderColor: "#2d2d33" }}>
                <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "#27272a", background: "#111113" }}>
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                  <h2 className="font-bold text-sm truncate" style={{ color: "#f4f4f5" }}>
                    {movieScreenings[0].movieTitle}
                  </h2>
                </div>
                <div>
                  {movieScreenings.map((s) => (
                    <ScreeningRow key={s.id} screening={s} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/cinemas" className="text-sm transition-colors" style={{ color: "#52525b" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
          onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}>
          ← 映画館一覧に戻る
        </Link>
      </div>
    </div>
  );
}
