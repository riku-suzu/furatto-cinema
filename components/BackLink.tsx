import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="flex justify-center pt-4">
      <Button asChild variant="ghost" className="text-muted-foreground">
        <Link href={href}>
          <ArrowLeft />
          {children}
        </Link>
      </Button>
    </div>
  );
}
