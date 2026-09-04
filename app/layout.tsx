import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";
import "./public-hierarchy.css";
import "./consumer-experience.css";
import "./songkeep-polish.css";
import "./audience-imagery.css";

export const metadata: Metadata = {
  title: "SongKeep",
  description: "Stories become songs worth keeping."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
