import type { Metadata } from "next";
import { MemoriesHub } from "@/components/memories-hub";

export const metadata: Metadata = {
  title: "My memories | SongKeep",
  robots: { index: false, follow: false, nocache: true }
};

export default function MemoriesPage() {
  return <MemoriesHub />;
}
