"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * URLが変わるたびに中身をふわっと出す。
 * template.tsx だと直下のセグメントが変わったときしか作り直されず、
 * /cinemas → /cinemas/[id] のような同じ階層内の遷移でアニメーションしないため、パスをkeyにしている。
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in motion-reduce:animate-none">
      {children}
    </div>
  );
}
