"use client";

import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import EmptyState from "./EmptyState";

/** 現在地が未取得のときに表示する、取得を促すパネル */
export default function LocationPrompt({ description }: { description: string }) {
  const { loading, error, requestLocation } = useLocation();

  return (
    <EmptyState icon={MapPin} title="位置情報が必要です">
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <Button onClick={requestLocation} disabled={loading} size="lg" className="h-11 rounded-full px-6 font-bold">
        {loading ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        {loading ? "取得中..." : "現在地を取得する"}
      </Button>
      {error && <p className="text-sm mt-4 text-destructive">{error}</p>}
    </EmptyState>
  );
}
