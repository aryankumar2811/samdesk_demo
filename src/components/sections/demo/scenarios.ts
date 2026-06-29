/** Pre-seeded demo scenarios for the Live Demo console. */

export interface DemoScenario {
  incidentId: string;
  title: string;
  description: string;
  expectedOutcome: "verified" | "flag_misinformation" | "escalate_to_human";
  location: string;
  signalCount: number;
  sourceCount: number;
  eventType: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    incidentId: "inc-001",
    title: "Chemical Warehouse Fire — Port Halworth Docklands",
    description:
      "12 signals from 8 independent sources including official fire dispatch, AQI sensors, news wire, and partner intelligence. Strong multi-source corroboration.",
    expectedOutcome: "verified",
    location: "Port Halworth, Docklands District",
    signalCount: 12,
    sourceCount: 8,
    eventType: "Fire / Hazmat",
  },
  {
    incidentId: "inc-002",
    title: "Reported Active Threat — Verdana Stadium",
    description:
      "Initial reports from low-reliability account; official police, venue ops, and sensors all contradict. Content appears recycled from a 2019 incident.",
    expectedOutcome: "flag_misinformation",
    location: "Verdana Stadium, Nadir City",
    signalCount: 8,
    sourceCount: 6,
    eventType: "Active Threat",
  },
  {
    incidentId: "inc-003",
    title: "Flash Flood Watch — Calavera Bay Waterfront",
    description:
      "NWS watch is real, but one of three primary flood sensors is offline. Social reports conflict — one eyewitness reports overtopping, port authority sees normal conditions.",
    expectedOutcome: "escalate_to_human",
    location: "Calavera Bay, Waterfront Zone",
    signalCount: 8,
    sourceCount: 6,
    eventType: "Flood",
  },
];
