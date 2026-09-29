import { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorBannerProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function ErrorBanner({ title, children, className = "" }: ErrorBannerProps) {
  return (
    <Alert variant="destructive" className={`animate-rise border-destructive/30 bg-destructive/10 px-4 py-3 motion-reduce:animate-none ${className}`}>
      <CircleAlert />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className={title ? "" : "col-start-2 text-destructive"}>{children}</AlertDescription>
    </Alert>
  );
}
