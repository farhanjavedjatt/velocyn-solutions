"use client";
/* =========================================================================
   SERVICES — Chapter 02.
   ========================================================================= */
import { useEffect, useRef, Fragment } from "react";
import { useSectionProgress } from "@/lib/hooks";

const SERVICES = [
  {
    num: "01",
    title: "AI Voice Agents",
    headline: ["Voice AI that ", { it: "answers every call" }, ", 24/7."],
    body: "Schema-driven inbound and outbound voice agents on LiveKit + SIP. Sub-second turn-taking, returning-caller memory via pgvector, qualification scoring, and post-call deliverables — built to replace receptionists and SDRs, not augment them.",
    more: "Every call lands in your CRM with a transcript, a score, and a next step, and the agent improves weekly because evals run against real call logs, not vibes.",
    bullets: [
      "LiveKit + SIP (Twilio · Telnyx) telephony",
      "Deepgram · GPT-4o-mini · Cartesia pipeline",
      "Returning-caller identification (semantic + exact)",
      "Seeded objection playbook with response strategies",
      "Schema-driven intake (~45 typed fields)",
      "Post-call deliverables: score, summary, follow-up email",
    ],
  },
  {
    num: "02",
    title: "AI Applications & RAG",
    headline: ["AI features your users ", { it: "will actually keep" }, " using."],
    body: "Embedded copilots, retrieval over your knowledge base, tool use that takes real actions. Multi-agent handoffs where they matter, single-agent simplicity where they don't. The kind of feature that moves retention — not the kind that gets retired in three months.",
    more: "Answers ship with citations, guardrails catch the hallucinations before your users do, and cost routing keeps the inference bill predictable.",
    bullets: [
      "Production RAG with citations & guardrails",
      "In-product copilots · MCP tool wiring",
      "Multi-agent handoffs · LangChain · CrewAI",
      "Per-tenant data isolation & prompt customization",
      "Multi-model fallback & cost routing",
      "Eval suites against regressions",
    ],
  },
  {
    num: "03",
    title: "Document & Data Pipelines",
    headline: ["Pipelines that ", { it: "survive the messy data" }, "."],
    body: "PDF extraction, email reconciliation, SEC filings, market data feeds. Three-way reconciliations across heterogeneous sources. Confidence scoring on every field. Audit trails on every decision.",
    more: "When a document doesn't parse, it lands in a review queue with the reason attached — nothing silently disappears, and the pipeline keeps moving while a human resolves the edge case.",
    bullets: [
      "PDF · email · CSV ingestion at scale",
      "LLM-based field extraction with confidence",
      "Three-way reconciliation engines",
      "Schedulers · retries · dead-letter queues",
      "FastAPI + asyncpg for non-blocking IO",
      "Vector + relational queries joined cleanly",
    ],
  },
  {
    num: "04",
    title: "MCP & AI Infrastructure",
    headline: ["MCP servers that ", { it: "expose your product" }, " to every agent."],
    body: "Model Context Protocol servers wiring your tools, resources, and prompts into Claude, ChatGPT, Copilot, and Goose. We've shipped MCP across fourteen-service architectures and as npm packages others install.",
    more: "Auth, rate limits, and per-tenant scoping handled at the protocol layer — so exposing your product to every agent doesn't mean exposing it to everyone.",
    bullets: [
      "Custom MCP servers · tools · resources · prompts",
      "Published MCP plugins on npm",
      "Multi-channel agent gateways (WhatsApp · Slack · Telegram · voice)",
      "Drizzle / Postgres backed MCP state",
    ],
  },
  {
    num: "05",
    title: "Multi-tenant SaaS",
    headline: ["SaaS you can ", { it: "actually scale" }, " — not rewrite."],
    body: "Multi-location, multi-business, multi-org platforms with strict data isolation, white-label branding, RBAC, and per-tenant billing. From three-surface ecosystems to fourteen-service polyrepos.",
    more: "Tenancy decisions are made once, at the schema level, and enforced everywhere — so adding your hundredth customer is a config change, not a migration.",
    bullets: [
      "Strict tenant isolation at DB + vector store",
      "White-label theming (logo, colors, domain)",
      "RBAC with audit trails on every record",
      "Stripe Connect · subscription + per-order billing",
      "Per-tenant prompt + tool customization",
      "Onboarding flows that drop from weeks to hours",
    ],
  },
  {
    num: "06",
    title: "Web Platforms",
    headline: ["Next.js apps that ", { it: "hold up in production" }, "."],
    body: "From focused MVPs to multi-tenant SaaS with billing, auth, RBAC, and admin portals. Server actions, Suspense, App Router. Operator consoles consolidating seven dashboards into one.",
    more: "Performance budgets enforced in CI, error tracking wired before launch, and thirty days of post-launch support included — because shipping is the start, not the finish line.",
    bullets: [
      "Next.js 15/16 · React 19 · App Router",
      "Stripe billing · subscriptions + metered",
      "Auth · Clerk · NextAuth · custom OIDC",
      "Operator dashboards · keyboard-first UX",
      "Headless commerce on Shopify Storefront API",
      "CI / CD · error tracking · 30-day post-launch support",
    ],
  },
  {
    num: "07",
    title: "Real-time & Live Systems",
    headline: ["Live products with ", { it: "sub-second feel" }, "."],
    body: "WebRTC video, WebSocket-backed dashboards, real-time collaborative state. Latency budgets owned end-to-end — from STT to LLM to TTS, from socket to render frame.",
    more: "We instrument p95 and p99 from day one, because a live product that feels fast in the demo and slow in production is worse than no live product at all.",
    bullets: [
      "WebRTC video · HIPAA-grade media servers",
      "WebSocket state sync across surfaces",
      "Real-time collaborative editors",
      "Live dashboards · server-sent events",
      "LiveKit Egress · recording to S3-compatible storage",
      "Latency profiling · p95/p99 instrumentation",
    ],
  },
  {
    num: "08",
    title: "Mobile Applications",
    headline: ["Mobile apps people ", { it: "actually open" }, " twice."],
    body: "Cross-platform first, native where it counts. iOS and Android apps that feel right on the device, survive App Store review, and don't fall apart the first time someone has spotty signal.",
    more: "Offline-first sync where it matters, over-the-air updates from day one, and crash reporting wired in before the first TestFlight build goes out.",
    bullets: [
      "React Native + Expo (our default)",
      "Native modules · BLE · push · payments",
      "Offline-first sync where it matters",
      "OTA updates · Crashlytics from day 1",
      "App Store & Play submission · TestFlight",
      "Flutter for branded consumer UI when fit",
    ],
  },
  {
    num: "09",
    title: "Compliance Engineering",
    headline: ["HIPAA, SOC 2, GDPR ", { it: "from day one" }, "."],
    body: "Compliance designed into the architecture, not bolted on at audit. BAA-covered infrastructure, field-level encryption on PHI, tamper-evident audit logs, role-based access on every record.",
    more: "When the auditor asks how a piece of data flows through the system, the answer is a diagram we drew in week one — not a scramble through six months of commits.",
    bullets: [
      "HIPAA · BAAs on every vendor in the data path",
      "Field-level encryption on PHI at rest + in transit",
      "Tamper-evident audit logs · WORM storage",
      "Role-based access on every record read",
      "Documented hardening posture per dependency",
      "SOC 2 controls mapped from week one",
    ],
  },
  {
    num: "10",
    title: "Infrastructure & DevOps",
    headline: ["Infrastructure that ", { it: "doesn't need a meeting" }, "."],
    body: "Self-hosted Coolify on Hetzner, multi-region AWS, edge on Cloudflare. Docker + Compose for everything. Reproducible from a fresh clone in under fifteen minutes.",
    more: "Deploys are boring, rollbacks are one command, and the monthly bill is a number you can explain — infrastructure that scales with the product instead of ahead of it.",
    bullets: [
      "AWS · GCP multi-region deployments",
      "Hetzner + Coolify self-hosting",
      "Docker · Compose · Terraform IaC",
      "Cloudflare R2 · edge · zero egress",
      "GitHub Actions CI / CD with secret scoping",
      "Observability · Sentry · Logflare · cost dashboards",
    ],
  },
];

