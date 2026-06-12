"use client";
/* =========================================================================
   APP — composes the scenes and the chrome.
   ========================================================================= */
import { useEffect, useState, useRef, Fragment } from "react";
import { Grain, Frame, Cursor, TopBar, ProgressLine } from "./Chrome";
import SmoothScroll from "./SmoothScroll";
import Hero from "./Hero";
import Services from "./Services";
import CaseReel from "./CaseReel";
import TechFlyby from "./TechFlyby";
import CTA from "./CTA";

export default function App() {
  const [scene, setScene] = useState(1);
  /* Progress bar fill is written straight to the DOM — putting a fresh
     float into React state here re-rendered the ENTIRE app tree on
     every scrolled pixel. setScene stays as state but only changes
     value at section boundaries, so React bails out between them. */
  const progressBarRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const sections = document.querySelectorAll("[data-scene]");
        const mid = window.innerHeight * 0.4;
        let current = 1;
        sections.forEach((s) => {
          const r = s.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) {
            current = parseInt(s.dataset.scene, 10);
          }
        });
        setScene(current);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progressBarRef.current) {
          const p = max > 0 ? window.scrollY / max : 0;
          progressBarRef.current.style.transform = `scaleX(${p})`;
        }
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

  return (
    <Fragment>
      <SmoothScroll />
      <Grain />
      <Frame />
      <Cursor />
      <TopBar onDark={scene > 1} />
      <ProgressLine barRef={progressBarRef} onDark={scene > 1} />

      <main>
        <Hero />
        <Services />
        <CaseReel />
        <TechFlyby />
        <CTA />
      </main>
    </Fragment>
  );
}
