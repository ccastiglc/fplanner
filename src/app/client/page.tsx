"use client";

import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ClientDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
        <p className="mt-2 text-muted-foreground">Your event dashboard is ready</p>
      </div>
    </div>
  );
}