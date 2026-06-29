"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Shared node style ────────────────────────────────────────────────────────

const baseNodeStyle: React.CSSProperties = {
  background: "#161D2B",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "8px",
  color: "#E6EAF0",
  fontSize: "12px",
  padding: "8px 12px",
  fontFamily: "var(--font-jetbrains-mono, monospace)",
  minWidth: "140px",
  textAlign: "center",
  whiteSpace: "pre-line",
  lineHeight: 1.5,
};

const agentNodeStyle: React.CSSProperties = {
  ...baseNodeStyle,
  border: "1px solid rgba(167,139,250,0.6)",
  boxShadow: "0 0 12px rgba(167,139,250,0.15)",
};

const escalateNodeStyle: React.CSSProperties = {
  ...baseNodeStyle,
  border: "1px solid rgba(251,191,36,0.6)",
  boxShadow: "0 0 12px rgba(251,191,36,0.12)",
};

// ─── Nodes ────────────────────────────────────────────────────────────────────

const nodes: Node[] = [
  // INGESTION LANE
  {
    id: "n1",
    type: "default",
    position: { x: 0, y: 50 },
    data: { label: "Source Connectors\n(Social · News · Gov · Sensor · Partner)" },
    style: baseNodeStyle,
  },
  {
    id: "n2",
    type: "default",
    position: { x: 0, y: 170 },
    data: { label: "Streaming Bus\n(Kafka / SQS ← JD)" },
    style: baseNodeStyle,
  },
  {
    id: "n3",
    type: "default",
    position: { x: 0, y: 290 },
    data: { label: "Preprocess\n(dedup · lang · translate)" },
    style: baseNodeStyle,
  },

  // INTELLIGENCE LANE
  {
    id: "n4",
    type: "default",
    position: { x: 220, y: 50 },
    data: { label: "Embeddings\nService" },
    style: baseNodeStyle,
  },
  {
    id: "n5",
    type: "default",
    position: { x: 220, y: 150 },
    data: { label: "Vector DB\n(RAG ← JD)" },
    style: baseNodeStyle,
  },
  {
    id: "n6",
    type: "default",
    position: { x: 220, y: 260 },
    data: { label: "Fine-tuned\nClassifier\n(GPU ← JD)" },
    style: baseNodeStyle,
  },
  {
    id: "n7",
    type: "default",
    position: { x: 220, y: 360 },
    data: { label: "Clustering\nService" },
    style: baseNodeStyle,
  },

  // AGENT LANE
  {
    id: "n8",
    type: "default",
    position: { x: 440, y: 160 },
    data: { label: "Orchestration\nService" },
    style: baseNodeStyle,
  },
  {
    id: "n9",
    type: "default",
    position: { x: 440, y: 50 },
    data: { label: "Anthropic Claude\n(← JD)" },
    style: agentNodeStyle,
  },
  {
    id: "n10",
    type: "default",
    position: { x: 440, y: 260 },
    data: { label: "OpenAI\n(← JD)" },
    style: baseNodeStyle,
  },
  {
    id: "n11",
    type: "default",
    position: { x: 560, y: 160 },
    data: { label: "Tool Services\n(Corroboration · Source · Assets · Geo)" },
    style: baseNodeStyle,
  },
  {
    id: "n12",
    type: "default",
    position: { x: 560, y: 280 },
    data: { label: "Grounding\nGuard" },
    style: baseNodeStyle,
  },

  // HUMAN-IN-LOOP LANE
  {
    id: "n13",
    type: "default",
    position: { x: 680, y: 160 },
    data: { label: "Analyst Review\nConsole\n(24/7 escalations)" },
    style: escalateNodeStyle,
  },

  // DELIVERY LANE
  {
    id: "n14",
    type: "default",
    position: { x: 780, y: 100 },
    data: { label: "Routing\nEngine" },
    style: baseNodeStyle,
  },
  {
    id: "n15",
    type: "default",
    position: { x: 900, y: 100 },
    data: { label: "Slack · Teams\nEmail · Everbridge\nEsri · API" },
    style: baseNodeStyle,
  },

  // PLATFORM
  {
    id: "n16",
    type: "default",
    position: { x: 50, y: 460 },
    data: { label: "S3 Object Storage (← JD)" },
    style: baseNodeStyle,
  },
  {
    id: "n17",
    type: "default",
    position: { x: 280, y: 460 },
    data: { label: "CloudWatch Observability (← JD)" },
    style: baseNodeStyle,
  },
  {
    id: "n18",
    type: "default",
    position: { x: 530, y: 460 },
    data: { label: "Eval Harness + Drift Monitor" },
    style: baseNodeStyle,
  },
  {
    id: "n19",
    type: "default",
    position: { x: 740, y: 460 },
    data: { label: "Audit Log / Provenance" },
    style: baseNodeStyle,
  },
];

// ─── Edges ────────────────────────────────────────────────────────────────────

const edgeDefaults = {
  animated: true,
  type: "smoothstep" as const,
  style: { stroke: "rgba(56,189,248,0.5)", strokeWidth: 1.5 },
};

