"use client";

import { useState, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronRight,
  Zap,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";

import { useAgentStream } from "./useAgentStream";
import { AgentTrace } from "./AgentTrace";
import { DEMO_SCENARIOS } from "./scenarios";
import type { DemoScenario } from "./scenarios";
import type { EvalResults } from "@/lib/pipeline/eval";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EvalStatus = "idle" | "loading" | "done" | "error";

type PipelineStage = {
  id: number;
  label: string;
  key: "ingest" | "cluster" | "classify" | "investigate" | "decide";
};

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 1, label: "Ingest", key: "ingest" },
  { id: 2, label: "Cluster", key: "cluster" },
  { id: 3, label: "Classify", key: "classify" },
  { id: 4, label: "Investigate", key: "investigate" },
  { id: 5, label: "Decide", key: "decide" },
];

// Hardcoded signal stream previews per scenario (source, timestamp, text, language)
const SIGNAL_PREVIEWS: Record<
  string,
  { source: string; ts: string; text: string; lang: string }[]
> = {
  "inc-001": [
    {
      source: "@porthalworth_fd",
      ts: "14:03:11Z",
      text: "Structure fire confirmed at Docklands Warehouse 7. Hazmat team en route. Shelter in place advisory issued for 500m radius.",
      lang: "EN",
    },
    {
      source: "AQI_SENSOR_PH_04",
      ts: "14:04:22Z",
      text: "PM2.5 spike detected: 284 µg/m³. CO elevated at 38 ppm. Sensor reading consistent with combustion event.",
      lang: "EN",
    },
    {
      source: "Reuters_Wire",
      ts: "14:07:55Z",
      text: "FLASH: Fire breaks out at chemical storage facility in Port Halworth docklands district. Emergency services on scene.",
      lang: "EN",
    },
    {
      source: "@dockwatch_intel",
      ts: "14:09:30Z",
      text: "Confirmed visible smoke column from Docklands Quay area. Multiple independent eyewitness accounts. Fire visible from 3km.",
      lang: "EN",
    },
  ],
  "inc-002": [
    {
      source: "@xX_truther_Xx",
      ts: "20:14:08Z",
      text: "ACTIVE SHOOTER at Verdana Stadium RIGHT NOW people running panic !!! share this !!!",
      lang: "EN",
    },
    {
      source: "NadirCity_PD",
      ts: "20:16:44Z",
      text: "Officers on scene at Verdana Stadium. No active threat found. Crowd evacuation in progress as precaution. All clear expected shortly.",
      lang: "EN",
    },
    {
      source: "VerdanaOps",
      ts: "20:17:02Z",
      text: "Venue security reports no incident. CCTV review underway. Source of panic rumor under investigation. Event continues.",
      lang: "EN",
    },
    {
      source: "ReversImgSearch",
      ts: "20:18:30Z",
      text: "Image circulating in thread matches photo from 2019 Farwick Arena incident. Confirmed recycled media. Not current.",
      lang: "EN",
    },
  ],
  "inc-003": [
    {
      source: "NWS_Pacific",
      ts: "06:40:00Z",
      text: "Flash Flood WATCH issued for Calavera Bay Waterfront Zone through 1800 local. Potential for rapid water rise. Monitor official channels.",
      lang: "EN",
    },
    {
      source: "FLOOD_SENSOR_CB_02",
      ts: "07:01:14Z",
      text: "Sensor CB-02 OFFLINE. Last reading: normal. CB-01 and CB-03 nominal. Data gap cannot be resolved without field check.",
      lang: "EN",
    },
    {
      source: "@calavera_fisherman",
      ts: "07:15:44Z",
      text: "Promenade looks fine here, no flooding yet. NWS says watch not warning. Staying alert but calm at marina.",
      lang: "EN",
    },
    {
      source: "@coastwatcher_k",
      ts: "07:22:10Z",
      text: "Water overtopping the seawall near Pier 4. Might be localized. Port authority isn't responding to calls.",
      lang: "EN",
    },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function outcomeColor(
  outcome: DemoScenario["expectedOutcome"]
): string {
  switch (outcome) {
    case "verified":
      return "var(--status-verified)";
    case "flag_misinformation":
      return "var(--status-misinfo)";
    case "escalate_to_human":
      return "var(--status-escalate)";
  }
}

function outcomeLabel(outcome: DemoScenario["expectedOutcome"]): string {
  switch (outcome) {
    case "verified":
      return "VERIFIED";
    case "flag_misinformation":
      return "MISINFORMATION";
    case "escalate_to_human":
      return "ESCALATE";
  }
}

function decisionColor(
  decision: "verified" | "flag_misinformation" | "escalate_to_human"
): string {
  switch (decision) {
    case "verified":
      return "var(--status-verified)";
    case "flag_misinformation":
      return "var(--status-misinfo)";
    case "escalate_to_human":
      return "var(--status-escalate)";
  }
}

function decisionLabel(
  decision: "verified" | "flag_misinformation" | "escalate_to_human"
): string {
  switch (decision) {
    case "verified":
      return "VERIFIED";
    case "flag_misinformation":
      return "MISINFORMATION";
    case "escalate_to_human":
      return "ESCALATED";
  }
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

// Animated connector line between pipeline stage pills
function StageConnector({
  active,
  reduced,
}: {
  active: boolean;
  reduced: boolean;
}) {
  return (
    <div
      className="relative flex-1 h-px mx-1 overflow-hidden"
      style={{
        background: active
          ? "rgba(56,189,248,0.3)"
          : "var(--border-hairline)",
        minWidth: 12,
        maxWidth: 32,
      }}
    >
      {active && !reduced && (
        <motion.div
          className="absolute inset-y-0 left-0 w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent-primary), transparent)",
            width: "60%",
          }}
          animate={{ x: ["−60%", "160%"] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </div>
  );
}

// A single stage pill
function StagePill({
  stage,
  stageStatus,
  decisionColor: dColor,
  reduced,
}: {
  stage: PipelineStage;
  stageStatus: "pending" | "active" | "done" | "decided";
  decisionColor?: string;
  reduced: boolean;
}) {
  const isActive = stageStatus === "active";
  const isDone = stageStatus === "done";
  const isDecided = stageStatus === "decided";

  let color = "var(--text-muted)";
  let bg = "rgba(255,255,255,0.03)";
  let borderColor = "var(--border-hairline)";
  let shadow = "none";

  if (isActive) {
    color = "var(--accent-primary)";
    bg = "rgba(56,189,248,0.08)";
    borderColor = "rgba(56,189,248,0.4)";
    shadow = "0 0 0 1px rgba(56,189,248,0.3), 0 0 16px -4px rgba(56,189,248,0.5)";
  } else if (isDone) {
    color = "var(--status-verified)";
    bg = "rgba(52,211,153,0.06)";
    borderColor = "rgba(52,211,153,0.25)";
  } else if (isDecided) {
    color = dColor ?? "var(--accent-primary)";
    bg = `${dColor ?? "var(--accent-primary)"}18`;
    borderColor = `${dColor ?? "var(--accent-primary)"}44`;
    shadow = `0 0 12px -4px ${dColor ?? "var(--accent-primary)"}`;
  }

  return (
    <motion.div
      className="relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap"
      style={{
        color,
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        fontFamily: "var(--font-jetbrains-mono, monospace)",
      }}
      animate={isActive && !reduced ? { boxShadow: [shadow, "0 0 0 1px rgba(56,189,248,0.5), 0 0 24px -4px rgba(56,189,248,0.7)", shadow] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {isDone && (
        <CheckCircle size={11} />
      )}
      {isActive && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--accent-primary)" }}
          animate={reduced ? {} : { opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      {isDecided && (
        <Zap size={11} />
      )}
      {stage.id} · {stage.label}
    </motion.div>
  );
}

// Scenario card
function ScenarioCard({
  scenario,
  index,
  selected,
  disabled,
  onSelect,
  reduced,
}: {
  scenario: DemoScenario;
  index: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const color = outcomeColor(scenario.expectedOutcome);
  const label = outcomeLabel(scenario.expectedOutcome);

  return (
    <motion.button
      onClick={disabled ? undefined : onSelect}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.25 }}
      className="w-full text-left rounded-lg p-3 transition-all duration-200"
      style={{
        background: selected
          ? "rgba(56,189,248,0.06)"
          : "var(--bg-card)",
        border: `1px solid ${selected ? "rgba(56,189,248,0.4)" : "var(--border-hairline)"}`,
        boxShadow: selected
          ? "0 0 0 1px rgba(56,189,248,0.15), 0 0 20px -8px rgba(56,189,248,0.3)"
          : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? 0.5 : 1,
        pointerEvents: disabled && !selected ? "none" : "auto",
      }}
    >
      {/* Top row: event type + expected outcome */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="px-2 py-0.5 rounded text-[10px] font-mono"
          style={{
            background: "rgba(56,189,248,0.1)",
            color: "var(--accent-primary)",
            border: "1px solid rgba(56,189,248,0.2)",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}
        >
          {scenario.eventType}
        </span>
        <span className="ml-auto" />
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-mono"
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}44`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <p
        className="text-sm font-medium leading-tight mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        {scenario.title}
      </p>

      {/* Location */}
      <div
        className="flex items-center gap-1 text-xs"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
      >
        <MapPin size={10} />
        {scenario.location}
      </div>

      {/* Expected outcome row */}
      {selected && (
        <div
          className="mt-2 pt-2 flex items-center gap-1.5 text-[10px] font-mono"
          style={{
            borderTop: "1px solid var(--border-hairline)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}
        >
          Expected:
          <span style={{ color }}>
            {label}
          </span>
        </div>
      )}
    </motion.button>
  );
}

// Signal stream preview card
function SignalPreview({
  sig,
  index,
  reduced,
}: {
  sig: { source: string; ts: string; text: string; lang: string };
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
      className="p-2.5 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border-hairline)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--accent-primary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
        >
          {sig.source}
        </span>
        <span
          className="text-[10px] font-mono ml-auto"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
        >
          {sig.ts}
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-mono"
          style={{
            background: "rgba(91,102,119,0.2)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}
        >
          {sig.lang}
        </span>
      </div>
      <p
        className="text-xs leading-relaxed line-clamp-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {sig.text}
      </p>
    </motion.div>
  );
}

// Animated progress bar for eval metrics
function MetricBar({
  label,
  value,
  reduced,
}: {
  label: string;
  value: number;
  reduced: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
        >
          {label}
        </span>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
        >
          {pct(value)}
        </span>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              value >= 0.8
                ? "var(--status-verified)"
                : value >= 0.6
                ? "var(--status-escalate)"
                : "var(--status-misinfo)",
          }}
          initial={{ width: 0 }}
          animate={{ width: reduced ? `${value * 100}%` : `${value * 100}%` }}
          transition={{ duration: reduced ? 0 : 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Stat row for eval scorecard
function StatRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-1"
      style={{ borderBottom: "1px solid var(--border-hairline)" }}
    >
      <span
        className="text-[10px] font-mono"
        style={{
          color: danger ? "var(--status-misinfo)" : "var(--text-secondary)",
          fontFamily: "var(--font-jetbrains-mono, monospace)",
        }}
      >
        {label}
      </span>
      <span
        className="text-[10px] font-mono"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DemoConsole() {
  const reduced = useReducedMotion() ?? false;
  const { state, run, reset } = useAgentStream();

  const [selectedScenario, setSelectedScenario] = useState(0);
  const [evalStatus, setEvalStatus] = useState<EvalStatus>("idle");
  const [evalData, setEvalData] = useState<EvalResults | null>(null);

  const scenario = DEMO_SCENARIOS[selectedScenario];
  const isRunning = state.status === "running";
  const isDone = state.status === "done";
  const isError = state.status === "error";
  const isIdle = state.status === "idle";

  // Derive pipeline stage statuses
  // idle: all pending
  // running: 1-3 done, 4 active, 5 pending
  // done: 1-4 done, 5 decided
  type StageStatus = "pending" | "active" | "done" | "decided";
  function getStageStatus(stageId: number): StageStatus {
    if (isIdle || isError) return "pending";
    if (isRunning) {
      if (stageId <= 3) return "done";
      if (stageId === 4) return "active";
      return "pending";
    }
    // done
    if (stageId <= 4) return "done";
    return "decided";
  }

  const handleRun = useCallback(() => {
    run(scenario.incidentId);
  }, [run, scenario.incidentId]);

  const handleReset = useCallback(() => {
    reset();
    setEvalData(null);
    setEvalStatus("idle");
  }, [reset]);

  const handleRunEval = useCallback(async () => {
    setEvalStatus("loading");
    try {
      const res = await fetch("/api/eval", { method: "POST" });
      if (!res.ok) throw new Error("Eval request failed");
      const data: EvalResults = await res.json();
      setEvalData(data);
      setEvalStatus("done");
    } catch {
      setEvalStatus("error");
    }
  }, []);

  const dColor = state.decision
    ? decisionColor(state.decision.decision)
    : "var(--accent-primary)";

  const signalPreviews = SIGNAL_PREVIEWS[scenario.incidentId] ?? [];

  return (
    <div
      className="flex flex-col gap-4 w-full"
      style={{ fontFamily: "var(--font-inter, sans-serif)" }}
    >
      {/* ─── TOP RAIL ─────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stage pills + connectors */}
          {PIPELINE_STAGES.map((stage, i) => {
            const stageStatus = getStageStatus(stage.id);
            const prevStageStatus = i > 0 ? getStageStatus(PIPELINE_STAGES[i - 1].id) : null;
            const connectorActive =
              prevStageStatus === "done" ||
              prevStageStatus === "active" ||
              prevStageStatus === "decided";

            return (
              <div key={stage.id} className="flex items-center">
                {i > 0 && (
                  <StageConnector
                    active={connectorActive}
                    reduced={reduced}
                  />
                )}
                <StagePill
                  stage={stage}
                  stageStatus={stageStatus}
                  decisionColor={dColor}
                  reduced={reduced}
                />
              </div>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Run / Reset / Running controls */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                  style={{
                    background: "rgba(56,189,248,0.08)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    color: "var(--accent-primary)",
                    fontFamily: "var(--font-jetbrains-mono, monospace)",
                  }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  Running…
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                  style={{
                    background: "rgba(244,63,94,0.06)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    color: "var(--status-misinfo)",
                    fontFamily: "var(--font-jetbrains-mono, monospace)",
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={12} />
                  Cancel
                </button>
              </>
            ) : isDone || isError ? (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-jetbrains-mono, monospace)",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={12} />
                Reset
              </button>
            ) : (
              <button
                onClick={handleRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200"
                style={{
                  background: "rgba(56,189,248,0.12)",
                  border: "1px solid rgba(56,189,248,0.35)",
                  color: "var(--accent-primary)",
                  fontFamily: "var(--font-jetbrains-mono, monospace)",
                  cursor: "pointer",
                  boxShadow: "0 0 12px -4px rgba(56,189,248,0.3)",
                }}
              >
                <Play size={12} />
                Run pipeline
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BODY: 3-column grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-4">

        {/* ═══ LEFT: Scenario selector + signal stream ══════════════════════ */}
        <div className="flex flex-col gap-3">
          {/* Section header */}
          <div
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-jetbrains-mono, monospace)",
            }}
          >
            Choose Scenario
          </div>

          {/* Scenario cards */}
          <div className="flex flex-col gap-2">
            {DEMO_SCENARIOS.map((sc, i) => (
              <ScenarioCard
                key={sc.incidentId}
                scenario={sc}
                index={i}
                selected={selectedScenario === i}
                disabled={isRunning}
                onSelect={() => setSelectedScenario(i)}
                reduced={reduced}
              />
            ))}
          </div>

          {/* Signal stream preview */}
          <div
            className="rounded-xl p-3 flex flex-col gap-2"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}
            >
              Signal stream · preview
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.incidentId}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2"
              >
                {signalPreviews.slice(0, 4).map((sig, i) => (
                  <SignalPreview
                    key={`${scenario.incidentId}-${i}`}
                    sig={sig}
                    index={i}
                    reduced={reduced}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ═══ CENTER: Incident card + agent trace ══════════════════════════ */}
        <div className="flex flex-col gap-3 min-w-0">

          <AnimatePresence mode="wait">
            {isIdle && !isError ? (
              /* Idle placeholder */
              <motion.div
                key="idle"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center rounded-xl py-20 px-8 text-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px dashed var(--border-hairline)",
                  minHeight: 320,
                }}
              >
                <div
                  className="mb-3 p-3 rounded-full"
                  style={{ background: "rgba(56,189,248,0.06)" }}
                >
                  <Zap size={20} style={{ color: "var(--accent-primary)", opacity: 0.5 }} />
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Select a scenario and run the pipeline
                </p>
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  The agent will investigate in real-time
                  <ChevronRight size={12} />
                </p>
              </motion.div>
            ) : (
              /* Running or done */
              <motion.div
                key="active"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3"
              >
                {/* Incident card */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${isRunning ? "rgba(56,189,248,0.25)" : "var(--border-hairline)"}`,
                    boxShadow: isRunning
                      ? "0 0 0 1px rgba(56,189,248,0.1), 0 0 24px -8px rgba(56,189,248,0.2)"
                      : "none",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Event type badge */}
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono"
                          style={{
                            background: "rgba(56,189,248,0.1)",
                            color: "var(--accent-primary)",
                            border: "1px solid rgba(56,189,248,0.2)",
                            fontFamily: "var(--font-jetbrains-mono, monospace)",
                          }}
                        >
                          {scenario.eventType}
                        </span>
                        {/* LIVE badge while running */}
                        {isRunning && (
                          <motion.span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1"
                            style={{
                              background: "rgba(244,63,94,0.12)",
                              border: "1px solid rgba(244,63,94,0.3)",
                              color: "var(--status-misinfo)",
                              fontFamily: "var(--font-jetbrains-mono, monospace)",
                            }}
                            animate={reduced ? {} : { opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "var(--status-misinfo)" }}
                            />
                            LIVE
                          </motion.span>
                        )}
                        {/* Incident ID */}
                        <span
                          className="text-[10px] font-mono"
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-jetbrains-mono, monospace)",
                          }}
                        >
                          {scenario.incidentId}
                        </span>
                      </div>
                      <h3
                        className="text-base font-semibold leading-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {scenario.title}
                      </h3>
                      <div
                        className="flex items-center gap-1 mt-1 text-xs"
                        style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                      >
                        <MapPin size={10} />
                        {scenario.location}
                      </div>
                    </div>

                    {/* Signal / source stats */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0 text-right">
                      <div
                        className="flex items-center gap-1.5 text-xs font-mono justify-end"
                        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                      >
                        <Zap size={11} style={{ color: "var(--accent-primary)" }} />
                        {scenario.signalCount} signals
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-xs font-mono justify-end"
                        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                      >
                        <Users size={11} style={{ color: "var(--accent-agent)" }} />
                        {scenario.sourceCount} sources
                      </div>
                    </div>
                  </div>

                  {/* Agent trace */}
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-hairline)",
                      minHeight: 120,
                    }}
                  >
                    <AgentTrace
                      tokens={state.tokens}
                      toolCalls={state.toolCalls}
                      status={state.status}
                    />
                  </div>
                </div>

                {/* Decision stamp — only when done and decision exists */}
                <AnimatePresence>
                  {isDone && state.decision && (
                    <motion.div
                      key="decision"
                      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        duration: 0.3,
                        type: "spring",
                        stiffness: 260,
                        damping: 24,
                      }}
                      className="rounded-xl p-5"
                      style={{
                        background: `${dColor}0A`,
                        border: `1px solid ${dColor}44`,
                        boxShadow: `0 0 0 1px ${dColor}22, 0 4px 32px -8px ${dColor}40`,
                      }}
                    >
                      {/* Decision label */}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-2xl font-mono font-bold tracking-widest"
                          style={{ color: dColor, fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                        >
                          {decisionLabel(state.decision.decision)}
                        </span>
                        {state.decision.decision === "verified" && (
                          <CheckCircle size={20} style={{ color: dColor }} />
                        )}
                        {state.decision.decision === "flag_misinformation" && (
                          <XCircle size={20} style={{ color: dColor }} />
                        )}
                        {state.decision.decision === "escalate_to_human" && (
                          <AlertTriangle size={20} style={{ color: dColor }} />
                        )}
                      </div>

                      {/* Brief */}
                      <p
                        className="text-sm leading-relaxed mb-3"
                        style={{
                          color: "var(--text-secondary)",
                          borderLeft: "2px solid var(--border-strong)",
                          paddingLeft: "12px",
                        }}
                      >
                        {state.decision.brief}
                      </p>

                      {/* Citations */}
                      {state.decision.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {state.decision.citations.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded text-[10px] font-mono"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid var(--border-hairline)",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-jetbrains-mono, monospace)",
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Metadata row */}
                      <div
                        className="flex flex-wrap items-center gap-3 text-[10px] font-mono pt-3"
                        style={{
                          borderTop: "1px solid var(--border-hairline)",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-jetbrains-mono, monospace)",
                        }}
                      >
                        <span className="flex items-center gap-1">
                          <CheckCircle size={10} style={{ color: "var(--status-verified)" }} />
                          Grounding: {Math.round(state.decision.groundingFaithfulness * 100)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {state.decision.totalLatencyMs}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap size={10} />
                          {state.toolCalls.length} tool calls
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Escalation queue card */}
                <AnimatePresence>
                  {isDone &&
                    state.decision?.decision === "escalate_to_human" && (
                      <motion.div
                        key="escalate-queue"
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.35, duration: 0.3 }}
                        className="rounded-xl p-4 flex items-center gap-3"
                        style={{
                          background: "rgba(251,191,36,0.06)",
                          border: "1px solid rgba(251,191,36,0.3)",
                        }}
                      >
                        <Users
                          size={18}
                          style={{ color: "var(--status-escalate)", flexShrink: 0 }}
                        />
                        <div>
                          <div
                            className="text-xs font-mono font-medium"
                            style={{ color: "var(--status-escalate)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                          >
                            → Human Review Queue
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {scenario.title}
                          </div>
                        </div>
                        <div className="ml-auto flex-shrink-0">
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(251,191,36,0.12)",
                              border: "1px solid rgba(251,191,36,0.25)",
                              color: "var(--status-escalate)",
                              fontFamily: "var(--font-jetbrains-mono, monospace)",
                            }}
                          >
                            PENDING
                          </span>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error card */}
          <AnimatePresence>
            {isError && state.error && (
              <motion.div
                key="error"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: "rgba(244,63,94,0.06)",
                  border: "1px solid rgba(244,63,94,0.25)",
                }}
              >
                <XCircle
                  size={16}
                  style={{ color: "var(--status-misinfo)", flexShrink: 0, marginTop: 2 }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--status-misinfo)" }}
                  >
                    Agent error
                  </div>
                  <p
                    className="text-xs font-mono"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                  >
                    {state.error}
                  </p>
                </div>
                <button
                  onClick={handleRun}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                  style={{
                    background: "rgba(244,63,94,0.1)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    color: "var(--status-misinfo)",
                    cursor: "pointer",
                    fontFamily: "var(--font-jetbrains-mono, monospace)",
                  }}
                >
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ RIGHT: Evaluation rail (hidden on small screens) ═════════════ */}
        <div className="hidden lg:flex flex-col gap-3">
          {/* Header */}
          <div
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-jetbrains-mono, monospace)",
            }}
          >
            Evaluation
          </div>

          {/* Run Eval button */}
          {evalStatus === "idle" || evalStatus === "error" ? (
            <button
              onClick={handleRunEval}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200"
              style={{
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.25)",
                color: "var(--accent-agent)",
                cursor: "pointer",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}
            >
              <Zap size={12} />
              {evalStatus === "error" ? "Retry evaluation" : "Run evaluation"}
            </button>
          ) : evalStatus === "loading" ? (
            <div
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-mono"
              style={{
                background: "rgba(167,139,250,0.05)",
                border: "1px solid rgba(167,139,250,0.15)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              Running eval…
            </div>
          ) : null}

          {/* Error state */}
          {evalStatus === "error" && (
            <p
              className="text-[10px] font-mono"
              style={{ color: "var(--status-misinfo)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
            >
              Evaluation failed. Check server logs.
            </p>
          )}

          {/* Results */}
          <AnimatePresence>
            {evalStatus === "done" && evalData && (
              <motion.div
                key="eval-results"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                {/* Clustering section */}
                <div
                  className="rounded-lg p-3 flex flex-col gap-2.5"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-widest mb-1"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-jetbrains-mono, monospace)",
                    }}
                  >
                    Clustering
                  </div>
                  <MetricBar
                    label="Precision"
                    value={evalData.clustering.precision}
                    reduced={reduced}
                  />
                  <MetricBar
                    label="Recall"
                    value={evalData.clustering.recall}
                    reduced={reduced}
                  />
                  <MetricBar
                    label="F1"
                    value={evalData.clustering.f1}
                    reduced={reduced}
                  />
                </div>

                {/* Classification section */}
                <div
                  className="rounded-lg p-3 flex flex-col gap-2"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-widest mb-1"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-jetbrains-mono, monospace)",
                    }}
                  >
                    Classification
                  </div>
                  <StatRow
                    label="Macro F1"
                    value={pct(evalData.classification.macroF1)}
                  />
                  <StatRow
                    label="Accuracy"
                    value={pct(evalData.classification.overallAccuracy)}
                  />
                </div>

                {/* Agent scorecard */}
                {evalData.agent && (
                  <div
                    className="rounded-lg p-3 flex flex-col gap-0"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <div
                      className="text-[10px] font-mono uppercase tracking-widest mb-2"
                      style={{
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-jetbrains-mono, monospace)",
                      }}
                    >
                      Agent scorecard
                    </div>
                    <StatRow
                      label="Decision accuracy"
                      value={pct(evalData.agent.decisionAccuracy)}
                    />
                    <StatRow
                      label="False-verify rate"
                      value={pct(evalData.agent.falseVerifyRate)}
                      danger
                    />
                    <StatRow
                      label="Misinfo recall"
                      value={pct(evalData.agent.misinfoRecall)}
                    />
                    <StatRow
                      label="Mean tool calls"
                      value={evalData.agent.meanToolCalls.toFixed(1)}
                    />
                    <StatRow
                      label="Grounding faithfulness"
                      value={pct(evalData.agent.groundingFaithfulness)}
                    />
                    <StatRow
                      label="p50 latency"
                      value={`${evalData.agent.p50LatencyMs}ms`}
                    />
                    <StatRow
                      label="p95 latency"
                      value={`${evalData.agent.p95LatencyMs}ms`}
                    />
                  </div>
                )}

                {/* Footer note */}
                <p
                  className="text-[10px] italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  Pipeline metrics over full labeled set; agent metrics over sampled subset.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
