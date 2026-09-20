import React from "react";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { EnvBanner } from "@/components/shell/EnvBanner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-bg">
        <EnvBanner />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            <TopBar />
            <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
