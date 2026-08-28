import type { Metadata } from "next";
import { MemoriesHub } from "@/components/memories-hub";

export const metadata: Metadata = {
  title: "My Memories | Honor a Life Song",
  robots: { index: false, follow: false, nocache: true }
};

export default function MemoriesPage() {
  return <MemoriesHub />;
}
