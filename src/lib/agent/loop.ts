/**
 * Real Anthropic agent loop with tool use.
 * Claude decides which tools to call; this server executes them.
 * The frontend receives streamed events — it never scripts the decisions.
 */

import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS, executeTool } from "./tools";
import { AGENT_SYSTEM_PROMPT, GROUNDING_REVISION_PROMPT } from "./prompts";
import { SIGNALS, getSignalById, getIncidentById } from "@/data";

export const MODEL = "claude-sonnet-4-6";
const MAX_ITERATIONS = 8;

// ─── Streaming event types ────────────────────────────────────────────────────

export type AgentEvent =
  | { type: "token"; text: string }
  | {
      type: "tool_call";
      id: string;
      name: string;
      input: Record<string, unknown>;
      iterationIndex: number;
    }
  | {
      type: "tool_result";
      toolCallId: string;
      name: string;
      content: string;
      isError: boolean;
      latencyMs: number;
    }
  | {
      type: "decision";
      decision: "verified" | "flag_misinformation" | "escalate_to_human";
      severity: "low" | "moderate" | "high" | "critical";
      brief: string;
      citations: string[];
      rationale: string;
      groundingFaithfulness: number;
      totalLatencyMs: number;
      iterationCount: number;
    }
  | { type: "error"; message: string };

export interface DecisionPayload {
  decision: "verified" | "flag_misinformation" | "escalate_to_human";
  severity: "low" | "moderate" | "high" | "critical";
  brief: string;
  citations: string[];
  rationale: string;
}

// ─── Grounding guard ──────────────────────────────────────────────────────────

function checkGrounding(
  brief: string,
  citations: string[]
): { faithful: boolean; faithfulness: number; ungrounded: string[] } {
  if (citations.length === 0) {
    return { faithful: false, faithfulness: 0, ungrounded: [brief] };
  }

  // Collect all text from cited signals
  const citedTexts = citations
    .map((id) => getSignalById(id)?.text ?? "")
    .join(" ")
    .toLowerCase();

  // Split brief into sentences and check each
  const sentences = brief.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10);
  const ungrounded: string[] = [];

  for (const sentence of sentences) {
    const tokens = sentence
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3);
    const matches = tokens.filter((t) => citedTexts.includes(t)).length;
    const coverage = tokens.length === 0 ? 1 : matches / tokens.length;
    if (coverage < 0.25) {
      ungrounded.push(sentence);
    }
  }

  const faithfulness = sentences.length === 0 ? 1 : 1 - ungrounded.length / sentences.length;
  return { faithful: ungrounded.length === 0, faithfulness, ungrounded };
}

// ─── Build the initial user message ──────────────────────────────────────────

