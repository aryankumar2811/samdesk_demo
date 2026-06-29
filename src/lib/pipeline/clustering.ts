/**
 * Clustering: TF-IDF cosine similarity + time-window + geo proximity.
 * Produces predicted clusters. Does NOT read incidentId (ground truth is eval-only).
 */

import { SIGNALS, Signal } from "@/data/signals";

export interface PredictedCluster {
  id: string;
  signals: Signal[];
  centroidText: string;
  title: string;
  place: string;
  lat?: number;
  lng?: number;
  /** Largest similarity score within the cluster */
  corroborationScore: number;
  /** Number of unique sources */
  uniqueSources: number;
  /** Per-signal similarity scores relative to cluster centroid */
  signalScores: Map<string, number>;
}

// ─── Tokenizer & TF-IDF ───

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function buildTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const total = tokens.length || 1;
  tf.forEach((v, k) => tf.set(k, v / total));
  return tf;
}

function buildIdf(docs: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const tokens of docs) {
    const seen = new Set(tokens);
    seen.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  }
  const N = docs.length;
  const idf = new Map<string, number>();
  df.forEach((count, term) => idf.set(term, Math.log((N + 1) / (count + 1)) + 1));
  return idf;
}

function tfidfVector(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const vec = new Map<string, number>();
  tf.forEach((v, k) => vec.set(k, v * (idf.get(k) ?? 1)));
  return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  a.forEach((v, k) => {
    dot += v * (b.get(k) ?? 0);
    normA += v * v;
  });
  b.forEach((v) => (normB += v * v));
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Geo proximity ───

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

// ─── Clustering parameters ───

const TEXT_THRESHOLD = 0.18; // cosine similarity to consider same cluster
const GEO_THRESHOLD_KM = 30; // within 30km contributes to geo score
const TIME_WINDOW_HOURS = 4; // signals within 4h of each other

function timeScore(a: Signal, b: Signal): number {
  const dtH = Math.abs(
    (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) / 3600000
  );
  return dtH <= TIME_WINDOW_HOURS ? 1 - dtH / TIME_WINDOW_HOURS : 0;
}

function geoScore(a: Signal, b: Signal): number {
  if (!a.lat || !a.lng || !b.lat || !b.lng) return 0;
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
  return km <= GEO_THRESHOLD_KM ? 1 - km / GEO_THRESHOLD_KM : 0;
}

// ─── Derive a title from the most informative signal in a cluster ───

function deriveTitle(signals: Signal[]): string {
  // Prefer official/news sources for the title signal
  const sorted = [...signals].sort(
    (a, b) => (b.text.length > 150 ? 1 : 0) - (a.text.length > 150 ? 1 : 0)
  );
  const anchor = sorted[0];
  const snippet = anchor.text.slice(0, 80).replace(/\n/g, " ").trim();
  return snippet.endsWith("...") ? snippet : snippet.length < anchor.text.length ? snippet + "…" : snippet;
}

function deriveCentroidText(signals: Signal[]): string {
  return signals.map((s) => s.text).join(" ").slice(0, 500);
}

function derivePlace(signals: Signal[]): string {
  const places = signals.flatMap((s) => (s.place ? [s.place] : []));
  const counts = new Map<string, number>();
  places.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  let best = "";
  let bestCount = 0;
  counts.forEach((c, p) => {
    if (c > bestCount) {
      bestCount = c;
      best = p;
    }
  });
  return best || "Unknown location";
}

// ─── Main clustering function ───

export function clusterSignals(signals: Signal[] = SIGNALS): PredictedCluster[] {
  // Build TF-IDF corpus
  const tokenized = signals.map((s) => tokenize(s.text));
  const idf = buildIdf(tokenized);
  const vectors = signals.map((s, i) => tfidfVector(buildTf(tokenized[i]), idf));

  // Greedy agglomerative clustering
  const clusterOf = new Array<number>(signals.length).fill(-1);
  let nextCluster = 0;

  for (let i = 0; i < signals.length; i++) {
    if (clusterOf[i] !== -1) continue;

    clusterOf[i] = nextCluster;

    for (let j = i + 1; j < signals.length; j++) {
      if (clusterOf[j] !== -1) continue;

      const textSim = cosine(vectors[i], vectors[j]);
      const time = timeScore(signals[i], signals[j]);
      const geo = geoScore(signals[i], signals[j]);

      // Combined score: text similarity is primary; time and geo are boosters
      const combined = textSim * 0.65 + time * 0.2 + geo * 0.15;

      if (combined >= TEXT_THRESHOLD) {
        clusterOf[j] = nextCluster;
      }
    }

    nextCluster++;
  }

  // Group signals by cluster
  const groups = new Map<number, Signal[]>();
  signals.forEach((s, i) => {
    const c = clusterOf[i];
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(s);
  });

  // Build PredictedCluster objects — filter out singletons unless they have high-reliability source
  const clusters: PredictedCluster[] = [];
  groups.forEach((sigs, cid) => {
    if (sigs.length === 0) return;

    // Compute similarity scores within cluster
    const signalScores = new Map<string, number>();
    const anchorIdx = signals.indexOf(sigs[0]);
    for (const s of sigs) {
      const idx = signals.indexOf(s);
      const sim = anchorIdx !== idx ? cosine(vectors[anchorIdx], vectors[idx]) : 1.0;
      signalScores.set(s.id, Math.round(sim * 100) / 100);
    }

    const uniqueSources = new Set(sigs.map((s) => s.sourceId)).size;
    const maxScore = Math.max(...Array.from(signalScores.values()));
    const avgLat =
      sigs.filter((s) => s.lat).reduce((sum, s) => sum + (s.lat ?? 0), 0) /
      (sigs.filter((s) => s.lat).length || 1);
    const avgLng =
      sigs.filter((s) => s.lng).reduce((sum, s) => sum + (s.lng ?? 0), 0) /
      (sigs.filter((s) => s.lng).length || 1);

    clusters.push({
      id: `cluster-${cid}`,
      signals: sigs,
      centroidText: deriveCentroidText(sigs),
      title: deriveTitle(sigs),
      place: derivePlace(sigs),
      lat: sigs.some((s) => s.lat) ? avgLat : undefined,
      lng: sigs.some((s) => s.lng) ? avgLng : undefined,
      corroborationScore: Math.min(1, maxScore * (1 + (uniqueSources - 1) * 0.1)),
      uniqueSources,
      signalScores,
    });
  });

  // Sort by corroboration score desc, then size desc
  return clusters.sort(
    (a, b) =>
      b.corroborationScore - a.corroborationScore || b.signals.length - a.signals.length
  );
}

// ─── Eval helpers ───

export interface ClusteringMetrics {
  precision: number;
  recall: number;
  f1: number;
  numPredicted: number;
  numGroundTruth: number;
}

/** Evaluate clustering against ground-truth incidentId labels. */
export function evaluateClustering(predicted: PredictedCluster[]): ClusteringMetrics {
  const groundTruthGroups = new Map<string, Set<string>>();
  for (const sig of SIGNALS) {
    if (!groundTruthGroups.has(sig.incidentId))
      groundTruthGroups.set(sig.incidentId, new Set());
    groundTruthGroups.get(sig.incidentId)!.add(sig.id);
  }

  let tp = 0;
  let fp = 0;
  let fn = 0;

  for (const cluster of predicted) {
    const pairsPredicted = new Set<string>();
    for (let i = 0; i < cluster.signals.length; i++)
      for (let j = i + 1; j < cluster.signals.length; j++)
        pairsPredicted.add(
          [cluster.signals[i].id, cluster.signals[j].id].sort().join("|")
        );

    const groundTruthPairs = new Set<string>();
    groundTruthGroups.forEach((ids) => {
      const arr = Array.from(ids);
      for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++)
          groundTruthPairs.add([arr[i], arr[j]].sort().join("|"));
    });

    pairsPredicted.forEach((p) => {
      if (groundTruthPairs.has(p)) tp++;
      else fp++;
    });

    groundTruthPairs.forEach((p) => {
      if (!pairsPredicted.has(p)) fn++;
    });
  }

  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    f1: Math.round(f1 * 1000) / 1000,
    numPredicted: predicted.length,
    numGroundTruth: groundTruthGroups.size,
  };
}

const STOP_WORDS = new Set([
  "the", "is", "in", "it", "of", "to", "and", "a", "an", "that", "this", "are",
  "was", "for", "on", "at", "by", "with", "from", "be", "as", "has", "have",
  "its", "been", "not", "or", "but", "all", "can", "now", "no", "we", "our",
  "they", "their", "more", "will", "so", "one", "if", "up", "out", "do", "did",
  "via", "per", "re", "just", "any", "into", "than", "also", "amp", "rt",
]);
