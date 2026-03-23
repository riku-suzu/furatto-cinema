import { Movie } from "@/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getPosterUrl(posterPath: string, size = "w342"): string {
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

export async function getNowPlayingMovies(): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/now_playing?api_key=${API_KEY}&language=ja-JP&region=JP`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || []).map((m: Record<string, unknown>) => ({
    id: m.id as number,
    title: m.title as string,
    posterPath: m.poster_path as string | undefined,
    overview: m.overview as string | undefined,
    releaseDate: m.release_date as string | undefined,
  }));
}

export async function getMovieDetails(movieId: number): Promise<Movie | null> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}?api_key=${API_KEY}&language=ja-JP`
  );
  if (!res.ok) return null;
  const m = await res.json();

  return {
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    overview: m.overview,
    releaseDate: m.release_date,
    runtime: m.runtime,
    genres: m.genres?.map((g: { name: string }) => g.name),
  };
}
