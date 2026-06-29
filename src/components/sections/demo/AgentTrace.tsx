"use client";

import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
import type { ToolCallRecord } from "./useAgentStream";

const TOOL_LABELS: Record<string, string> = {
  search_signals: "search_signals",
  check_source_reliability: "check_reliability",
  find_contradictions: "find_contradictions",
  geolocate: "geolocate",
  get_asset_exposure: "get_asset_exposure",
  submit_decision: "submit_decision",
};

// ─── Inline markdown: **bold** only ──────────────────────────────────────────

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

// ─── Block markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const out: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^#{1,3} /.test(line)) {
      const content = line.replace(/^#{1,3} /, "");
      out.push(
        <div
          key={i}
          style={{
            fontWeight: 600,
            color: "var(--text-primary)",
            fontSize: "11px",
            marginTop: i === 0 ? 0 : "10px",
            marginBottom: "3px",
            letterSpacing: "0.02em",
          }}
        >
          {renderInline(content)}
        </div>
      );
    } else if (/^\s*[-*] /.test(line)) {
      const content = line.replace(/^\s*[-*] /, "");
      out.push(
        <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}>
          <span style={{ color: "var(--accent-primary)", flexShrink: 0, lineHeight: "1.6" }}>
            ·
          </span>
          <span style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
            {renderInline(content)}
          </span>
        </div>
      );
    } else if (/^\|/.test(line)) {
      // Table row — skip separator rows
      if (/^\|[-| :]+\|$/.test(line)) continue;
      const cells = line.split("|").filter((_, ci) => ci > 0 && ci < line.split("|").length - 1);
      out.push(
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
            gap: "0",
            borderBottom: "1px solid var(--border-hairline)",
          }}
        >
          {cells.map((cell, ci) => (
            <div
              key={ci}
              style={{
                padding: "3px 8px",
                color: ci === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: ci === 0 ? 500 : 400,
                fontSize: "11px",
                borderRight: ci < cells.length - 1 ? "1px solid var(--border-hairline)" : undefined,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {renderInline(cell.trim())}
            </div>
          ))}
        </div>
      );
    } else if (/^---+$/.test(line.trim())) {
      out.push(
        <hr
          key={i}
          style={{ border: "none", borderTop: "1px solid var(--border-hairline)", margin: "8px 0" }}
        />
      );
    } else if (line.trim() === "") {
      out.push(<div key={i} style={{ height: "6px" }} />);
    } else {
      out.push(
        <div key={i} style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
          {renderInline(line)}
        </div>
      );
    }
  }

  return out;
}

// ─── ToolChip ─────────────────────────────────────────────────────────────────

function ToolChip({
  tc,
  index,
  reduced,
}: {
  tc: ToolCallRecord;
  index: number;
  reduced: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = tc.result === undefined;
  const isDecision = tc.name === "submit_decision";

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="group"
    >
      <button
        onClick={() => !isPending && setExpanded((e) => !e)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono w-full text-left"
        style={{
          background: isDecision ? "rgba(167,139,250,0.12)" : "rgba(56,189,248,0.08)",
          border: `1px solid ${isDecision ? "rgba(167,139,250,0.3)" : "rgba(56,189,248,0.2)"}`,
          color: isDecision ? "var(--accent-agent)" : "var(--accent-primary)",
        }}
      >
        <span style={{ color: isDecision ? "var(--accent-agent)" : "var(--accent-primary)" }}>
          {TOOL_LABELS[tc.name] ?? tc.name}
        </span>

        {Boolean(tc.input["query"]) && (
          <span style={{ color: "var(--text-muted)" }} className="truncate max-w-[160px]">
            &quot;{String(tc.input["query"]).slice(0, 40)}&quot;
          </span>
        )}
        {Boolean(tc.input["identifier"]) && (
          <span style={{ color: "var(--text-muted)" }} className="truncate max-w-[140px]">
            {String(tc.input["identifier"])}
          </span>
        )}
        {Boolean(tc.input["decision"]) && (
          <span
            style={{
              color:
                tc.input["decision"] === "verified"
                  ? "var(--status-verified)"
                  : tc.input["decision"] === "flag_misinformation"
                  ? "var(--status-misinfo)"
                  : "var(--status-escalate)",
            }}
          >
            {String(tc.input["decision"])}
          </span>
        )}

        <span className="ml-auto flex-shrink-0">
          {isPending ? (
            <span className="inline-flex gap-0.5" style={{ color: "var(--text-muted)" }}>
              <span className="animate-pulse">·</span>
              <span className="animate-pulse" style={{ animationDelay: "0.15s" }}>·</span>
              <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>·</span>
            </span>
          ) : (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: tc.isError ? "rgba(244,63,94,0.1)" : "rgba(52,211,153,0.1)",
                color: tc.isError ? "var(--status-misinfo)" : "var(--status-verified)",
              }}
            >
              {tc.latencyMs !== undefined ? `${tc.latencyMs}ms` : "done"}
            </span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {expanded && tc.result && (
          <motion.div
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-1 ml-4 p-3 rounded text-xs font-mono leading-relaxed whitespace-pre-wrap"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-secondary)",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {tc.result.slice(0, 800)}{tc.result.length > 800 ? "…" : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── AgentTrace ───────────────────────────────────────────────────────────────

interface AgentTraceProps {
  tokens: string;
  toolCalls: ToolCallRecord[];
  status: "idle" | "running" | "done" | "error";
}

export function AgentTrace({ tokens, toolCalls, status }: AgentTraceProps) {
  const reduced = useReducedMotion() ?? false;
  const isRunning = status === "running";

  return (
    <div
      className="flex flex-col gap-3 h-full"
      style={{ fontFamily: "var(--font-inter, sans-serif)" }}
    >
      {/* Reasoning stream */}
      {tokens && (
        <div
          className="flex-1 p-4 rounded-lg overflow-y-auto"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-hairline)",
            minHeight: "100px",
            maxHeight: "400px",
            fontSize: "12px",
            lineHeight: "1.6",
          }}
        >
          <div
            className="text-[10px] mb-3 tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
          >
            ANALYST REASONING
          </div>
          {renderMarkdown(tokens)}
          {isRunning && (
            <span
              className="inline-block w-2 h-3 ml-0.5 rounded-sm"
              style={{
                background: "var(--accent-primary)",
                animation: reduced ? "none" : "blink 1s step-end infinite",
                verticalAlign: "middle",
              }}
            />
          )}
        </div>
      )}

      {/* Shimmer while waiting for first token */}
      {isRunning && toolCalls.length === 0 && !tokens && (
        <div
          className="h-8 rounded animate-pulse"
          style={{ background: "rgba(56,189,248,0.06)" }}
        />
      )}

      {/* Tool call chips */}
      {toolCalls.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div
            className="text-[10px] mb-1 tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
          >
            TOOL CALLS ({toolCalls.length})
          </div>
          {toolCalls.map((tc, i) => (
            <ToolChip key={tc.id} tc={tc} index={i} reduced={reduced} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
