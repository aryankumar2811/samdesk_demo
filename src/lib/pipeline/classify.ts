/**
 * Feature-based event-type + severity classifier.
 * Structured like an ML pipeline component — in production this would be
 * replaced by a fine-tuned model on analyst-verified alert data.
 */

import type { PredictedCluster } from "./clustering";
import type { EventType, Severity } from "@/data/incidents";

export interface Classification {
  type: EventType;
  severity: Severity;
  confidence: number; // 0–1
  typeScores: Record<EventType, number>;
  severityScore: number;
}

// ─── Keyword lexicons per event type ───

const TYPE_LEXICONS: Record<EventType, string[]> = {
  fire: [
    "fire", "blaze", "smoke", "flames", "burn", "burning", "hazmat", "chemical",
    "explosion", "evacuate", "wildfire", "arson", "incendie", "fuego", "incendio",
    "feu", "حريق", "AQI", "particulate", "shelter in place",
  ],
  active_threat: [
    "shooter", "shooting", "gunshot", "weapon", "attack", "armed", "threat",
    "lockdown", "shots fired", "hostage", "bomb", "explosion", "tiroteo",
    "tireur", "fusillade", "إطلاق", "active shooter",
  ],
  flood: [
    "flood", "flooding", "water level", "overflow", "submerged", "inundation",
    "surge", "waterfront", "gauge", "sea wall", "inondation", "inundación",
    "فيضان", "rain", "rainfall", "flash flood", "overtopping",
  ],
  protest: [
    "protest", "rally", "demonstration", "march", "crowd", "gathering",
    "demonstrators", "chants", "signs", "civic", "manifestation", "manifestación",
    "احتجاج", "march", "assembly",
  ],
  infrastructure_outage: [
    "outage", "power outage", "blackout", "substation", "grid", "transformer",
    "utility", "electricity", "offline", "down", "failure", "panne",
    "corte", "انقطاع", "traffic light",
  ],
  transport_disruption: [
    "derailment", "train", "rail", "freight", "collision", "crash", "accident",
    "road closure", "highway", "bridge", "disruption", "déraillement",
    "descarrilamiento", "حادث", "delay", "closure",
  ],
  severe_weather: [
    "fog", "storm", "hurricane", "tornado", "advisory", "watch", "warning",
    "wind", "snow", "ice", "hail", "lightning", "brouillard", "tormenta",
    "ضباب", "visibility", "meteorological",
  ],
};

// ─── Severity heuristics ───

const SEVERITY_INDICATORS: Record<Severity, string[]> = {
  critical: [
    "critical", "major", "catastrophic", "evacuation", "evacuate", "mass casualty",
    "chemical release", "hazmat", "confirmed dead", "fatalities", "second alarm",
    "expanding", "escalating", "class 3", "derailment",
  ],
  high: [
    "high", "serious", "significant", "injured", "hospitalized", "shelter in place",
    "spreading", "multiple units", "active shooter", "armed", "expanding",
    "confirmed", "3,000", "5,000",
  ],
  moderate: [
    "moderate", "watch", "advisory", "disruption", "closures", "protest",
    "road closed", "delay", "monitoring", "partial",
  ],
  low: [
    "low", "minor", "advisory", "fog", "precautionary", "stable", "normal",
    "routine", "improving",
  ],
};

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/);
}

function scoreText(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += kw.split(" ").length; // multi-word phrases count more
  }
  return score;
}

function normalizeScores(raw: Record<string, number>): Record<string, number> {
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total === 0) return raw;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = v / total;
  return out;
}

// ─── Classifier ───

export function classifyCluster(cluster: PredictedCluster): Classification {
  const corpus = cluster.signals.map((s) => s.text).join(" ");

  // Score each event type
  const rawTypeScores: Record<string, number> = {};
  for (const [type, keywords] of Object.entries(TYPE_LEXICONS)) {
    rawTypeScores[type] = scoreText(corpus, keywords);
  }

  const typeScores = normalizeScores(rawTypeScores) as Record<EventType, number>;
  const sortedTypes = Object.entries(typeScores).sort(([, a], [, b]) => b - a);
  const topType = sortedTypes[0][0] as EventType;
  const confidence = Math.min(0.97, sortedTypes[0][1] + (cluster.uniqueSources - 1) * 0.04);

  // Score severity
  const rawSeverityScores: Record<string, number> = {};
  for (const [sev, keywords] of Object.entries(SEVERITY_INDICATORS)) {
    rawSeverityScores[sev] = scoreText(corpus, keywords);
  }

  // Weight: more unique sources → push toward higher severity
  rawSeverityScores["high"] = (rawSeverityScores["high"] ?? 0) + cluster.uniqueSources * 0.5;
  rawSeverityScores["critical"] =
    (rawSeverityScores["critical"] ?? 0) + cluster.signals.length * 0.3;

  const sevEntries = Object.entries(rawSeverityScores).sort(([, a], [, b]) => b - a);
  const topSev = sevEntries[0][0] as Severity;
  const severityScore = Math.min(1, (sevEntries[0][1] ?? 0) / (Math.max(...Object.values(rawSeverityScores)) || 1));

  return {
    type: topType,
    severity: topSev,
    confidence: Math.round(confidence * 100) / 100,
    typeScores,
    severityScore: Math.round(severityScore * 100) / 100,
  };
}

// ─── Batch classification + eval ───

export interface ClassificationResult {
  clusterId: string;
  clusterTitle: string;
  classification: Classification;
}

export function classifyAllClusters(
  clusters: PredictedCluster[]
): ClassificationResult[] {
  return clusters.map((c) => ({
    clusterId: c.id,
    clusterTitle: c.title,
    classification: classifyCluster(c),
  }));
}

// ─── Per-class eval metrics ───

export interface PerClassMetrics {
  type: EventType;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ClassificationMetrics {
  overallAccuracy: number;
  perClass: PerClassMetrics[];
  macroF1: number;
}

export function evaluateClassification(
  results: ClassificationResult[],
  groundTruth: Map<string, EventType> // clusterId → true type
): ClassificationMetrics {
  const types: EventType[] = [
    "fire", "active_threat", "flood", "protest",
    "infrastructure_outage", "transport_disruption", "severe_weather",
  ];

  const perClass: PerClassMetrics[] = types.map((t) => {
    let tp = 0, fp = 0, fn = 0;
    for (const r of results) {
      const gt = groundTruth.get(r.clusterId);
      if (!gt) continue;
      const predicted = r.classification.type;
      if (predicted === t && gt === t) tp++;
      else if (predicted === t && gt !== t) fp++;
      else if (predicted !== t && gt === t) fn++;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    const support = Array.from(groundTruth.values()).filter((v) => v === t).length;
    return { type: t, precision, recall, f1, support };
  });

  const correct = results.filter((r) => {
    const gt = groundTruth.get(r.clusterId);
    return gt && r.classification.type === gt;
  }).length;
  const total = results.filter((r) => groundTruth.has(r.clusterId)).length;

  const macroF1 = perClass.reduce((sum, m) => sum + m.f1, 0) / perClass.length;

  return {
    overallAccuracy: total === 0 ? 0 : Math.round((correct / total) * 1000) / 1000,
    perClass,
    macroF1: Math.round(macroF1 * 1000) / 1000,
  };
}
