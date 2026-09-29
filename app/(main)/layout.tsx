export const dynamic = "force-dynamic";

import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import { CurtainProvider } from "@/contexts/CurtainContext";
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
        <CurtainProvider>
          <Header />
          <main className="max-w-6xl mx-auto px-5 py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </CurtainProvider>
      </LocationProvider>
    </FavoritesProvider>
  );
}
