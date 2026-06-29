"use client";

import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { ToolCallRecord } from "./useAgentStream";

const TOOL_LABELS: Record<string, string> = {
  search_signals: "search_signals",
  check_source_reliability: "check_reliability",
  find_contradictions: "find_contradictions",
  geolocate: "geolocate",
  get_asset_exposure: "get_asset_exposure",
  submit_decision: "submit_decision",
};

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
          background: isDecision
            ? "rgba(167,139,250,0.12)"
            : "rgba(56,189,248,0.08)",
          border: `1px solid ${isDecision ? "rgba(167,139,250,0.3)" : "rgba(56,189,248,0.2)"}`,
          color: isDecision ? "var(--accent-agent)" : "var(--accent-primary)",
        }}
      >
        {/* Tool name */}
        <span style={{ color: isDecision ? "var(--accent-agent)" : "var(--accent-primary)" }}>
          {TOOL_LABELS[tc.name] ?? tc.name}
        </span>

        {/* Key arg preview */}
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
            → {String(tc.input["decision"])}
          </span>
        )}

        {/* Status */}
        <span className="ml-auto flex-shrink-0">
          {isPending ? (
            <span
              className="inline-flex gap-0.5"
              style={{ color: "var(--text-muted)" }}
            >
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

      {/* Expanded result */}
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
      style={{ fontFamily: "var(--font-jetbrains-mono, monospace)" }}
    >
      {/* Reasoning stream */}
      {tokens && (
        <div
          className="flex-1 p-4 rounded-lg text-xs leading-relaxed overflow-y-auto"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-secondary)",
            minHeight: "80px",
            maxHeight: "220px",
            whiteSpace: "pre-wrap",
          }}
        >
          <div className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
            ANALYST REASONING
          </div>
          {tokens}
          {isRunning && (
            <span
              className="inline-block w-2 h-3 ml-0.5 rounded-sm"
              style={{
                background: "var(--accent-primary)",
                animation: reduced ? "none" : "blink 1s step-end infinite",
              }}
            />
          )}
        </div>
      )}

      {/* Shimmer between events when running */}
      {isRunning && toolCalls.length === 0 && !tokens && (
        <div
          className="h-8 rounded animate-pulse"
          style={{ background: "rgba(56,189,248,0.06)" }}
        />
      )}

      {/* Tool call chips */}
      {toolCalls.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] mb-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
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
