import { Screening, Movie } from "@/types";

// Generates realistic mock screening schedule for a cinema
// In production, this would be replaced by a real schedule API
export function generateMockSchedule(
  cinemaId: string,
  movies: Movie[],
  date: string
): Screening[] {
  if (movies.length === 0) return [];

  const screenings: Screening[] = [];
  const formats = ["2D", "3D", "IMAX", "2D"] as const;
  const screens = ["スクリーン1", "スクリーン2", "スクリーン3", "スクリーン4", "スクリーン5"];

  // Use cinemaId as seed for deterministic but varied results
  const seed = cinemaId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  movies.slice(0, Math.min(6, movies.length)).forEach((movie, movieIdx) => {
    const runtime = movie.runtime || 110;
    const showsPerMovie = 2 + ((seed + movieIdx) % 3);

    for (let i = 0; i < showsPerMovie; i++) {
      const baseHour = 9 + ((seed + movieIdx * 3 + i * 2) % 11); // 9-19
      const startMinute = [0, 10, 20, 30, 40, 50][(seed + movieIdx + i) % 6];
      const totalMinutes = baseHour * 60 + startMinute;
      const endTotal = totalMinutes + runtime + 15; // +15 min interval

      const start = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
      const end = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;

      const totalSeats = [80, 120, 150, 200, 250][(seed + movieIdx) % 5];
      const availableSeats = Math.floor(totalSeats * (0.2 + Math.random() * 0.8));

      screenings.push({
        id: `${cinemaId}-${date}-${movie.id}-${i}`,
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.posterPath,
        startTime: start,
        endTime: end,
        screen: screens[(movieIdx + i) % screens.length],
        availableSeats,
        totalSeats,
        format: formats[(movieIdx + i) % formats.length],
        language: i === 0 ? "日本語吹替" : "字幕版",
      });
    }
  });

  return screenings.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getSeatsStatus(available: number, total: number): {
  label: string;
  color: string;
} {
  const ratio = available / total;
  if (ratio > 0.5) return { label: "余裕あり", color: "text-emerald-600" };
  if (ratio > 0.2) return { label: "残りわずか", color: "text-amber-600" };
  if (available > 0) return { label: `残り${available}席`, color: "text-red-600" };
  return { label: "満席", color: "text-gray-500" };
}
