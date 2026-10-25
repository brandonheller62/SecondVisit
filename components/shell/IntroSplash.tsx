"use client";

import { useEffect, useState } from "react";

/**
 * Caduceus intro on every page load. The overlay is in the server HTML so it
 * covers the app from the first paint; CSS hides it for reduced motion.
 * Click or any key skips it.
 *
 * Caduceus artwork: Iconoven "caduceus" (MIT), split into staff / snakes /
 * wings so each part can draw in turn.
 */
export function IntroSplash() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const skip = () => setGone(true);
    window.addEventListener("keydown", skip, { once: true });
    return () => window.removeEventListener("keydown", skip);
  }, []);

  if (gone) return null;

  return (
    <div
      className="tm-intro"
      aria-hidden
      onClick={() => setGone(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName === "tm-intro-out") setGone(true);
      }}
    >
      <svg viewBox="0 0 24 24" className="tm-intro-mark" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path className="tm-staff" pathLength={1} d="M12 2.75v18.5" />
        <path className="tm-snake" pathLength={1} d="M9.25 10.25c0 1.75 5.5 1.75 5.5 3.5s-5.5 1.75-5.5 3.5c0 1.25 1.25 2 2.75 2.25" />
        <path className="tm-snake" pathLength={1} d="M14.75 10.25c0 1.75-5.5 1.75-5.5 3.5s5.5 1.75 5.5 3.5c0 1.25-1.25 2-2.75 2.25" />
        <path className="tm-wings" pathLength={1} d="M12 7.75c-3.75.75-7.5-.75-9.25-4c3.5-.5 6.75.25 9.25 2Zm0 0c3.75.75 7.5-.75 9.25-4c-3.5-.5-6.75.25-9.25 2Z" />
      </svg>
      <div className="tm-intro-word text-3xl font-bold tracking-tight">
        Trial <span className="text-accent">Mirror</span>
      </div>
    </div>
  );
}
