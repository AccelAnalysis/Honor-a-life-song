import type { Metadata } from "next";
import { Suspense } from "react";
import { PostExperienceStorefront } from "@/components/post-experience-storefront";

export const metadata: Metadata = {
  title: "Products from your experience | SongKeep",
  description: "Request keepsakes and approved products created from your SongKeep organization experience."
};

export default function PostExperienceStorePage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening your SongKeep collection…</p></main>}><PostExperienceStorefront /></Suspense>;
}
