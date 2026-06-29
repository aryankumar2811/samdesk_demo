/**
 * Anthropic tool schemas + server-side implementations.
 * Tool-calling decisions come from Claude; only the underlying data is synthetic.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { SIGNALS, SOURCES, ASSETS, getSignalById, getSourceByHandle, getSourceById } from "@/data";
import { getAssetsNearLocation } from "@/data/assets";

// ─── Tool schemas (passed to Anthropic Messages API) ─────────────────────────

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "search_signals",
    description:
      "Search the signal corpus for messages related to this incident. Returns up to 8 relevant signals with metadata. Use this to corroborate or find contradictory evidence.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Keywords or phrases to search for. Be specific.",
        },
        timeWindow: {
          type: "string",
          description:
            "Optional ISO 8601 time window string like '2024-08-14T13:00Z/2024-08-14T16:00Z'. Filters signals by timestamp.",
        },
        geo: {
          type: "object",
          description: "Optional geographic filter.",
          properties: {
            place: { type: "string", description: "Place name to filter on." },
          },
        },
      },
      required: ["query"],
    },
  },
  {
    name: "check_source_reliability",
    description:
      "Look up the reliability score and brief history of a source by its handle or source ID. Returns reliability (0–1), source type, and a description.",
    input_schema: {
      type: "object" as const,
      properties: {
        identifier: {
          type: "string",
          description: "The source handle (e.g. '@PortHalworthFireDept') or source ID (e.g. 'src-016').",
        },
      },
      required: ["identifier"],
    },
  },
  {
    name: "find_contradictions",
    description:
      "Search for signals that contradict or cast doubt on the incident. Looks for negations, denials, corrections, or conflicting facts. Returns up to 5 potentially contradictory signals.",
    input_schema: {
      type: "object" as const,
      properties: {
        incidentDescription: {
          type: "string",
          description: "A brief description of what the incident claims, so contradictory signals can be found.",
        },
        place: {
          type: "string",
          description: "The location to focus the contradiction search on.",
        },
      },
      required: ["incidentDescription"],
    },
  },
  {
    name: "geolocate",
    description:
      "Extract and resolve a place name from text to coordinates. Returns a place name, latitude, and longitude.",
    input_schema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "A snippet of text that mentions a location.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "get_asset_exposure",
    description:
      "Find customer assets (offices, venues, routes, facilities) within a given radius of a location. Use this when severity is high or critical to assess impact.",
    input_schema: {
      type: "object" as const,
      properties: {
        lat: { type: "number", description: "Latitude of the incident." },
        lng: { type: "number", description: "Longitude of the incident." },
        radiusKm: {
          type: "number",
          description: "Search radius in kilometers. Default 5.",
        },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "submit_decision",
    description:
      "Submit your final investigation decision. This terminates the agent loop. Only call this when you have sufficient evidence.",
    input_schema: {
      type: "object" as const,
      properties: {
        decision: {
          type: "string",
          enum: ["verified", "flag_misinformation", "escalate_to_human"],
          description: "Your final decision.",
        },
        severity: {
          type: "string",
          enum: ["low", "moderate", "high", "critical"],
          description: "Assessed severity. Only meaningful for verified incidents.",
        },
        brief: {
          type: "string",
          description:
            "3–5 sentence grounded brief. Every factual claim must be supported by a signal in citations.",
        },
        citations: {
          type: "array",
          items: { type: "string" },
          description: "Array of signal IDs that support claims in the brief.",
        },
        rationale: {
          type: "string",
          description:
            "1–2 sentence explanation of why you chose this decision (not included in the published brief).",
        },
      },
      required: ["decision", "severity", "brief", "citations", "rationale"],
    },
  },
];

// ─── Tool implementations ─────────────────────────────────────────────────────

export interface ToolResult {
  content: string;
  isError?: boolean;
}

function tokenOverlap(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter((t) => t.length > 2));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter((t) => t.length > 2));
  let overlap = 0;
  setA.forEach((t) => { if (setB.has(t)) overlap++; });
  return overlap / Math.max(setA.size, setB.size, 1);
}

export function executeSearchSignals(input: {
  query: string;
  timeWindow?: string;
  geo?: { place?: string };
}): ToolResult {
  let candidates = [...SIGNALS];

  // Time filter
  if (input.timeWindow) {
    const parts = input.timeWindow.split("/");
    const start = parts[0] ? new Date(parts[0]).getTime() : 0;
    const end = parts[1] ? new Date(parts[1]).getTime() : Infinity;
    candidates = candidates.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= start && t <= end;
    });
  }

  // Geo filter
  if (input.geo?.place) {
    const place = input.geo.place.toLowerCase();
    candidates = candidates.filter(
      (s) => s.place && s.place.toLowerCase().includes(place)
    );
  }

  // Score by query overlap
  const scored = candidates
    .map((s) => ({ s, score: tokenOverlap(input.query, s.text + " " + (s.place ?? "")) }))
    .filter(({ score }) => score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (scored.length === 0) {
    return { content: "No signals found matching the query." };
  }

  const results = scored.map(({ s, score }) => {
    const source = getSourceById(s.sourceId);
    return [
      `ID: ${s.id}`,
      `Source: ${source?.handle ?? s.sourceId} (type: ${source?.type ?? "unknown"}, reliability: ${source?.reliability ?? "?"})`,
      `Time: ${s.timestamp}`,
      `Place: ${s.place ?? "unspecified"}`,
      `Lang: ${s.lang}`,
      `Relevance score: ${Math.round(score * 100)}%`,
      `Text: ${s.text.slice(0, 300)}${s.text.length > 300 ? "…" : ""}`,
    ].join("\n");
  });

  return {
    content: `Found ${scored.length} relevant signal(s):\n\n${results.join("\n\n---\n\n")}`,
  };
}

export function executeCheckSourceReliability(input: { identifier: string }): ToolResult {
  const source =
    getSourceById(input.identifier) ?? getSourceByHandle(input.identifier);

  if (!source) {
    return {
      content: `Source '${input.identifier}' not found in registry. It may be an unknown or unofficial source — treat with low confidence.`,
    };
  }

  const reliabilityLabel =
    source.reliability >= 0.9
      ? "Very High"
      : source.reliability >= 0.75
      ? "High"
      : source.reliability >= 0.6
      ? "Moderate"
      : source.reliability >= 0.45
      ? "Low"
      : "Very Low";

  return {
    content: [
      `Source: ${source.handle}`,
      `ID: ${source.id}`,
      `Type: ${source.type}`,
      `Country: ${source.country}`,
      `Reliability: ${source.reliability} (${reliabilityLabel})`,
      `Description: ${source.description}`,
    ].join("\n"),
  };
}

export function executeFindContradictions(input: {
  incidentDescription: string;
  place?: string;
}): ToolResult {
  const CONTRADICTION_TERMS = [
    "no incident", "false", "unfounded", "not happening", "empty", "closed",
    "fake", "recycled", "2019", "old", "deny", "denied", "contradicts",
    "normal", "nothing happening", "incorrect", "misinformation", "do not share",
    "no active", "no emergency", "stable", "offline", "sensor offline",
  ];

  let candidates = [...SIGNALS];

  if (input.place) {
    const place = input.place.toLowerCase();
    candidates = candidates.filter(
      (s) => !s.place || s.place.toLowerCase().includes(place) || tokenOverlap(input.place!, s.text) > 0.05
    );
  }

  const scored = candidates
    .map((s) => {
      const text = s.text.toLowerCase();
      const contradictionScore = CONTRADICTION_TERMS.filter((t) => text.includes(t)).length;
      const queryOverlap = tokenOverlap(input.incidentDescription, s.text);
      return { s, score: contradictionScore * 0.6 + queryOverlap * 0.4 };
    })
    .filter(({ score }) => score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    return {
      content: "No obvious contradictory signals found. This does not mean the incident is confirmed — it may simply mean no authoritative denial has been posted.",
    };
  }

  const results = scored.map(({ s }) => {
    const source = getSourceById(s.sourceId);
    return [
      `ID: ${s.id}`,
      `Source: ${source?.handle ?? s.sourceId} (reliability: ${source?.reliability ?? "?"})`,
      `Time: ${s.timestamp}`,
      `Text: ${s.text.slice(0, 250)}${s.text.length > 250 ? "…" : ""}`,
    ].join("\n");
  });

  return {
    content: `Found ${scored.length} potentially contradictory signal(s):\n\n${results.join("\n\n---\n\n")}`,
  };
}

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; canonical: string }> = {
  "port halworth": { lat: 37.782, lng: -122.412, canonical: "Port Halworth" },
  "verdana stadium": { lat: 37.755, lng: -122.435, canonical: "Verdana Stadium, Nadir City" },
  "calavera bay": { lat: 37.804, lng: -122.271, canonical: "Calavera Bay" },
  "nadir city": { lat: 37.763, lng: -122.44, canonical: "Nadir City" },
  "selene district": { lat: 37.763, lng: -122.44, canonical: "Selene District, Nadir City" },
  "kessler": { lat: 37.819, lng: -122.255, canonical: "Kessler Freight Corridor" },
  "docklands": { lat: 37.782, lng: -122.413, canonical: "Port Halworth Docklands" },
  "meridian chemical": { lat: 37.782, lng: -122.413, canonical: "Meridian Chemical, Port Halworth Docklands" },
};

export function executeGeolocate(input: { text: string }): ToolResult {
  const lower = input.text.toLowerCase();
  for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(key)) {
      return {
        content: [
          `Place: ${loc.canonical}`,
          `Latitude: ${loc.lat}`,
          `Longitude: ${loc.lng}`,
          `Confidence: High (matched known location '${key}')`,
        ].join("\n"),
      };
    }
  }
  return {
    content:
      "Location could not be resolved to known coordinates. The text may reference an unrecognized place name. Try searching signals with a place keyword for additional context.",
  };
}

export function executeGetAssetExposure(input: {
  lat: number;
  lng: number;
  radiusKm?: number;
}): ToolResult {
  const radius = input.radiusKm ?? 5;
  const nearby = getAssetsNearLocation(input.lat, input.lng, radius);

  if (nearby.length === 0) {
    return {
      content: `No monitored assets found within ${radius}km of (${input.lat}, ${input.lng}).`,
    };
  }

  const results = nearby.map((a) => {
    const distKm = haversineKm(input.lat, input.lng, a.lat, a.lng);
    return `- ${a.name} (${a.type}, criticality: ${a.criticality}) — ${distKm.toFixed(1)}km away`;
  });

  return {
    content: [
      `Assets within ${radius}km of (${input.lat.toFixed(3)}, ${input.lng.toFixed(3)}):`,
      ...results,
    ].join("\n"),
  };
}

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

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export function executeTool(name: string, input: Record<string, unknown>): ToolResult {
  try {
    switch (name) {
      case "search_signals":
        return executeSearchSignals(input as Parameters<typeof executeSearchSignals>[0]);
      case "check_source_reliability":
        return executeCheckSourceReliability(input as Parameters<typeof executeCheckSourceReliability>[0]);
      case "find_contradictions":
        return executeFindContradictions(input as Parameters<typeof executeFindContradictions>[0]);
      case "geolocate":
        return executeGeolocate(input as Parameters<typeof executeGeolocate>[0]);
      case "get_asset_exposure":
        return executeGetAssetExposure(input as Parameters<typeof executeGetAssetExposure>[0]);
      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  } catch (err) {
    return {
      content: `Tool '${name}' encountered an error: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}
