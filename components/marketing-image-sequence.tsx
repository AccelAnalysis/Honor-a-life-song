"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./marketing-image-sequence.module.css";

type Photo = { id: string; alt: string; credit: string; position?: string };
export const marketingPhotos: Record<"hero" | "gathering", readonly Photo[]> = {
  hero: [
    { id: "9479826", alt: "A company team celebrating together with a high five", credit: "Monstera Production / Pexels", position: "center 42%" },
    { id: "8065098", alt: "A family sharing an activity together", credit: "Pexels" },
    { id: "8885506", alt: "Friends enjoying music and dancing together", credit: "MART PRODUCTION / Pexels" },
    { id: "7922179", alt: "A quiet musical moment at home", credit: "Pexels" }
  ],
  gathering: [
    { id: "8885506", alt: "A group of friends dancing and celebrating", credit: "MART PRODUCTION / Pexels" },
    { id: "9630217", alt: "People bringing their hands together in a circle", credit: "Ivan S / Pexels" },
    { id: "8460034", alt: "A relaxed moment listening at home", credit: "Pexels" }
  ]
};
/** Ambient photography only: copy and controls never move with the images. */
export function MarketingImageSequence({ collection = "hero", className = "", priority = false, soft = false }: {
  collection?: keyof typeof marketingPhotos; className?: string; priority?: boolean; soft?: boolean;
}) {
  const photos = marketingPhotos[collection], root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0), [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true), [visible, setVisible] = useState(false), [documentVisible, setDocumentVisible] = useState(true);
  const [loaded, setLoaded] = useState<number[]>([]), [failed, setFailed] = useState<number[]>([]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduceMotion(preference.matches), visibility = () => setDocumentVisible(!document.hidden);
    motion(); visibility(); preference.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)));
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); preference.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || reduceMotion || !visible || !documentVisible || loaded.length < 2) return;
    const timer = window.setInterval(() => setActive(current => {
      for (let offset = 1; offset < photos.length; offset++) {
        const next = (current + offset) % photos.length;
        if (loaded.includes(next) && !failed.includes(next)) return next;
      }
      return current;
    }), 8500);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, reduceMotion, visible, documentVisible, loaded, failed, photos.length]);
  // An unavailable stock image must never replace a successfully loaded one.
  const shown = failed.includes(active) ? loaded.find(index => !failed.includes(index)) ?? active : active;
  return <div ref={root} className={`${className} ${styles.sequence}`} data-photo={shown} data-reduced-motion={reduceMotion} style={{ backgroundImage: "none" }}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
    <div className={styles.photos} role="img" aria-label={photos[shown].alt}>
      {photos.map((photo, index) => <Image key={photo.id} unoptimized fill alt="" sizes="(max-width: 720px) 100vw, 100vw"
        src={`https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=1800`}
        priority={priority && index === 0} loading={priority && index === 0 ? undefined : "lazy"}
        onLoad={() => setLoaded(current => current.includes(index) ? current : [...current, index])}
        onError={() => setFailed(current => current.includes(index) ? current : [...current, index])}
        className={index === shown ? styles.active : styles.inactive} style={{ objectPosition: photo.position ?? "center" }} />)}
      <div className={soft ? styles.softOverlay : styles.overlay} />
    </div>
    <span className={styles.credit}>Photo: {photos[shown].credit}</span>
    {!reduceMotion && loaded.length > 1 ? <button type="button" className={styles.pause} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Play photos" : "Pause photos"}</button> : null}
  </div>;
}
