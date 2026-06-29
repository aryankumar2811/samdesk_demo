import { NextRequest } from "next/server";
import { clusterSignals } from "@/lib/pipeline/clustering";
import { classifyAllClusters } from "@/lib/pipeline/classify";
import { SIGNALS } from "@/data";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(_req: NextRequest) {
  const clusters = clusterSignals(SIGNALS);
  const classifications = classifyAllClusters(clusters);

  // Serialize: Map isn't JSON-serializable, so convert signalScores
  const serialized = clusters.map((c) => ({
    id: c.id,
    title: c.title,
    place: c.place,
    lat: c.lat,
    lng: c.lng,
    corroborationScore: c.corroborationScore,
    uniqueSources: c.uniqueSources,
    signalCount: c.signals.length,
    signalIds: c.signals.map((s) => s.id),
    signalScores: Object.fromEntries(c.signalScores),
    classification: classifications.find((r) => r.clusterId === c.id)?.classification,
  }));

  return new Response(JSON.stringify({ clusters: serialized }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  return POST(new NextRequest("http://localhost/api/pipeline", { method: "POST" }));
}