function buildUserMessage(incidentId: string): string {
  const incident = getIncidentById(incidentId);

  // Provide context about the incident cluster without leaking ground truth
  const incidentSignals = SIGNALS.filter((s) => s.incidentId === incidentId);
  const previewSignals = incidentSignals.slice(0, 3);

  const previewText = previewSignals
    .map((s) => `  - [${s.sourceId}] "${s.text.slice(0, 120)}…"`)
    .join("\n");

  return [
    `Please investigate the following reported incident.`,
    ``,
    `Incident ID: ${incidentId}`,
    incident ? `Reported title: ${incident.title}` : "",
    incident ? `Reported location: ${incident.location}` : "",
    ``,
    `Initial signals received (${incidentSignals.length} total in corpus — use your tools to retrieve more):`,
    previewText,
    ``,
    `Use your tools to investigate. Search for corroborating and contradictory signals, check source reliability, geolocate the incident, and assess asset exposure if warranted. Then submit your decision.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Main agent loop (returns an async generator of events) ──────────────────

export async function* runAgent(incidentId: string): AsyncGenerator<AgentEvent> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const startTime = Date.now();
  let iterationCount = 0;
  let toolCallsTotal = 0;
  let decisionPayload: DecisionPayload | null = null;
  let groundingAttempted = false;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserMessage(incidentId) },
  ];

  while (iterationCount < MAX_ITERATIONS && !decisionPayload) {
    iterationCount++;

    // Collect content blocks for this turn
    const assistantContent: Anthropic.ContentBlock[] = [];
    let currentReasoningText = "";

    // Stream the response
    const stream = await client.messages
      .stream({
        model: MODEL,
        max_tokens: 2048,
        system: AGENT_SYSTEM_PROMPT,
        tools: TOOL_DEFINITIONS,
        tool_choice: { type: "auto" },
        messages,
      })
      .on("text", (text) => {
        currentReasoningText += text;
      });

    // Emit tokens as they arrive (re-stream via the generator)
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "token", text: event.delta.text };
      }
    }

    const response = await stream.finalMessage();

    // Build assistant content blocks
    for (const block of response.content) {
      assistantContent.push(block);
    }

    messages.push({ role: "assistant", content: assistantContent });

    // Process tool use blocks
    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        const toolInput = block.input as Record<string, unknown>;
        toolCallsTotal++;

        yield {
          type: "tool_call",
          id: block.id,
          name: block.name,
          input: toolInput,
          iterationIndex: iterationCount,
        };

        // Check if this is submit_decision
        if (block.name === "submit_decision") {
          const payload = toolInput as unknown as DecisionPayload;

          // Grounding guard (one revision allowed)
          const { faithful, faithfulness, ungrounded } = checkGrounding(
            payload.brief,
            payload.citations
          );

          if (!faithful && !groundingAttempted) {
            groundingAttempted = true;
            const revisionResult = {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: GROUNDING_REVISION_PROMPT(ungrounded),
            };
            toolResults.push(revisionResult);

            yield {
              type: "tool_result",
              toolCallId: block.id,
              name: block.name,
              content: `Grounding check failed — ${ungrounded.length} claim(s) could not be tied to citations. Requesting revision.`,
              isError: false,
              latencyMs: 0,
            };
          } else {
            // Accept the decision
            const gf = faithful ? faithfulness : Math.max(0.5, faithfulness);
            decisionPayload = payload;

            toolResults.push({
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: `Decision recorded: ${payload.decision}. Grounding faithfulness: ${Math.round(gf * 100)}%.`,
            });

            yield {
              type: "tool_result",
              toolCallId: block.id,
              name: block.name,
              content: `Decision accepted.`,
              isError: false,
              latencyMs: 0,
            };

            yield {
              type: "decision",
              decision: payload.decision,
              severity: payload.severity,
              brief: payload.brief,
              citations: payload.citations,
              rationale: payload.rationale,
              groundingFaithfulness: Math.round(gf * 100) / 100,
              totalLatencyMs: Date.now() - startTime,
              iterationCount,
            };
          }
          continue;
        }

        // Execute non-decision tools
        const toolStart = Date.now();
        let result = executeTool(block.name, toolInput);

        // Retry once on error
        if (result.isError) {
          result = executeTool(block.name, toolInput);
        }

        const latencyMs = Date.now() - toolStart;

        yield {
          type: "tool_result",
          toolCallId: block.id,
          name: block.name,
          content: result.content,
          isError: result.isError ?? false,
          latencyMs,
        };

        toolResults.push({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result.isError
            ? `Error: ${result.content}`
            : result.content,
        });
      }

      if (toolResults.length > 0) {
        messages.push({ role: "user", content: toolResults });
      }
    } else if (response.stop_reason === "end_turn") {
      // Agent finished without calling submit_decision — force escalation
      if (!decisionPayload) {
        yield {
          type: "decision",
          decision: "escalate_to_human",
          severity: "moderate",
          brief:
            "The investigation reached its conclusion without a definitive decision. The incident requires human review.",
          citations: [],
          rationale:
            "Agent reached end_turn without calling submit_decision. Defaulting to escalation.",
          groundingFaithfulness: 0,
          totalLatencyMs: Date.now() - startTime,
          iterationCount,
        };
      }
      break;
    }
  }

  // Hit iteration cap without decision
  if (!decisionPayload && iterationCount >= MAX_ITERATIONS) {
    yield {
      type: "decision",
      decision: "escalate_to_human",
      severity: "moderate",
      brief:
        "Maximum investigation depth reached without sufficient evidence for a confident decision. Escalating for human review.",
      citations: [],
      rationale: `Hit ${MAX_ITERATIONS}-iteration cap. Defaulting to escalation.`,
      groundingFaithfulness: 0,
      totalLatencyMs: Date.now() - startTime,
      iterationCount,
    };
  }
}
