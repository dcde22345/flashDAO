import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "default" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant = "default", className, children, ...props }: AlertProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        {
          "bg-background text-foreground": variant === "default",
          "bg-destructive/15 text-destructive border-destructive/50": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  );
} 