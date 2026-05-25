"use client";
/* =========================================================================
   CASES (Chapter 03) — pinned reel of seven case studies.
   ========================================================================= */
import { useRef, Fragment } from "react";
import { useSectionProgress, useCounter } from "@/lib/hooks";

const CASES = [
  {
    tag: "Voice AI",
    client: "Sales-driven SMBs & service businesses",
    role: "Architecture · STT/TTS pipeline · schema-driven intake",
    title: ["A schema-driven voice agent that answers ", { it: "every inbound call" }, " and qualifies leads in real time."],
    lead: { v: 100, suffix: "%", unit: "pickup rate, 24/7 inbound + outbound" },
    sub: [
      { v: 45, suffix: "",     label: "schema fields collected per call" },
      { v: 0.8, suffix: "s",   decimals: 1, label: "p50 STT→LLM→TTS response latency" },
      { v: 18, suffix: "",     label: "seeded objections handled via pgvector" },
    ],
    stack: ["LiveKit", "Deepgram", "GPT-4o-mini", "Cartesia", "FastAPI", "pgvector"],
  },
  {
    tag: "AI Research Platform",
    client: "CoreThesis · independent investor SaaS",
    role: "End-to-end · MCP architecture · multi-channel gateway",
    title: ["An institutional-grade equity research platform across ", { it: "fourteen interconnected services" }, "."],
    lead: { v: 20, suffix: "+", unit: "messaging surfaces · WhatsApp, Slack, MCP, voice" },
    sub: [
      { v: 14, suffix: "",     label: "production services orchestrated" },
      { v: 8,  suffix: "",     label: "Python data pipelines · SEC, FRED, 13F, GDELT" },
      { v: 12, suffix: "+",    label: "market-data vendors integrated" },
    ],
    stack: ["Next.js 16", "React 19", "MCP SDK", "Drizzle", "Claude", "Stripe"],
  },
  {
    tag: "B2B SaaS",
    client: "Multi-location service businesses network",
    role: "Architecture · microservices · multi-tenant",
    title: ["A multi-tenant operations platform for ", { it: "service businesses" }, ", end to end."],
    lead: { v: 50, suffix: "+", unit: "independent businesses onboarded" },
    sub: [
      { v: 60, suffix: "%",    label: "faster day-to-day operations" },
      { v: 30, suffix: "%",    label: "less inventory waste at the counter" },
      { v: 24, suffix: " hr",  label: "per-business onboarding (was 6 weeks)" },
    ],
    stack: ["Node.js", "React", "React Native", "PostgreSQL", "AWS", "Stripe Connect"],
  },
  {
    tag: "HealthTech",
    client: "Independent medical practices network",
    role: "Architecture · HIPAA from day one · secure WebRTC",
    title: ["A HIPAA-compliant telemedicine platform with ", { it: "end-to-end encryption" }, " on every surface."],
    lead: { v: 100, suffix: "%", unit: "HIPAA safeguards covered, day one" },
    sub: [
      { v: 30, suffix: "s",    label: "returning-patient booking (was 3 min)" },
      { v: 2,  suffix: "×",    label: "faster provider visit prep" },
      { v: 3,  suffix: "",     label: "surfaces · mobile, provider web, admin" },
    ],
    stack: ["Node.js", "React Native", "PostgreSQL (encrypted)", "WebRTC", "AWS (BAA)", "Twilio BAA"],
  },
  {
    tag: "AI / SaaS",
    client: "B2B sales-software company",
    role: "End-to-end · RAG architecture · per-tenant isolation",
    title: ["A white-label AI sales intelligence platform, ", { it: "branded per tenant" }, "."],
    lead: { v: 5, suffix: "", unit: "integrated AI capabilities per organization" },
    sub: [
      { v: 20, suffix: " min", label: "manager weekly reporting (was 4 hours)" },
      { v: 1536, suffix: " dims", label: "vector embeddings per tenant scope" },
      { v: 3,  suffix: "",     label: "multi-tenant orgs live in production" },
    ],
    stack: ["Node.js", "React", "PostgreSQL", "Amazon Bedrock", "LLaMA 3.2", "Salesforce / HubSpot"],
  },
];

function CaseTitle({ parts }) {
  return (
    <h3 className="serif case-title">
      {parts.map((p, i) =>
        typeof p === "string"
          ? <Fragment key={i}>{p}</Fragment>
          : <span key={i} className="it">{p.it}</span>
      )}
    </h3>
  );
}

function CaseSubStat({ stat, active }) {
  const v = useCounter(stat.v, active, {
    duration: 1400,
    decimals: stat.decimals || 0,
  });
  return (
    <div className="case-substat">
      <div className="case-substat-v serif">
        {stat.prefix || ""}{v}{stat.suffix || ""}
      </div>
      <div className="case-substat-l">{stat.label}</div>
    </div>
  );
}

function CaseCard({ kase, idx, total, active }) {
  const leadV = useCounter(kase.lead.v, active, {
    duration: 1800,
    decimals: kase.lead.decimals || 0,
  });
  return (
    <article
      className={"case-card-v2" + (active ? " active" : "")}
      aria-hidden={!active}
    >
      <div className="case-bignum" aria-hidden="true">
        <span className="serif">{String(idx + 1).padStart(2, "0")}</span>
        <span className="case-bignum-sep">/</span>
        <span className="serif">{String(total).padStart(2, "0")}</span>
      </div>

      <div className="case-grid">
        <div className="case-lead">
          <span className="mono-label">Case {String(idx + 1).padStart(2, "0")} · {kase.tag}</span>
          <div className="case-leadnum serif">
            <span className="case-leadnum-v">
              {kase.lead.prefix || ""}{leadV}{kase.lead.suffix || ""}
            </span>
          </div>
          <div className="case-leadnum-unit">{kase.lead.unit}</div>
        </div>

        <div className="case-meta">
          <CaseTitle parts={kase.title} />
          <div className="case-substats">
            {kase.sub.map((s, i) => <CaseSubStat key={i} stat={s} active={active} />)}
          </div>
          <div className="case-row">
            <div className="case-row-field">
              <span className="case-row-l">Client</span>
              <span className="case-row-v">{kase.client}</span>
            </div>
            <div className="case-row-field">
              <span className="case-row-l">Our role</span>
              <span className="case-row-v">{kase.role}</span>
            </div>
          </div>
          <div className="case-stack">
            {kase.stack.map((t, i) => <span key={i} className="case-stack-chip">{t}</span>)}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CaseReel() {
  const sectionRef = useRef(null);
  const progress = useSectionProgress(sectionRef);
  const n = CASES.length;
  const padded = Math.max(0, Math.min(1, (progress - 0.04) / 0.92));
  const activeIndex = Math.min(n - 1, Math.floor(padded * n));

  return (
    <section className="scene cases-v2 section-dark" data-scene="03" ref={sectionRef} id="work">
      <div className="cases-v2-sticky">
        <div className="cases-v2-chapter">
          <span className="mono-label">Selected work</span>
        </div>
        <div className="cases-v2-stage">
          {CASES.map((kase, i) => (
            <CaseCard
              key={i}
              kase={kase}
              idx={i}
              total={n}
              active={i === activeIndex}
            />
          ))}
        </div>

        <div className="cases-v2-progress">
          {CASES.map((_, i) => (
            <span
              key={i}
              className={"cases-v2-tick" + (i <= activeIndex ? " filled" : "")}
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
}