const edges: Edge[] = [
  { id: "e1-2",   source: "n1",  target: "n2",  ...edgeDefaults },
  { id: "e2-3",   source: "n2",  target: "n3",  ...edgeDefaults },
  { id: "e3-4",   source: "n3",  target: "n4",  ...edgeDefaults },
  { id: "e3-6",   source: "n3",  target: "n6",  ...edgeDefaults },
  { id: "e3-7",   source: "n3",  target: "n7",  ...edgeDefaults },
  { id: "e4-5",   source: "n4",  target: "n5",  ...edgeDefaults },
  { id: "e5-8",   source: "n5",  target: "n8",  ...edgeDefaults },
  { id: "e6-8",   source: "n6",  target: "n8",  ...edgeDefaults },
  { id: "e7-8",   source: "n7",  target: "n8",  ...edgeDefaults },
  { id: "e8-9",   source: "n8",  target: "n9",  ...edgeDefaults },
  { id: "e8-10",  source: "n8",  target: "n10", ...edgeDefaults },
  { id: "e8-11",  source: "n8",  target: "n11", ...edgeDefaults },
  { id: "e11-12", source: "n11", target: "n12", ...edgeDefaults },
  { id: "e12-13", source: "n12", target: "n13", ...edgeDefaults },
  { id: "e12-14", source: "n12", target: "n14", ...edgeDefaults },
  { id: "e13-14", source: "n13", target: "n14", ...edgeDefaults },
  { id: "e14-15", source: "n14", target: "n15", ...edgeDefaults },
];

// ─── Table data ───────────────────────────────────────────────────────────────

interface TableRow {
  concern: string;
  inDemo: string;
  inProd: string;
}

const tableRows: TableRow[] = [
  {
    concern: "Data source",
    inDemo: "Synthetic fixtures",
    inProd: "Live streaming feeds (Kafka/SQS)",
  },
  {
    concern: "Corroboration",
    inDemo: "Token/entity similarity",
    inProd: "Embeddings + vector DB (RAG)",
  },
  {
    concern: "Classification",
    inDemo: "Feature lexicon scorer",
    inProd: "Fine-tuned model on analyst-verified data (GPU)",
  },
  {
    concern: "Agent tools",
    inDemo: "Read in-repo fixture data",
    inProd: "Call internal services and databases",
  },
  {
    concern: "Delivery",
    inDemo: "Demo UI only",
    inProd: "Slack/Teams/Everbridge/Esri/API",
  },
  {
    concern: "Evaluation",
    inDemo: "On-demand",
    inProd: "Continuous eval + drift monitoring + model-version gating",
  },
  {
    concern: "Models",
    inDemo: "Single model",
    inProd: "Provider abstraction + model routing (cost vs frontier)",
  },
];

// ─── Easing ───────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

// ─── Flow Diagram ─────────────────────────────────────────────────────────────

function FlowDiagram() {
  return (
    <div
      style={{
        height: "540px",
        width: "100%",
        background: "var(--bg-base)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--bg-base)" }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="rgba(255,255,255,0.04)" gap={20} />
        <Controls
          style={{
            background: "#161D2B",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </ReactFlow>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductionSection() {
  const tableRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableInView = useInView(tableRef, { once: true, margin: "-80px 0px" });
  const cardInView = useInView(cardRef, { once: true, margin: "-80px 0px" });

  return (
    <section
      id="production"
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
        {/* ── Header ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
            In Production
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--text-muted)",
              fontStyle: "italic",
              fontFamily: "var(--font-inter)",
              lineHeight: 1.6,
              maxWidth: "680px",
            }}
          >
            A proposed reference architecture — illustrative integration grounded
            in the public role description. Not the company&apos;s actual internal
            systems.
          </p>
        </div>

        {/* ── Flow Diagram ── */}
        <FlowDiagram />

        {/* ── Lane labels ── */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Ingestion", color: "var(--accent-primary)" },
            { label: "Intelligence", color: "var(--accent-primary)" },
            { label: "Agent", color: "var(--accent-agent)" },
            { label: "Human-in-Loop", color: "#FBBF24" },
            { label: "Delivery", color: "var(--accent-primary)" },
            { label: "Platform", color: "var(--text-muted)" },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                color,
                border: `1px solid ${color}30`,
                backgroundColor: `${color}0a`,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* ── Comparison table ── */}
        <div ref={tableRef}>
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-inter)",
              letterSpacing: "-0.01em",
            }}
          >
            What changes from demo → prod
          </h3>

          <div
            style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 1.8fr",
                backgroundColor: "var(--bg-elevated)",
                padding: "10px 16px",
                gap: "12px",
              }}
            >
              {["Concern", "In this demo", "In production"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-jetbrains-mono, monospace)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 500,
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {tableRows.map((row, i) => (
              <motion.div
                key={row.concern}
                initial={{ opacity: 0, y: 12 }}
                animate={
                  tableInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 12 }
                }
                transition={{
                  duration: 0.4,
                  ease,
                  delay: 0.06 * i,
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr 1.8fr",
                  padding: "12px 16px",
                  gap: "12px",
                  borderBottom:
                    i < tableRows.length - 1
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "none",
                  alignItems: "start",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-inter)",
                    fontWeight: 500,
                  }}
                >
                  {row.concern}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {row.inDemo}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {row.inProd}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Model Strategy callout ── */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 16 }}
          animate={cardInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease }}
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid rgba(167,139,250,0.30)",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--accent-agent)",
              fontFamily: "var(--font-inter)",
              letterSpacing: "-0.01em",
            }}
          >
            Model Strategy
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "13.5px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Provider-agnostic abstraction over Anthropic and OpenAI — route
            triage work to a cheaper model, high-stakes briefs to a frontier
            model. Every model upgrade is gated behind the eval harness: each new
            version must measurably beat the last on decision accuracy and
            false-verify rate. Drift monitoring and latency dashboards watch
            production continuously.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
