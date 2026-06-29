import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let incidentId: string;

  try {
    const body = await req.json();
    incidentId = body.incidentId;
    if (!incidentId || typeof incidentId !== "string") {
      return new Response(JSON.stringify({ error: "incidentId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: object) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      try {
        for await (const event of runAgent(incidentId)) {
          send(event);
          if (event.type === "decision" || event.type === "error") {
            break;
          }
        }
      } catch (err) {
        send({
          type: "error",
          message:
            err instanceof Error ? err.message : "Unknown error running agent",
        });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
