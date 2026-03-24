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
    const label =
      i === 0
        ? "今日"
        : i === 1
        ? "明日"
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

  // Load cinema details once
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

  // Load schedule when cinema or date changes
  useEffect(() => {
    if (!cinema) return;

    async function loadSchedule() {
      if (!cinema) return;
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const params = new URLSearchParams({
          name: cinema.name,
          address: cinema.address,
          date: selectedDate,
        });
        const res = await fetch(`/api/schedule?${params}`);
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

  // Group screenings by movie, preserving API order (= release date order)
  const movieOrder: number[] = [];
  const byMovie: Record<number, Screening[]> = {};
  screenings.forEach((s) => {
    if (!byMovie[s.movieId]) {
      movieOrder.push(s.movieId);
      byMovie[s.movieId] = [];
    }
    byMovie[s.movieId].push(s);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error || "映画館が見つかりませんでした"}</p>
        <Link href="/cinemas" className="text-indigo-500 hover:underline">
          ← 映画館一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 flex items-center gap-1">
        <Link href="/" className="hover:text-indigo-500">トップ</Link>
        <span>/</span>
        <Link href="/cinemas" className="hover:text-indigo-500">映画館一覧</Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-[200px]">{cinema.name}</span>
      </nav>

      {/* Cinema header */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100">
          {cinema.photoUrl ? (
            <Image
              src={cinema.photoUrl}
              alt={cinema.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-20">🎬</span>
            </div>
          )}
        </div>
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
              {cinema.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{cinema.address}</p>
            <div className="flex items-center gap-3 mt-2">
              {cinema.rating && (
                <span className="text-sm font-medium text-amber-600">
                  ★ {cinema.rating.toFixed(1)}
                </span>
              )}
              {eigaUrl && (
                <a
                  href={eigaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-500 hover:underline"
                >
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
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selected
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Schedule loading */}
      {scheduleLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Schedule error */}
      {!scheduleLoading && scheduleError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 text-amber-800 text-sm space-y-2">
          <p className="font-medium">スケジュール取得エラー</p>
          <p>{scheduleError}</p>
          {eigaUrl && (
            <a href={eigaUrl} target="_blank" rel="noopener noreferrer" className="block text-indigo-600 hover:underline">
              映画.comで直接確認する →
            </a>
          )}
        </div>
      )}

      {/* Screenings */}
      {!scheduleLoading && !scheduleError && screenings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-400">この日の上映情報がありません</p>
          {eigaUrl && (
            <a href={eigaUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-indigo-500 text-sm hover:underline">
              映画.comで確認する →
            </a>
          )}
        </div>
      )}

      {!scheduleLoading && screenings.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            映画.comのリアルタイムデータ
            {eigaUrl && (
              <a href={eigaUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-400 hover:underline">
                元ページを見る →
              </a>
            )}
          </p>
          {movieOrder.map((movieId) => { const movieScreenings = byMovie[movieId]; return (
            <div
              key={movieId}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <h2 className="font-bold text-gray-800 text-sm">
                  {movieScreenings[0].movieTitle}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {movieScreenings.map((s) => (
                  <ScreeningRow key={s.id} screening={s} />
                ))}
              </div>
            </div>
          );})}
        </div>
      )}

      <div className="text-center pt-4">
        <Link href="/cinemas" className="text-sm text-indigo-500 hover:underline">
          ← 映画館一覧に戻る
        </Link>
      </div>
    </div>
  );
}
