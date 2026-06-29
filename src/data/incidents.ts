export type EventType =
  | "fire"
  | "active_threat"
  | "flood"
  | "protest"
  | "infrastructure_outage"
  | "transport_disruption"
  | "severe_weather";

export type Severity = "low" | "moderate" | "high" | "critical";

export interface GroundTruthIncident {
  id: string;
  type: EventType;
  severity: Severity;
  title: string;
  location: string;
  lat: number;
  lng: number;
  description: string;
  /** Which demo scenario this incident anchors */
  demoScenario?: "verify" | "misinfo" | "escalate";
}

export const INCIDENTS: GroundTruthIncident[] = [
  {
    id: "inc-001",
    type: "fire",
    severity: "critical",
    title: "Chemical warehouse fire — Port Halworth Docklands",
    location: "Port Halworth, Docklands District",
    lat: 37.782,
    lng: -122.412,
    description:
      "Major fire at Meridian Chemical storage facility with multi-source corroboration and official confirmation.",
    demoScenario: "verify",
  },
  {
    id: "inc-002",
    type: "active_threat",
    severity: "high",
    title: "Reported active threat — Verdana Stadium",
    location: "Verdana Stadium, Nadir City",
    lat: 37.755,
    lng: -122.435,
    description:
      "Recycled 2019 stadium incident reposted as current; contradicted by official sources and timestamps.",
    demoScenario: "misinfo",
  },
  {
    id: "inc-003",
    type: "flood",
    severity: "moderate",
    title: "Flash flood warning — Calavera Bay waterfront",
    location: "Calavera Bay, Waterfront Zone",
    lat: 37.804,
    lng: -122.271,
    description:
      "Flash flood watch issued but conflicting sensor readings; impact scope uncertain.",
    demoScenario: "escalate",
  },
  {
    id: "inc-004",
    type: "protest",
    severity: "moderate",
    title: "Large protest — Selene District civic center",
    location: "Selene District, Nadir City",
    lat: 37.763,
    lng: -122.44,
    description:
      "Significant protest rally confirmed by police and multiple social feeds.",
  },
  {
    id: "inc-005",
    type: "transport_disruption",
    severity: "high",
    title: "Derailment — Kessler freight line, Mile 47",
    location: "Kessler Freight Corridor, Mile 47",
    lat: 37.819,
    lng: -122.255,
    description:
      "Freight derailment with potential hazmat implication; sensors and partner feed corroborate.",
  },
  {
    id: "inc-006",
    type: "infrastructure_outage",
    severity: "moderate",
    title: "Grid outage — Nadir City North substation",
    location: "Nadir City North",
    lat: 37.771,
    lng: -122.431,
    description: "Substation failure affecting ~40k residents; NadirCity EM confirmed.",
  },
  {
    id: "inc-007",
    type: "severe_weather",
    severity: "low",
    title: "Dense fog advisory — Calavera Bay shipping lane",
    location: "Calavera Bay, Shipping Lane Alpha",
    lat: 37.812,
    lng: -122.28,
    description: "NWS fog advisory with Port Authority confirmation; low immediate impact.",
  },
];

export function getIncidentById(id: string): GroundTruthIncident | undefined {
  return INCIDENTS.find((i) => i.id === id);
}
