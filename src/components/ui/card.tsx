"use client";

import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={["rounded-t-md border-b border-border", className]
      .filter(Boolean)
      .join(" ")}
    style={{}}
    {...props}
  >
    <div className="space-y-4">{children}</div>
  </div>
));

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={["rounded-t-md border-b border-border", className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={["text-xl font-bold text-foreground", className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={["p-4", className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = "CardContent";