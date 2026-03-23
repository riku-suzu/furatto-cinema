export interface Cinema {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number; // km
  rating?: number;
  photoUrl?: string;
}

export interface Movie {
  id: number;
  title: string;
  posterPath?: string;
  overview?: string;
  releaseDate?: string;
  runtime?: number;
  genres?: string[];
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
}

export interface CinemaSchedule {
  cinema: Cinema;
  date: string; // "YYYY-MM-DD"
  screenings: Screening[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}
