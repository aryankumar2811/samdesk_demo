"use client";

import { useState, useCallback, useRef } from "react";
import type { AgentEvent } from "@/lib/agent";

export interface ToolCallRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  latencyMs?: number;
  iterationIndex: number;
}

export interface StreamState {
  status: "idle" | "running" | "done" | "error";
  tokens: string;
  toolCalls: ToolCallRecord[];
  decision: Extract<AgentEvent, { type: "decision" }> | null;
  error: string | null;
}

export function useAgentStream() {
  const [state, setState] = useState<StreamState>({
    status: "idle",
    tokens: "",
    toolCalls: [],
    decision: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (incidentId: string) => {
    // Cancel any in-flight stream
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setState({
      status: "running",
      tokens: "",
      toolCalls: [],
      decision: null,
      error: null,
    });

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setState((s) => ({
          ...s,
          status: "error",
          error: err.error ?? "Agent request failed",
        }));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: AgentEvent & { type: string };
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          if (event.type === "token") {
            setState((s) => ({ ...s, tokens: s.tokens + event.text }));
          } else if (event.type === "tool_call") {
            const tc = event as Extract<AgentEvent, { type: "tool_call" }>;
            setState((s) => ({
              ...s,
              toolCalls: [
                ...s.toolCalls,
                {
                  id: tc.id,
                  name: tc.name,
                  input: tc.input,
                  iterationIndex: tc.iterationIndex,
                },
              ],
            }));
          } else if (event.type === "tool_result") {
            const tr = event as Extract<AgentEvent, { type: "tool_result" }>;
            setState((s) => ({
              ...s,
              toolCalls: s.toolCalls.map((t) =>
                t.id === tr.toolCallId
                  ? { ...t, result: tr.content, isError: tr.isError, latencyMs: tr.latencyMs }
                  : t
              ),
            }));
          } else if (event.type === "decision") {
            const d = event as Extract<AgentEvent, { type: "decision" }>;
            setState((s) => ({
              ...s,
              status: "done",
              decision: d,
            }));
          } else if (event.type === "error") {
            const e = event as Extract<AgentEvent, { type: "error" }>;
            setState((s) => ({
              ...s,
              status: "error",
              error: e.message,
            }));
          }
        }
      }

      setState((s) => ({ ...s, status: s.status === "running" ? "done" : s.status }));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Stream error",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", tokens: "", toolCalls: [], decision: null, error: null });
  }, []);

  return { state, run, reset };
}
