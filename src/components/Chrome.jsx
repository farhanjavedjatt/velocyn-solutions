"use client";
/* =========================================================================
   Chrome: cursor + top nav + slim progress line.
   ========================================================================= */
import { useEffect, useRef, useState, Fragment } from "react";

export function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const target = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const [magnetic, setMagnetic] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const mag = !!(el && el.closest("[data-magnetic]"));
      setMagnetic(mag);
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = () => {
      const t = target.current;
      const r = ringPos.current;
      r.x += (t.x - r.x) * 0.18;
      r.y += (t.y - r.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${r.x}px, ${r.y}px) translate(-50%,-50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Fragment>
      <div ref={dotRef} className="cursor-dot"></div>
      <div ref={ringRef} className={"cursor-ring" + (magnetic ? " is-magnetic" : "")}></div>
    </Fragment>
  );
}

export function TopBar({ onDark }) {
  const logoSrc = onDark ? "/velocyn-logo-cream.png" : "/velocyn-logo.png";
  return (
    <div className={"chrome top" + (onDark ? " is-on-dark" : "")}>
      <a href="#top" className="logo" data-magnetic aria-label="Velocyn Solutions">
        <img src={logoSrc} alt="Velocyn Solutions" />
      </a>
      <nav className="nav">
        <a href="#services" data-magnetic>Services</a>
        <a href="#work"     data-magnetic>Work</a>
        <a href="#stack"    data-magnetic>Stack</a>
        <a href="#contact"  data-magnetic>Contact</a>
      </nav>
      <a href="#contact" className="nav-cta" data-magnetic>
        <span>Talk to us</span>
        <span className="arrow">→</span>
      </a>
    </div>
  );
}

export function ProgressLine({ progress, onDark }) {
  return (
    <div className={"progress-line" + (onDark ? " is-on-dark" : "")} aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }}></span>
    </div>
  );
}

export function Grain() { return null; }
export function Frame() { return <div className="page-frame" aria-hidden="true"></div>; }
