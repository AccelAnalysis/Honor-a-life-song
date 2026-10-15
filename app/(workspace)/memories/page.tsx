import type { Metadata } from "next";
import { Suspense } from "react";
import { MemoriesHub } from "@/components/memories-hub";

export const metadata: Metadata = {
  title: "My memories | SongKeep",
  robots: { index: false, follow: false, nocache: true }
};

export default function MemoriesPage() {
  return <Suspense fallback={<main><p role="status">Opening SongKeep…</p></main>}><MemoriesHub /></Suspense>;
}
