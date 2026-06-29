"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Phase {
  id: number;
  title: string;
  horizon: string;
  thesis: string;
  capabilities: string[];
  tags: string[];
  isNow?: boolean;
}

// ─── Phase data ───────────────────────────────────────────────────────────────

const phases: Phase[] = [
  {
    id: 1,
    title: "Foundation",
    horizon: "This demo",
    thesis:
      "Single investigative agent with real tool use, transparent, measurable, and citation-backed.",
    capabilities: [
      "Real Anthropic tool use",
      "Transparent TF-IDF clustering",
      "Feature-based classification",
      "Grounded cited briefs",
      "Human-review queue",
      "Full eval rail (P/R/F1 + agent decision metrics + latency)",
    ],
    tags: ["AI agents", "LLM orchestration", "evaluation"],
    isNow: true,
  },
  {
    id: 2,
    title: "Scale & Specialize",
    horizon: "3–6 months",
    thesis:
      "Multi-agent analyst team, real RAG corroboration, per-customer relevance routing.",
    capabilities: [
      "Supervisor + Verifier + Impact Analyst + Editor agents",
      "Embeddings + vector DB corroboration",
      "Per-customer asset/relevance routing",
      "Provider abstraction + model routing",
    ],
    tags: ["orchestration", "RAG", "noise reduction"],
  },
  {
    id: 3,
    title: "Learn & Harden",
    horizon: "6–12 months",
    thesis:
      "Domain-fine-tuned models, automated version gating, full observability.",
    capabilities: [
      "SFT + preference optimization on analyst-verified alerts",
      "Automated model-version gating",
      "Drift monitoring + retraining triggers",
      "Cost/latency observability dashboards",
    ],
    tags: ["fine-tuning", "reproducibility", "drift/latency"],
  },
  {
    id: 4,
    title: "Anticipate & Expand",
    horizon: "12+ months",
    thesis:
      "Predictive early-warning, multimodal verification, compliance-grade deployment.",
    capabilities: [
      "Predictive escalation / early-warning signals",
      "Multimodal verification (image/video, deepfake detection)",
      "Expanded delivery integrations",
      "FedRAMP/StateRAMP-grade deployment + data residency",
    ],
    tags: ["multimodal", "predictive", "compliance"],
  },
];

// ─── Tag color map ────────────────────────────────────────────────────────────

function tagColor(tag: string): { color: string; bg: string; border: string } {
  const agentTags = ["AI agents", "LLM orchestration", "orchestration", "RAG"];
  const evalTags = [
    "evaluation",
    "fine-tuning",
    "reproducibility",
    "drift/latency",
  ];
  const futureTags = ["multimodal", "predictive", "compliance", "noise reduction"];

  if (agentTags.includes(tag)) {
    return {
      color: "var(--accent-agent)",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.25)",
    };
  }
  if (evalTags.includes(tag)) {
    return {
      color: "var(--accent-primary)",
      bg: "rgba(56,189,248,0.08)",
      border: "rgba(56,189,248,0.25)",
    };
  }
  if (futureTags.includes(tag)) {
    return {
      color: "#34D399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.25)",
    };
  }
  return {
    color: "var(--text-muted)",
    bg: "rgba(91,102,119,0.10)",
    border: "rgba(91,102,119,0.25)",
  };
}

// ─── Dot positions (% along spine) ────────────────────────────────────────────

const dotPositions = ["12.5%", "37.5%", "62.5%", "87.5%"];

const ease = [0.16, 1, 0.3, 1] as const;

// ─── Phase Card ───────────────────────────────────────────────────────────────

interface PhaseCardProps {
  phase: Phase;
  index: number;
  inView: boolean;
}

