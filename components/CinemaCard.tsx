import Link from "next/link";
import Image from "next/image";
import { Clapperboard, Film, MapPin, Star } from "lucide-react";
import { Cinema } from "@/types";
import { formatDistance } from "@/lib/geo";
import FavoriteButton from "./FavoriteButton";

export default function CinemaCard({ cinema }: { cinema: Cinema }) {
  return (
    <Link
      href={`/cinemas/${cinema.id}`}
      className="group block overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(229,55,58,0.12)]"
    >
      {/* Image */}
      <div className="relative h-32 sm:h-36 bg-muted">
        {cinema.photoUrl ? (
          <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover opacity-80 transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-100" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
            <Clapperboard className="size-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent to-60%" />

        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {cinema.distance !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              <MapPin className="size-3 text-primary" />
              {formatDistance(cinema.distance)}
            </span>
          )}
          <FavoriteButton cinema={cinema} className="ml-auto" />
        </div>
      </div>

      <div className="px-3 py-2.5">
        <h3 className="font-bold text-sm leading-snug line-clamp-2 transition-colors group-hover:text-primary">
          {cinema.name}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {cinema.rating !== undefined && (
            <span className="inline-flex flex-shrink-0 items-center gap-0.5 font-semibold text-gold">
              <Star className="size-3 fill-current" />
              {cinema.rating.toFixed(1)}
            </span>
          )}
          <span className="line-clamp-1">{cinema.address}</span>
        </div>
        {cinema.movieCount !== undefined && cinema.movieCount > 0 && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-success">
            <Film className="size-3" />
            {cinema.movieCount}作品上映中
          </p>
        )}
      </div>
    </Link>
  );
}
