"use client";
/* =========================================================================
   SmoothScroll — Lenis-driven smooth scrolling, hooked into GSAP's
   ticker so ScrollTrigger updates stay in lockstep with Lenis.

   Pattern from the Lenis docs + GSAP cookbook: drive Lenis from gsap.ticker
   and call ScrollTrigger.update() on every Lenis emit. This is what Apple,
   Vercel, Linear, and most Awwwards-grade scrollytelling sites do.
   ========================================================================= */
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Mobile browsers fire resize when the URL bar collapses/expands during
   scroll; by default ScrollTrigger refreshes on every one of those,
   which reads as constant jitter. Ignore them — real orientation
   changes still refresh via the orientationchange path. */
ScrollTrigger.config({ ignoreMobileResize: true });

export default function SmoothScroll() {
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) return; // honor user preference — no smoothing

    /* TOUCH DEVICES: no Lenis (its syncTouch:false mode registers
       non-passive touch listeners without taking control — pure
       overhead). But native iOS touch scrolling can't drive a pinned
       scrub section either: WebKit has unfixed bugs (documented by
       GSAP, present since 2017) where the scroll position is
       intermittently MISREPORTED during touch momentum — the sticky
       pin, canvas scrub, and panel opacities consume the bogus value,
       then snap when the correction lands ("page lurches down, comes
       back up", scaling with swipe speed). normalizeScroll is GSAP's
       purpose-built workaround: it intercepts touch deltas and applies
       scrolling on the JS thread so scroll position, JS reads, and
       paint always agree. This is what production scrollytelling sites
       run on iOS. */
    if (ScrollTrigger.isTouch === 1) {
      ScrollTrigger.normalizeScroll(true);
      return () => ScrollTrigger.normalizeScroll(false);
    }

    const lenis = new Lenis({
      duration: 0.9,                                 // snappier than 1.15
      easing: (t) => 1 - Math.pow(1 - t, 3),         // cubic ease-out
      smoothWheel: true,
      touchMultiplier: 1.2,
      wheelMultiplier: 1.0,
      syncTouch: false,
    });

    /* Tell GSAP to recalculate scroll progress on every Lenis tick. */
    lenis.on("scroll", ScrollTrigger.update);

    /* Expose the instance for programmatic jumps (e.g. the Services
       disciplines index) so they ride the same smooth scroll. */
    window.__lenis = lenis;

    /* Drive Lenis from GSAP's master ticker so they share one rAF loop. */
    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0); // disable lag smoothing — Lenis handles it

    return () => {
      gsap.ticker.remove(onTick);
      if (window.__lenis === lenis) delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
