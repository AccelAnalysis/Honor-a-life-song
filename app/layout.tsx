import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";
import "./public-hierarchy.css";
import "./consumer-experience.css";

export const metadata: Metadata = {
  title: "Honor a Life Song",
  description: "Human-created songs shaped from the stories, voices, and moments that matter most."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