function PhaseCard({ phase, index, inView }: PhaseCardProps) {
  const cardBorder = phase.isNow
    ? "1px solid rgba(56,189,248,0.45)"
    : "1px solid rgba(255,255,255,0.08)";

  const cardShadow = phase.isNow
    ? "0 0 24px rgba(56,189,248,0.07)"
    : "none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.45, ease, delay: 0.1 * index }}
      style={{
        flex: "1 1 220px",
        minWidth: "200px",
        position: "relative",
        backgroundColor: "var(--bg-card)",
        border: cardBorder,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        overflow: "hidden",
        boxShadow: cardShadow,
      }}
    >
      {/* Decorative phase number */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-4px",
          right: "12px",
          fontSize: "64px",
          fontWeight: 700,
          fontFamily: "var(--font-jetbrains-mono, monospace)",
          color: "var(--text-primary)",
          opacity: 0.06,
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {phase.id}
      </span>

      {/* YOU ARE HERE badge */}
      {phase.isNow && (
        <div style={{ display: "flex" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              color: "var(--accent-primary)",
              backgroundColor: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.35)",
              borderRadius: "4px",
              padding: "2px 8px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            YOU ARE HERE
          </span>
        </div>
      )}

      {/* Horizon pill */}
      <div>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "var(--text-muted)",
            backgroundColor: "rgba(91,102,119,0.12)",
            border: "1px solid rgba(91,102,119,0.2)",
            borderRadius: "999px",
            padding: "2px 9px",
          }}
        >
          {phase.horizon}
        </span>
      </div>

      {/* Title */}
      <div>
        <p
          style={{
            margin: "0 0 2px 0",
            fontSize: "11px",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Phase {phase.id}
        </p>
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: phase.isNow ? "var(--accent-primary)" : "var(--text-primary)",
            fontFamily: "var(--font-inter)",
          }}
        >
          {phase.title}
        </h3>
      </div>

      {/* Thesis */}
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          fontWeight: 500,
          lineHeight: 1.55,
          color: "var(--text-primary)",
          fontFamily: "var(--font-inter)",
        }}
      >
        {phase.thesis}
      </p>

      {/* Capabilities list */}
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          flex: 1,
        }}
      >
        {phase.capabilities.map((cap) => (
          <li
            key={cap}
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter)",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: "7px",
            }}
          >
            <span
              style={{
                color: phase.isNow
                  ? "var(--accent-primary)"
                  : "var(--text-muted)",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              ·
            </span>
            <span>{cap}</span>
          </li>
        ))}
      </ul>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {phase.tags.map((tag) => {
          const tc = tagColor(tag);
          return (
            <span
              key={tag}
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                color: tc.color,
                backgroundColor: tc.bg,
                border: `1px solid ${tc.border}`,
                borderRadius: "4px",
                padding: "2px 7px",
              }}
            >
              {tag}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RoadmapSection() {
  const spineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);

  const spineInView = useInView(spineRef, { once: true, margin: "-60px 0px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-80px 0px" });
  const closingInView = useInView(closingRef, {
    once: true,
    margin: "-60px 0px",
  });

  function scrollToDemo() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="roadmap"
      style={{
        backgroundColor: "var(--bg-base)",
        padding: "80px 0",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: "48px",
        }}
      >
        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={spineInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease }}
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Roadmap
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter)",
              lineHeight: 1.6,
              maxWidth: "540px",
            }}
          >
            A phased path from working demo to production-grade, compliance-ready
            crisis intelligence.
          </p>
        </motion.div>

        {/* ── Horizontal spine (desktop) ── */}
        <div
          ref={spineRef}
          style={{ position: "relative", height: "32px" }}
          aria-hidden="true"
        >
          {/* Background track */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.08)",
              transform: "translateY(-50%)",
            }}
          />

          {/* Animated fill */}
          <motion.div
            initial={{ width: "0%" }}
            animate={spineInView ? { width: "100%" } : { width: "0%" }}
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-agent) 60%, rgba(52,211,153,0.6) 100%)",
              transform: "translateY(-50%)",
              boxShadow: "0 0 8px rgba(56,189,248,0.4)",
            }}
          />

          {/* Dot markers */}
          {dotPositions.map((pos, i) => (
            <motion.div
              key={pos}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                spineInView
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0 }
              }
              transition={{
                duration: 0.35,
                ease,
                delay: 0.3 + 0.18 * i,
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: pos,
                transform: "translate(-50%, -50%)",
                width: i === 0 ? "10px" : "8px",
                height: i === 0 ? "10px" : "8px",
                borderRadius: "50%",
                backgroundColor:
                  i === 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
                border:
                  i === 0
                    ? "2px solid var(--accent-primary)"
                    : "1.5px solid rgba(255,255,255,0.2)",
                boxShadow: i === 0 ? "0 0 10px rgba(56,189,248,0.6)" : "none",
              }}
            />
          ))}
        </div>

        {/* ── Phase cards grid ── */}
        <div
          ref={cardsRef}
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          {phases.map((phase, i) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={i}
              inView={cardsInView}
            />
          ))}
        </div>

        {/* ── Mobile vertical fallback note ── */}
        {/* The cards already wrap on mobile via flexWrap; this note is for accessibility */}

        {/* ── Closing line + CTA ── */}
        <motion.div
          ref={closingRef}
          initial={{ opacity: 0, y: 12 }}
          animate={
            closingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
          }
          transition={{ duration: 0.4, ease }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontStyle: "italic",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter)",
              lineHeight: 1.6,
            }}
          >
            The pipeline is real. The agent is live. Run it.
          </p>
          <button
            onClick={scrollToDemo}
            style={{
              cursor: "pointer",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "var(--font-inter)",
              backgroundColor: "var(--accent-primary)",
              color: "#0A0E14",
              border: "none",
              transition: "filter 150ms ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(1.1)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(1)")
            }
            onMouseDown={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(0.95)")
            }
            onMouseUp={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(1.1)")
            }
          >
            Run the demo →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
