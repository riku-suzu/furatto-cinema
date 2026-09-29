import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, children }: EmptyStateProps) {
  return (
    <div className="flex animate-rise flex-col items-center justify-center gap-2 py-20 px-6 rounded-2xl text-center bg-card border border-dashed motion-reduce:animate-none">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
