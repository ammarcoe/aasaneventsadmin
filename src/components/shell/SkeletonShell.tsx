import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function SkeletonShell() {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar skeleton */}
      <aside className="w-[260px] shrink-0 border-r border-border bg-surface p-5 flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="w-28 h-5" />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Skeleton className="w-full h-9 rounded-md" />
            <Skeleton className="w-full h-9 rounded-md" />
            <Skeleton className="w-full h-9 rounded-md" />
            <Skeleton className="w-full h-9 rounded-md" />
          </div>
        </div>
        <div className="pt-4 border-t border-border flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-28 h-2.5" />
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface px-8 flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-24 h-8 rounded-md" />
          </div>
        </header>

        <main className="p-8 max-w-[1400px] w-full flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </main>
      </div>
    </div>
  );
}
