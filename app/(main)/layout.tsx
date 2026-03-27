export const dynamic = "force-dynamic";

import Header from "@/components/Header";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { LocationProvider } from "@/contexts/LocationContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <LocationProvider>
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </LocationProvider>
    </FavoritesProvider>
  );
}
