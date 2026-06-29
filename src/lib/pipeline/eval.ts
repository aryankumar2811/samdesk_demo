/**
 * Evaluation harness: clustering P/R + classification P/R/F1 per class
 * + agent decision metrics over a sampled subset.
 */

import { SIGNALS, INCIDENTS } from "@/data";
import { clusterSignals, evaluateClustering } from "./clustering";
import { classifyAllClusters, evaluateClassification } from "./classify";
import type { EventType } from "@/data/incidents";
import type { PerClassMetrics } from "./classify";

export interface AgentRunRecord {
  incidentId: string;
  decision: "verified" | "flag_misinformation" | "escalate_to_human";
  groundTruthDecision: "verified" | "flag_misinformation" | "escalate_to_human";
  toolCallCount: number;
  groundingFaithfulness: number; // 0–1
  latencyMs: number;
}

export interface EvalResults {
  clustering: {
    precision: number;
    recall: number;
    f1: number;
    numPredicted: number;
    numGroundTruth: number;
  };
  classification: {
    overallAccuracy: number;
    perClass: PerClassMetrics[];
    macroF1: number;
  };
  agent: AgentMetrics | null;
  metadata: {
    totalSignals: number;
    totalIncidents: number;
    evaluatedAt: string;
    agentSampleN: number;
  };
}

export interface AgentMetrics {
  decisionAccuracy: number;
  falseVerifyRate: number;
  misinfoRecall: number;
  meanToolCalls: number;
  groundingFaithfulness: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  sampleSize: number;
}

function computeAgentMetrics(runs: AgentRunRecord[]): AgentMetrics {
  if (runs.length === 0) {
    return {
      decisionAccuracy: 0,
      falseVerifyRate: 0,
      misinfoRecall: 0,
      meanToolCalls: 0,
      groundingFaithfulness: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      sampleSize: 0,
    };
  }

  const correct = runs.filter((r) => r.decision === r.groundTruthDecision).length;
  const decisionAccuracy = correct / runs.length;

  // False verify rate: ground truth is misinfo but agent said verified
  const misinfoRuns = runs.filter((r) => r.groundTruthDecision === "flag_misinformation");
  const falseVerifies = misinfoRuns.filter((r) => r.decision === "verified").length;
  const falseVerifyRate = misinfoRuns.length === 0 ? 0 : falseVerifies / misinfoRuns.length;

  const misinfoCorrect = misinfoRuns.filter((r) => r.decision === "flag_misinformation").length;
  const misinfoRecall = misinfoRuns.length === 0 ? 0 : misinfoCorrect / misinfoRuns.length;

  const meanToolCalls =
    runs.reduce((sum, r) => sum + r.toolCallCount, 0) / runs.length;

  const groundingFaithfulness =
    runs.reduce((sum, r) => sum + r.groundingFaithfulness, 0) / runs.length;

  const latencies = runs.map((r) => r.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? latencies[latencies.length - 1] ?? 0;

  return {
    decisionAccuracy: Math.round(decisionAccuracy * 1000) / 1000,
    falseVerifyRate: Math.round(falseVerifyRate * 1000) / 1000,
    misinfoRecall: Math.round(misinfoRecall * 1000) / 1000,
    meanToolCalls: Math.round(meanToolCalls * 10) / 10,
    groundingFaithfulness: Math.round(groundingFaithfulness * 1000) / 1000,
    p50LatencyMs: Math.round(p50),
    p95LatencyMs: Math.round(p95),
    sampleSize: runs.length,
  };
}

/** Expected decision per demo scenario incident. */
const GROUND_TRUTH_DECISIONS: Record<
  string,
  "verified" | "flag_misinformation" | "escalate_to_human"
> = {
  "inc-001": "verified",
  "inc-002": "flag_misinformation",
  "inc-003": "escalate_to_human",
  "inc-004": "verified",
  "inc-005": "verified",
  "inc-006": "verified",
  "inc-007": "verified",
};

export function getGroundTruthDecision(
  incidentId: string
): "verified" | "flag_misinformation" | "escalate_to_human" {
  return GROUND_TRUTH_DECISIONS[incidentId] ?? "escalate_to_human";
}

export async function runFullEval(agentRuns: AgentRunRecord[] = []): Promise<EvalResults> {
  // 1. Clustering eval
  const predicted = clusterSignals(SIGNALS);
  const clusteringMetrics = evaluateClustering(predicted);

  // 2. Classification eval — build ground truth map from best matching cluster → incident type
  const gtTypeMap = new Map<string, EventType>();
  for (const cluster of predicted) {
    // Find the incident id that most signals in this cluster belong to
    const incidentCounts = new Map<string, number>();
    for (const sig of cluster.signals) {
      incidentCounts.set(sig.incidentId, (incidentCounts.get(sig.incidentId) ?? 0) + 1);
    }
    let bestInc = "";
    let bestCount = 0;
    incidentCounts.forEach((c, id) => {
      if (c > bestCount) {
        bestCount = c;
        bestInc = id;
      }
    });
    const inc = INCIDENTS.find((i) => i.id === bestInc);
    if (inc) gtTypeMap.set(cluster.id, inc.type);
  }

  const classResults = classifyAllClusters(predicted);
  const classMetrics = evaluateClassification(classResults, gtTypeMap);

  // 3. Agent metrics from passed-in runs
  const agentMetrics = agentRuns.length > 0 ? computeAgentMetrics(agentRuns) : null;

  return {
    clustering: clusteringMetrics,
    classification: classMetrics,
    agent: agentMetrics,
    metadata: {
      totalSignals: SIGNALS.length,
      totalIncidents: INCIDENTS.length,
      evaluatedAt: new Date().toISOString(),
      agentSampleN: agentRuns.length,
    },
  };
}
