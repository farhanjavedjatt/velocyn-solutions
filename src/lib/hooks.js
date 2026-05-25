"use client";
/* =========================================================================
   Shared hooks & utilities for the Velocyn scroll story.
   ========================================================================= */
import { useState, useEffect, useRef } from "react";

/* ----------------------------------------------------------- scroll y --- */
export function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

/* ------------------------------------------------------- viewport size --- */
export function useViewport() {
  const [vp, setVp] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

/* ------------------------------------------------- progress within ref --- */
export function useSectionProgress(ref) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const calc = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const passed = -rect.top;
      const v = Math.max(0, Math.min(1, passed / total));
      setP(v);
    };
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { calc(); raf = 0; });
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    calc();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
  return p;
}

/* ----------------------------------------------- in-view (one-shot)  --- */
export function useInView(ref, threshold = 0.2) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      });
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return seen;
}

/* ---------------------------------------------------- mouse position --- */
export function useMouse() {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const on = (e) => { ref.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", on);
    return () => window.removeEventListener("mousemove", on);
  }, []);
  return ref;
}

/* ----------------------------------------------- animate counter up --- */
export function useCounter(target, active, { duration = 1400, decimals = 0 } = {}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t) => {
      const e = Math.min(1, (t - start) / duration);
      const k = 1 - Math.pow(1 - e, 3);
      setV(from + (target - from) * k);
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v);
}
