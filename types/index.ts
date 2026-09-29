export interface Cinema {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number; // km
  photoUrl?: string;
  movieCount?: number; // 上映中の作品数
  eigaUrl?: string;    // eiga.comの映画館ページ
}

export interface Screening {
  id: string;
  movieId: number;
  movieTitle: string;
  posterPath?: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  screen: string;
  availableSeats?: number;
  totalSeats?: number;
  language?: string;
  format?: string; // "2D", "3D", "IMAX"
  ticketUrl?: string;
  /** ticket: 座席選択・購入ページに直接飛べる / official: 映画館の公式サイトに飛ぶだけ（eiga.com非対応のチェーン） */
  booking?: "ticket" | "official";
  isPast?: boolean; // 上映時間が過去かどうか
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NearbyScreening extends Screening {
  cinema: Cinema;
}
