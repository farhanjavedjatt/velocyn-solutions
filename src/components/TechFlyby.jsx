"use client";
/* =========================================================================
   STACK (Chapter 04) — pinned, horizontal-travel reel.
   ========================================================================= */
import { useRef } from "react";
import { useSectionProgress, useViewport } from "@/lib/hooks";

const TECH_CLUSTERS = [
  {
    num: "01",
    title: "Frontend & Mobile",
    items: [
      ["Next.js",                 "v15 · app router"],
      ["React",                   "v19"],
      ["React Native · Expo",     "SDK 51"],
      ["Flutter",                 "stable"],
      ["Tailwind CSS",            "v4"],
      ["Three.js · WebGPU",       "ready"],
    ],
  },
  {
    num: "02",
    title: "Backend & Data",
    items: [
      ["Python",                  "3.12+"],
      ["FastAPI",                 "async"],
      ["Django",                  "5.x"],
      ["Node.js",                 "LTS"],
      ["PostgreSQL + pgvector",   "primary store"],
      ["Redis · Neo4j",           "queue + graph"],
    ],
  },
  {
    num: "03",
    title: "AI, Voice & Agents",
    items: [
      ["Claude",                  "Opus · Haiku"],
      ["OpenAI · Gemini",         "fallback routing"],
      ["LangChain · CrewAI",      "orchestration"],
      ["LiveKit",                 "SIP · WebRTC"],
      ["Deepgram · Cartesia",     "STT / TTS"],
      ["Pinecone · pgvector",     "retrieval"],
    ],
  },
  {
    num: "04",
    title: "Infrastructure & Ops",
    items: [
      ["AWS · GCP",               "multi-region"],
      ["Hetzner + Coolify",       "self-host"],
      ["Docker · Terraform",      "infra-as-code"],
      ["Cloudflare",              "edge · CDN"],
      ["GitHub Actions",          "CI / CD"],
      ["Sentry · Stripe · Clerk", "observability"],
    ],
  },
];

function TechCluster({ cluster }) {
  return (
    <div className="tech-cluster">
      <div className="tech-cluster-head">
        <span className="mono-label">Practice · {cluster.title}</span>
        <span className="tech-cluster-num">{cluster.num}</span>
      </div>
      <ul className="tech-list">
        {cluster.items.map(([name, ver], i) => (
          <li key={i} className="tech-item" data-magnetic>
            <span className="tech-item-name serif">{name}</span>
            <span className="tech-item-ver">{ver}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TechFlyby() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progress = useSectionProgress(sectionRef);
  const vp = useViewport();

  let translate = 0;
  if (trackRef.current) {
    const trackW = trackRef.current.scrollWidth;
    const max = Math.max(0, trackW - vp.w);
    translate = -progress * max;
  }

  return (
    <section className="scene tech" data-scene="04" ref={sectionRef} id="stack">
      <div className="tech-sticky">
        <div className="tech-chapter">
          <span className="mono-label">The stack</span>
        </div>
        <div
          className="tech-track"
          ref={trackRef}
          style={{ transform: `translate3d(${translate}px, 0, 0)` }}
        >
          <div className="tech-intro">
            <h2 className="serif">
              The technologies <br />we <span className="it">reach for</span>, <br />by default.
            </h2>
            <p>
              Opinionated, not exhaustive. We&apos;ve shipped on plenty more, but
              these are the tools that hold up under pressure — the ones we&apos;d
              still pick at 2&nbsp;a.m. on launch night.
            </p>
          </div>

          {TECH_CLUSTERS.map((c, i) => <TechCluster key={i} cluster={c} />)}

          <div className="tech-end">
            <span className="mono-label">Selection criteria</span>
            <h3 className="serif">
              Boring where boring <span className="it">wins</span>.<br />
              Sharp where it <span className="it">matters</span>.
            </h3>
            <p>
              Every tool on this list earns its place by surviving production.
              Anything else is a science project we keep on a different shelf.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
