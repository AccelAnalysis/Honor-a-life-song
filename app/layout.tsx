import type { Metadata } from "next";
import "./globals.css";
import "./public-hierarchy.css";

export const metadata: Metadata = {
  title: "Honor a Life Song",
  description: "Human-led story-to-song service and program-delivery platform."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
