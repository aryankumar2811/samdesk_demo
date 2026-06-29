import { NextRequest } from "next/server";
import { runFullEval } from "@/lib/pipeline/eval";
import { runAgent } from "@/lib/agent";
import { getGroundTruthDecision } from "@/lib/pipeline/eval";
import type { AgentRunRecord } from "@/lib/pipeline/eval";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let agentSampleN = 6;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.agentSampleN === "number") agentSampleN = body.agentSampleN;
  } catch {
    // use default
  }

  // Run agent on sample incidents
  const sampleIncidents = ["inc-001", "inc-002", "inc-003"].slice(0, agentSampleN);
  const agentRuns: AgentRunRecord[] = [];

  for (const incidentId of sampleIncidents) {
    const start = Date.now();
    let decision: "verified" | "flag_misinformation" | "escalate_to_human" =
      "escalate_to_human";
    let groundingFaithfulness = 0;
    let toolCallCount = 0;

    try {
      for await (const event of runAgent(incidentId)) {
        if (event.type === "tool_call") toolCallCount++;
        if (event.type === "decision") {
          decision = event.decision;
          groundingFaithfulness = event.groundingFaithfulness;
        }
      }
    } catch {
      // agent error — treat as escalate
    }

    agentRuns.push({
      incidentId,
      decision,
      groundTruthDecision: getGroundTruthDecision(incidentId),
      toolCallCount,
      groundingFaithfulness,
      latencyMs: Date.now() - start,
    });
  }

  const results = await runFullEval(agentRuns);

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
