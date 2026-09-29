import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clapperboard, MapPin } from "lucide-react";
import { Cinema } from "@/types";
import { formatDistance } from "@/lib/geo";
import FavoriteButton from "./FavoriteButton";

export default function CinemaCard({ cinema }: { cinema: Cinema }) {
  return (
    <Link
      href={`/cinemas/${cinema.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(229,55,58,0.14)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {cinema.photoUrl ? (
          <Image
            src={cinema.photoUrl}
            alt={cinema.name}
            fill
            className="object-cover opacity-85 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <Clapperboard className="size-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent to-50%" />
        <FavoriteButton cinema={cinema} className="absolute top-3 right-3" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-bold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
          {cinema.name}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{cinema.address}</p>

        <div className="mt-auto flex items-center justify-between pt-3 text-sm">
          {cinema.distance !== undefined ? (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <MapPin className="size-4 text-primary" />
              {formatDistance(cinema.distance)}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors group-hover:text-primary">
            上映スケジュール
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
