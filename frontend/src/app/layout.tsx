import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sudoku Master",
  description: "A premium production-quality Sudoku game",
  applicationName: "Sudoku Master",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sudoku Master",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on double-tap for games
};

import { AudioInitializer } from "@/components/AudioInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AudioInitializer />
        {children}
      </body>
    </html>
  );
}
