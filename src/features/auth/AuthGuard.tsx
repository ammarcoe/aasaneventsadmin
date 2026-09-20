"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { SkeletonShell } from "@/components/shell/SkeletonShell";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authState.status === "unauthenticated") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (authState.status === "forbidden") {
      router.replace("/login?error=forbidden");
    }
  }, [authState, router, pathname]);

  if (authState.status === "loading") {
    return <SkeletonShell />;
  }

  if (authState.status !== "authenticated") {
    return <SkeletonShell />;
  }

  return <>{children}</>;
}