function ServiceHeadline({ parts }) {
  return (
    <h3 className="serif">
      {parts.map((p, i) =>
        typeof p === "string"
          ? <Fragment key={i}>{p}</Fragment>
          : <span key={i} className="it">{p.it}</span>
      )}
    </h3>
  );
}

export default function Services() {
  const sectionRef = useRef(null);
  const indexRef = useRef(null);
  const progress = useSectionProgress(sectionRef);

  const n = SERVICES.length;
  const padded = Math.max(0, Math.min(1, (progress - 0.05) / 0.9));
  const activeIndex = Math.min(n - 1, Math.floor(padded * n));

  /* Jump directly to a discipline: invert the activeIndex math — scroll
     the window to the page position whose section progress lands in the
     middle of discipline i's band. Rides Lenis when available so the
     jump uses the same smooth easing as wheel scrolling. */
  const scrollToService = (i) => {
    const section = sectionRef.current;
    if (!section) return;
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const targetProgress = 0.05 + 0.9 * ((i + 0.5) / n);
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const y = sectionTop + targetProgress * total;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  /* Mobile: keep the active discipline visible inside the scrollable list. */
  useEffect(() => {
    const list = indexRef.current;
    if (!list) return;
    const item = list.querySelectorAll("li")[activeIndex];
    if (!item) return;
    /* Only auto-scroll when the list is actually scrollable (i.e. its
       content overflows the container — true on mobile, false on desktop). */
    if (list.scrollHeight > list.clientHeight + 4) {
      item.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeIndex]);

  return (
    <section className="scene services section-dark" data-scene="02" ref={sectionRef} id="services">
      <div className="services-sticky">

        <div className="services-left">
          <div className="chapter-mark">
            <span className="mono-label">What we do</span>
          </div>
          <div className="service-stage">
            {SERVICES.map((svc, i) => (
              <article
                key={i}
                className={"service-card" + (i === activeIndex ? " active" : "")}
                aria-hidden={i !== activeIndex}
              >
                <div className="service-card-num">/{svc.num}</div>
                <ServiceHeadline parts={svc.headline} />
                <p>
                  {svc.body}
                  {svc.more && <span className="svc-more"> {svc.more}</span>}
                </p>
                <ul className="bullets">
                  {svc.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="services-right" ref={indexRef}>
          <div
            className="services-progress"
            style={{ transform: `scaleY(${padded})` }}
          ></div>
          <div className="services-index-head">Disciplines</div>
          <ul className="services-index">
            {SERVICES.map((svc, i) => (
              <li
                key={i}
                className={i === activeIndex ? "active" : ""}
                role="button"
                tabIndex={0}
                aria-label={`Jump to ${svc.title}`}
                data-magnetic
                onClick={() => scrollToService(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    scrollToService(i);
                  }
                }}
              >
                <span className="n">/{svc.num}</span>
                <span className="title">{svc.title}</span>
                <span className="marker" aria-hidden="true"></span>
              </li>
            ))}
          </ul>
          <div className="services-foot">
            Scroll to advance · {String(activeIndex + 1).padStart(2,"0")} / {String(n).padStart(2,"0")}
          </div>
        </div>
      </div>
    </section>
  );
}
