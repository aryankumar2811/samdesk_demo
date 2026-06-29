"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeDef {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isAgent?: boolean;
  isEval?: boolean;
}

// ─── Node layout (viewBox 0 0 900 220) ───────────────────────────────────────
// Main pipeline y-center = 72 (nodes are 48px tall → top = 48, bottom = 96)
// Agent node is 56px tall → top = 44, bottom = 100
// Eval node center y = 172 (48px tall → top = 148, bottom = 196)

const NODES: NodeDef[] = [
  {
    id: "sources",
    label: "Sources",
    description:
      "Ingests from social media, news wires, official government alerts, weather sensors, and partner intelligence feeds — raw, noisy, and multilingual.",
    x: 14,
    y: 48,
    w: 100,
    h: 48,
  },
  {
    id: "ingest",
    label: "Ingest & Dedup",
    description:
      "Normalizes incoming signals, strips duplicates using near-match token overlap, and buffers the stream for downstream processing.",
    x: 138,
    y: 48,
    w: 120,
    h: 48,
  },
  {
    id: "cluster",
    label: "Cluster",
    description:
      "Groups related signals into incident candidates using TF-IDF cosine similarity, time windows, and geo proximity — without reading ground-truth labels.",
    x: 282,
    y: 48,
    w: 100,
    h: 48,
  },
  {
    id: "classify",
    label: "Classify + Score",
    description:
      "Assigns an event type and severity score using a feature lexicon (standing in for a fine-tuned domain model in production).",
    x: 406,
    y: 48,
    w: 120,
    h: 48,
  },
  {
    id: "agent",
    label: "Investigative Agent",
    description:
      "The centerpiece: an autonomous LLM analyst that uses real Anthropic tool calls to corroborate, geolocate, find contradictions, check source reliability, and assess asset exposure before issuing a grounded, cited brief.",
    x: 546,
    y: 44,
    w: 140,
    h: 56,
    isAgent: true,
  },
  {
    id: "grounding",
    label: "Grounding Guard",
    description:
      "Validates that every claim in the agent's brief maps to a retrieved signal ID. Requests a revision if any claim is ungrounded.",
    x: 710,
    y: 48,
    w: 120,
    h: 48,
  },
  {
    id: "route",
    label: "Route + Audit",
    description:
      "Delivers verified alerts to configured channels (Slack, Teams, Everbridge, etc.) with a full provenance trail for audit.",
    x: 854,
    y: 48,
    w: 110,
    h: 48,
  },
  {
    id: "eval",
    label: "Evaluation & Observability",
    description:
      "Measures clustering precision/recall, classification F1, agent decision accuracy, false-verify rate, grounding faithfulness, and p50/p95 latency across the full labeled set.",
    x: 330,
    y: 156,
    w: 240,
    h: 48,
    isEval: true,
  },
];

// Sequential pipeline edges (node id pairs)
const PIPELINE_EDGES: [string, string][] = [
  ["sources", "ingest"],
  ["ingest", "cluster"],
  ["cluster", "classify"],
  ["classify", "agent"],
  ["agent", "grounding"],
  ["grounding", "route"],
];

// Eval dashed connections (from eval to these node ids)
const EVAL_TARGETS = ["cluster", "classify", "agent", "grounding"];

// ─── Icon paths (inline SVG path data, 16x16 viewBox) ────────────────────────

function SourcesIcon() {
  // Layers icon
  return (
    <g transform="translate(-8,-8)">
      <path
        d="M2 9l6-4 6 4-6 4-6-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 12l6 4 6-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 6l6-4 6 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </g>
  );
}

function FilterIcon() {
  return (
    <g transform="translate(-8,-8)">
      <polygon
        points="2,2 14,2 9,8 9,14 7,14 7,8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </g>
  );
}

