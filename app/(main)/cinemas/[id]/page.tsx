"use client";

export const dynamic = "force-dynamic";

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
        <div className="rounded-2xl animate-pulse" style={{ height: "320px", background: "#16161e" }} />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#16161e" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <div className="text-center py-16">
        <p className="mb-4" style={{ color: "#fca5a5" }}>{error || "映画館が見つかりませんでした"}</p>
        <Link href="/cinemas" style={{ color: "#e5373a" }}>← 映画館一覧に戻る</Link>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cinema.lat},${cinema.lng}&travelmode=transit`;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5" style={{ color: "#808090" }}>
        <Link href="/" className="hover:text-white transition-colors">トップ</Link>
        <span>/</span>
        <Link href="/cinemas" className="hover:text-white transition-colors">映画館一覧</Link>
        <span>/</span>
        <span className="truncate max-w-[200px] text-zinc-400">{cinema.name}</span>
      </nav>

      {/* ── Cinema Hero ── */}
      <div className="rounded-2xl overflow-hidden relative" style={{ background: "#16161e" }}>
        {/* Banner image */}
        <div className="relative" style={{ height: "320px" }}>
          {cinema.photoUrl ? (
            <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl opacity-10">🎬</span>
            </div>
          )}
          {/* Multi-layer gradient */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, #16161e 0%, rgba(22,22,30,0.6) 50%, rgba(22,22,30,0.2) 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(22,22,30,0.8) 0%, transparent 60%)"
          }} />

          {/* Overlaid title area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white drop-shadow-lg">
                {cinema.name}
              </h1>
              <p className="text-sm mt-1.5 drop-shadow" style={{ color: "rgba(255,255,255,0.6)" }}>
                {cinema.address}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {cinema.rating && (
                  <span className="text-sm font-bold" style={{ color: "#fbbf24" }}>★ {cinema.rating.toFixed(1)}</span>
                )}
                {eigaUrl && (
                  <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline" style={{ color: "#e5373a" }}>
                    映画.comで見る →
                  </a>
                )}
              </div>
            </div>
            <FavoriteButton cinema={cinema} className="flex-shrink-0" />
          </div>
        </div>

        {/* Actions bar */}
        <div className="px-6 py-4 flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            Google Mapsでルート案内
          </a>
        </div>
      </div>

      {/* ── Date picker ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {weekDates.map(({ date, label }) => {
          const dateStr = formatDate(date);
          const selected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: selected ? "#e5373a" : "rgba(255,255,255,0.05)",
                color: selected ? "#fff" : "#808090",
                border: `1px solid ${selected ? "#e5373a" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Schedule loading ── */}
      {scheduleLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: "#16161e" }}>
              <div className="h-4 rounded w-1/3 mb-4" style={{ background: "#1e1e28" }} />
              <div className="h-12 rounded" style={{ background: "#1e1e28" }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Schedule error ── */}
      {!scheduleLoading && scheduleError && (
        <div className="rounded-xl px-5 py-4 text-sm space-y-2"
          style={{ background: "rgba(229,55,58,0.06)", border: "1px solid rgba(229,55,58,0.15)", color: "#fca5a5" }}>
          <p className="font-semibold">スケジュール取得エラー</p>
          <p style={{ color: "#f87171" }}>{scheduleError}</p>
          {eigaUrl && (
            <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
              className="block hover:underline" style={{ color: "#e5373a" }}>
              映画.comで直接確認する →
            </a>
          )}
        </div>
      )}

      {/* ── No screenings ── */}
      {!scheduleLoading && !scheduleError && screenings.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#808090" }}>この日の上映情報がありません</p>
          {eigaUrl && (
            <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
              className="block mt-2 text-sm hover:underline" style={{ color: "#e5373a" }}>
              映画.comで確認する →
            </a>
          )}
        </div>
      )}

      {/* ── Screenings grouped by movie ── */}
      {!scheduleLoading && screenings.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#808090" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}></span>
            映画.comのリアルタイムデータ
            {eigaUrl && (
              <a href={eigaUrl} target="_blank" rel="noopener noreferrer"
                className="ml-1 hover:underline" style={{ color: "#e5373a" }}>元ページ →</a>
            )}
          </p>
          {movieOrder.map((movieId) => {
            const movieScreenings = byMovie[movieId];
            return (
              <div key={movieId} className="rounded-xl overflow-hidden" style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#e5373a" }} />
                  <h2 className="font-bold text-sm text-white truncate">
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

      <div className="text-center pt-4">
        <Link href="/cinemas" className="text-sm transition-colors" style={{ color: "#808090" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e5373a")}
          onMouseLeave={e => (e.currentTarget.style.color = "#808090")}>
          ← 映画館一覧に戻る
        </Link>
      </div>
    </div>
  );
}
