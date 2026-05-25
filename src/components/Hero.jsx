"use client";
/* =========================================================================
   HERO scene — tall pinned scrollytelling hero.

   Pattern: the hero <section> is 360vh tall; an inner sticky container
   stays pinned to viewport-top while the parent scrolls past. The scrub
   canvas plays continuously through that 260vh of pinned scroll, with
   three story panels crossfading on top — one per beat of the V's arc
   (fragments drifting → gathering → V resolved).

   After the hero passes, normal page content (Services / Cases / Stack /
   CTA) continues as before.
   ========================================================================= */
import { useRef, Fragment } from "react";
import { useSectionProgress } from "@/lib/hooks";
import SiteScrub from "./SiteScrub";

const HERO_SCRUB_FRAMES = 768;

const PANELS = [
  {
    headline: (
      <Fragment>
        <span className="word"><span>Software,</span></span>{" "}
        <span className="word"><span className="it">shipped</span></span>{" "}
        <span className="word"><span>before</span></span>{" "}
        <span className="word"><span>your</span></span>{" "}
        <span className="word"><span>competitors</span></span>{" "}
        <span className="word"><span>finish</span></span>{" "}
        <span className="word"><span>the</span></span>{" "}
        <span className="word"><span className="it">kickoff</span></span>
        <span className="word"><span>.</span></span>
      </Fragment>
    ),
    lead: "A small studio building web, mobile, and AI products for founders who'd rather ship than sit in meetings.",
    showCtas: true,
  },
  {
    headline: (
      <Fragment>
        <span className="word"><span>Voice</span></span>{" "}
        <span className="word"><span>agents.</span></span>{" "}
        <span className="word"><span>RAG</span></span>{" "}
        <span className="word"><span>pipelines.</span></span>{" "}
        <span className="word"><span className="it">Multi-tenant</span></span>{" "}
        <span className="word"><span className="it">SaaS.</span></span>
      </Fragment>
    ),
    lead: "Ten disciplines, one studio. We pick the unglamorous tools that survive production — and skip the ones that don't.",
  },
  {
    headline: (
      <Fragment>
        <span className="word"><span className="it">Senior</span></span>{" "}
        <span className="word"><span className="it">engineers.</span></span>{" "}
        <span className="word"><span>No</span></span>{" "}
        <span className="word"><span>kickoff</span></span>{" "}
        <span className="word"><span>theater.</span></span>
      </Fragment>
    ),
    lead: "Direct collaboration with the people writing the code. Real product in your hands by Friday.",
  },
];

function panelOpacity(progress, index, total) {
  /* Each panel owns a span of scroll progress. It's fully visible while
     progress is inside its own span, fades over a transition zone into
     the neighbors. The first panel is fully visible from progress=0
     (no fade-in at the very top of the page — otherwise the hero would
     be a blank screen on initial paint, since the user lands at scroll
     position 0 where the fade-in would have just started). */
  const span = 1 / total;
  const fade = span * 0.4; // crossfade zone width
  const start = index * span;
  const end = (index + 1) * span;

  // Before this panel: invisible (with fade-in from previous panel's tail)
  if (progress <= start - fade) return 0;
  if (progress < start) return (progress - (start - fade)) / fade;

  // Inside this panel's range: fully visible
  if (progress <= end) {
    // ...except the very last panel doesn't need to fade out at end
    if (index === total - 1) return 1;
    return 1;
  }

  // After this panel's range: fade out into next panel
  if (progress < end + fade) return 1 - (progress - end) / fade;
  return 0;
}

function HeroPanel({ panel, index, total, progress, mounted }) {
  const opacity = panelOpacity(progress, index, total);
  const visible = opacity > 0.02;
  return (
    <div
      className={"hero-panel" + (visible ? " is-visible" : "")}
      style={{ opacity, pointerEvents: opacity > 0.5 ? "auto" : "none" }}
      aria-hidden={!visible}
    >
      <div className="hero-lead">{panel.lead}</div>
      <h1 className={"serif hero-headline" + (mounted ? " is-in" : "")}>
        {panel.headline}
      </h1>
      {panel.showCtas && (
        <div className="hero-actions">
          <a href="#work" className="hero-cta" data-magnetic>
            <span>See the work</span>
            <span className="arrow">↓</span>
          </a>
          <a href="#contact" className="hero-cta hero-cta-secondary" data-magnetic>
            <span>Start a project</span>
            <span className="arrow">→</span>
          </a>
        </div>
      )}
    </div>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const progress = useSectionProgress(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="scene hero hero-tall"
      data-scene="01"
      id="top"
    >
      <div className="hero-sticky">
        <SiteScrub
          total={HERO_SCRUB_FRAMES}
          srcBase="/scrub/desktop"
          srcBaseSm="/scrub/mobile"
          poster="/scrub/poster.webp"
          sourceMp4="/scrub/source.mp4"
        />
        <div className="hero-panels">
          {PANELS.map((p, i) => (
            <HeroPanel
              key={i}
              panel={p}
              index={i}
              total={PANELS.length}
              progress={progress}
              mounted={true}
            />
          ))}
        </div>
        <div className="hero-scroll-cue" aria-hidden="true">
          <span className="bar"></span>
        </div>
      </div>
    </section>
  );
}
