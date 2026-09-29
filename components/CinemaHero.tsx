import Image from "next/image";
import { Clapperboard, ExternalLink, Navigation } from "lucide-react";
import { Cinema } from "@/types";
import { Button } from "@/components/ui/button";
import FavoriteButton from "./FavoriteButton";

/** 映画館詳細ページのヘッダー（写真・名前・住所・ルート案内） */
export default function CinemaHero({ cinema }: { cinema: Cinema }) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cinema.lat},${cinema.lng}&travelmode=transit`;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      <div className="relative h-64 sm:h-80">
        {cinema.photoUrl ? (
          <Image src={cinema.photoUrl} alt={cinema.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
            <Clapperboard className="size-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/80 to-transparent to-60%" />

        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-white drop-shadow-lg sm:text-3xl">{cinema.name}</h1>
            <p className="mt-1.5 text-sm text-white/60 drop-shadow">{cinema.address}</p>
          </div>
          <FavoriteButton cinema={cinema} className="size-10 flex-shrink-0 [&_svg]:size-5" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t px-6 py-4">
        <Button asChild variant="outline" className="border-success/25 bg-success/10 text-success hover:bg-success/20 hover:text-success">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation />
            ルート案内
          </a>
        </Button>
        {cinema.eigaUrl && (
          <Button asChild variant="ghost" className="text-muted-foreground">
            <a href={cinema.eigaUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              映画.comで見る
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
