import type { Metadata } from "next";
import { Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aasanevent Admin",
  description: "Operations admin panel for Aasanevent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