function GitMergeIcon() {
  return (
    <g transform="translate(-8,-8)">
      <circle cx="5" cy="4" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="12" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="12" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="5.5" x2="5" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5 5.5 Q5 9 11 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function TagIcon() {
  return (
    <g transform="translate(-8,-8)">
      <path
        d="M2 2h5l7 7-5 5-7-7V2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
    </g>
  );
}

function BrainIcon() {
  // Simplified CPU/brain icon for the agent
  return (
    <g transform="translate(-8,-8)">
      <rect x="4" y="4" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="2" x2="7" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="2" x2="9" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="12" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="12" x2="9" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="7" x2="4" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="9" x2="4" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function ShieldCheckIcon() {
  return (
    <g transform="translate(-8,-8)">
      <path
        d="M8 2L3 4.5v4C3 11.5 5.5 14 8 15c2.5-1 5-3.5 5-6.5v-4L8 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polyline
        points="5.5,8 7.5,10 10.5,6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function SendIcon() {
  return (
    <g transform="translate(-8,-8)">
      <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polygon
        points="2,7 22,2 17,22 11,13 2,7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        transform="scale(0.62) translate(1,1)"
      />
    </g>
  );
}

function EyeIcon() {
  return (
    <g transform="translate(-8,-8)">
      <path
        d="M2 8S4.5 3 8 3s6 5 6 5-2.5 5-6 5S2 8 2 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </g>
  );
}

function NodeIcon({ id }: { id: string }) {
  switch (id) {
    case "sources":
      return <SourcesIcon />;
    case "ingest":
      return <FilterIcon />;
    case "cluster":
      return <GitMergeIcon />;
    case "classify":
      return <TagIcon />;
    case "agent":
      return <BrainIcon />;
    case "grounding":
      return <ShieldCheckIcon />;
    case "route":
      return <SendIcon />;
    case "eval":
      return <EyeIcon />;
    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeCenterX(node: NodeDef) {
  return node.x + node.w / 2;
}

function nodeCenterY(node: NodeDef) {
  return node.y + node.h / 2;
}

function getNode(id: string): NodeDef {
  return NODES.find((n) => n.id === id)!;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArchDiagram() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const selectedNodeDef = selectedNode ? NODES.find((n) => n.id === selectedNode) : null;

  function handleNodeClick(id: string) {
    setSelectedNode((prev) => (prev === id ? null : id));
  }

  // Accent colours
  const accentPrimary = "#38BDF8";
  const accentAgent = "#A78BFA";
  const evalColor = "#9BA6B8";

  // Build pipeline edge paths (right edge of src → left edge of dst)
  function pipelineEdgePath(srcId: string, dstId: string) {
    const src = getNode(srcId);
    const dst = getNode(dstId);
    const x1 = src.x + src.w;
    const y1 = nodeCenterY(src);
    const x2 = dst.x;
    const y2 = nodeCenterY(dst);
    // Short horizontal with slight curve
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  }

  // Eval dashed connections: from top-center of eval node to bottom-center of target
  function evalEdgePath(targetId: string) {
    const evalNode = getNode("eval");
    const target = getNode(targetId);
    const ex = nodeCenterX(evalNode);
    const ey = evalNode.y; // top of eval node
    const tx = nodeCenterX(target);
    const ty = target.y + target.h; // bottom of target node
    const my = (ey + ty) / 2;
    return `M ${ex} ${ey} C ${ex} ${my}, ${tx} ${my}, ${tx} ${ty}`;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0px",
        width: "100%",
      }}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes flowAnim {
          from { stroke-dashoffset: 24; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes agentPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(167,139,250,0.5)); }
          50%       { filter: drop-shadow(0 0 18px rgba(167,139,250,0.9)); }
        }
        @keyframes evalDash {
          from { stroke-dashoffset: 16; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* SVG diagram */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "visible",
        }}
      >
        <svg
          viewBox="0 0 990 230"
          width="100%"
          style={{
            display: "block",
            minWidth: "620px",
          }}
          aria-label="System architecture diagram"
        >
          {/* ── Defs: gradient fills ── */}
          <defs>
            <linearGradient id="nodeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E2940" />
              <stop offset="100%" stopColor="#161D2B" />
            </linearGradient>
            <linearGradient id="agentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#271D40" />
              <stop offset="100%" stopColor="#1A1430" />
            </linearGradient>
            <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#181F2E" />
              <stop offset="100%" stopColor="#131924" />
            </linearGradient>
          </defs>

          {/* ── Pipeline edges ── */}
          {PIPELINE_EDGES.map(([srcId, dstId]) => {
            const d = pipelineEdgePath(srcId, dstId);
            return (
              <g key={`edge-${srcId}-${dstId}`}>
                {/* Base track */}
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(56,189,248,0.15)"
                  strokeWidth="2"
                />
                {/* Animated flow */}
                <path
                  d={d}
                  fill="none"
                  stroke={accentPrimary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="8 16"
                  strokeDashoffset="0"
                  style={
                    prefersReduced
                      ? {}
                      : {
                          animation: "flowAnim 2s linear infinite",
                        }
                  }
                  opacity="0.75"
                />
                {/* Arrow head */}
                {(() => {
                  const dst = getNode(dstId);
                  const ax = dst.x - 1;
                  const ay = nodeCenterY(dst);
                  return (
                    <polygon
                      points={`${ax},${ay - 4} ${ax + 7},${ay} ${ax},${ay + 4}`}
                      fill={accentPrimary}
                      opacity="0.85"
                    />
                  );
                })()}
              </g>
            );
          })}

          {/* ── Eval dashed edges ── */}
          {EVAL_TARGETS.map((targetId) => {
            const d = evalEdgePath(targetId);
            return (
              <g key={`eval-edge-${targetId}`}>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(155,166,184,0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={evalColor}
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  strokeDashoffset="0"
                  style={
                    prefersReduced
                      ? {}
                      : {
                          animation: "evalDash 3s linear infinite reverse",
                        }
                  }
                  opacity="0.45"
                />
              </g>
            );
          })}

          {/* ── Nodes ── */}
          {NODES.map((node) => {
            const isSelected = selectedNode === node.id;
            const cx = nodeCenterX(node);
            const cy = nodeCenterY(node);
            const stroke = node.isAgent
              ? accentAgent
              : node.isEval
              ? evalColor
              : accentPrimary;
            const fill = node.isAgent
              ? "url(#agentGrad)"
              : node.isEval
              ? "url(#evalGrad)"
              : "url(#nodeGrad)";

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: "pointer" }}
                role="button"
                aria-label={`${node.label} node`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleNodeClick(node.id);
                }}
              >
                {/* Glow halo for agent */}
                {node.isAgent && !prefersReduced && (
                  <rect
                    x={node.x - 6}
                    y={node.y - 6}
                    width={node.w + 12}
                    height={node.h + 12}
                    rx={12}
                    fill="none"
                    stroke={accentAgent}
                    strokeWidth="1"
                    opacity="0.25"
                    style={{ animation: "agentPulse 2s ease-in-out infinite" }}
                  />
                )}

                {/* Node body */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={8}
                  fill={fill}
                  stroke={isSelected ? stroke : stroke}
                  strokeWidth={isSelected ? 2 : node.isAgent ? 2 : 1.5}
                  strokeDasharray={node.isEval ? "5 4" : undefined}
                  opacity={isSelected ? 1 : 0.92}
                  style={
                    node.isAgent && !prefersReduced
                      ? { animation: "agentPulse 2s ease-in-out infinite" }
                      : {}
                  }
                />

                {/* Selection highlight */}
                {isSelected && (
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx={8}
                    fill={stroke}
                    opacity="0.07"
                  />
                )}

                {/* Icon */}
                <g
                  transform={`translate(${node.x + 18}, ${cy})`}
                  color={stroke}
                  style={{ color: stroke }}
                >
                  <NodeIcon id={node.id} />
                </g>

                {/* Label */}
                <text
                  x={node.x + 32}
                  y={cy}
                  dominantBaseline="middle"
                  fontFamily="Inter, -apple-system, sans-serif"
                  fontSize={node.isAgent ? "10.5" : "10"}
                  fontWeight={node.isAgent ? "600" : "500"}
                  fill={
                    node.isAgent
                      ? "#C4B5FD"
                      : node.isEval
                      ? "#9BA6B8"
                      : "#E6EAF0"
                  }
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label.split(" ").length > 2 ? (
                    <>
                      <tspan x={node.x + 32} dy="-6">
                        {node.label.split(" ").slice(0, 2).join(" ")}
                      </tspan>
                      <tspan x={node.x + 32} dy="13">
                        {node.label.split(" ").slice(2).join(" ")}
                      </tspan>
                    </>
                  ) : node.label.includes(" ") && node.w < 120 ? (
                    <>
                      <tspan x={node.x + 32} dy="-6">
                        {node.label.split(" ")[0]}
                      </tspan>
                      <tspan x={node.x + 32} dy="13">
                        {node.label.split(" ").slice(1).join(" ")}
                      </tspan>
                    </>
                  ) : (
                    node.label
                  )}
                </text>

                {/* +tools badge for agent */}
                {node.isAgent && (
                  <g>
                    <rect
                      x={node.x + node.w - 38}
                      y={node.y + node.h - 16}
                      width={34}
                      height={12}
                      rx={4}
                      fill="rgba(167,139,250,0.15)"
                      stroke="rgba(167,139,250,0.4)"
                      strokeWidth="0.75"
                    />
                    <text
                      x={node.x + node.w - 21}
                      y={node.y + node.h - 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="'JetBrains Mono', monospace"
                      fontSize="7.5"
                      fill="#A78BFA"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      +tools
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* "watches" label on eval connection */}
          <text
            x={450}
            y={133}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Inter, -apple-system, sans-serif"
            fontSize="8.5"
            fill="#5B6677"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            watches
          </text>
        </svg>
      </div>

      {/* ── Popover / tooltip ── */}
      <AnimatePresence>
        {selectedNodeDef && (
          <motion.div
            key={selectedNodeDef.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              marginTop: "12px",
              padding: "14px 18px",
              borderRadius: "10px",
              backgroundColor: "var(--bg-elevated, #111722)",
              border: `1px solid ${selectedNodeDef.isAgent ? "rgba(167,139,250,0.3)" : selectedNodeDef.isEval ? "rgba(155,166,184,0.2)" : "rgba(56,189,248,0.25)"}`,
              boxShadow: selectedNodeDef.isAgent
                ? "0 0 24px rgba(167,139,250,0.1)"
                : "0 4px 24px rgba(0,0,0,0.4)",
              maxWidth: "640px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: selectedNodeDef.isAgent
                    ? "#C4B5FD"
                    : selectedNodeDef.isEval
                    ? "#9BA6B8"
                    : "#38BDF8",
                }}
              >
                {selectedNodeDef.label}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#5B6677",
                  padding: "2px",
                  lineHeight: 1,
                  fontSize: "14px",
                }}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "12.5px",
                lineHeight: "1.65",
                color: "#9BA6B8",
              }}
            >
              {selectedNodeDef.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend ── */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {[
          { color: "#34D399", label: "Verified" },
          { color: "#FBBF24", label: "Escalated to human" },
          { color: "#F43F5E", label: "Misinformation" },
        ].map(({ color, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${color}80`,
              }}
            />
            <span
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "12px",
                color: "#9BA6B8",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
