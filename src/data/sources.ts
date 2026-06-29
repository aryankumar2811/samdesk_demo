export type SourceType = "social" | "news" | "sensor" | "official";

export interface Source {
  id: string;
  handle: string;
  type: SourceType;
  reliability: number; // 0–1
  country: string;
  description: string;
}

export const SOURCES: Source[] = [
  // Social
  {
    id: "src-001",
    handle: "@PortHalworthLive",
    type: "social",
    reliability: 0.62,
    country: "US",
    description: "Local news aggregator account for Port Halworth, often first to scene",
  },
  {
    id: "src-002",
    handle: "@VerdanaStadiumOps",
    type: "social",
    reliability: 0.78,
    country: "US",
    description: "Official ops account for Verdana Stadium — reliable for venue events",
  },
  {
    id: "src-003",
    handle: "@KesslerLineWatch",
    type: "social",
    reliability: 0.55,
    country: "US",
    description: "Citizen monitoring group for Kessler freight corridor",
  },
  {
    id: "src-004",
    handle: "@RivieraCoastNews",
    type: "social",
    reliability: 0.7,
    country: "FR",
    description: "French regional citizen journalist network",
  },
  {
    id: "src-005",
    handle: "@MontserratWatch",
    type: "social",
    reliability: 0.48,
    country: "ES",
    description: "Spanish-language community safety watch group",
  },
  {
    id: "src-006",
    handle: "@NadirCityAlerts",
    type: "social",
    reliability: 0.58,
    country: "US",
    description: "Community alert account for Nadir City metro area",
  },
  {
    id: "src-007",
    handle: "@CalaveraBayLocal",
    type: "social",
    reliability: 0.65,
    country: "US",
    description: "Calavera Bay residents' real-time local feed",
  },
  {
    id: "src-008",
    handle: "@SeleneDistrictReporter",
    type: "social",
    reliability: 0.72,
    country: "US",
    description: "Verified journalist covering Selene District",
  },
  {
    id: "src-009",
    handle: "@AlQudsFeedAR",
    type: "social",
    reliability: 0.5,
    country: "JO",
    description: "Arabic-language community feed, moderate reliability",
  },
  {
    id: "src-010",
    handle: "@FalcoRidgeReports",
    type: "social",
    reliability: 0.44,
    country: "US",
    description: "Low-reliability account known for resharing unverified content",
  },

  // News wire
  {
    id: "src-011",
    handle: "NorthernCoastGazette",
    type: "news",
    reliability: 0.88,
    country: "US",
    description: "Regional daily newspaper with editorial standards",
  },
  {
    id: "src-012",
    handle: "GlobalSecurityWire",
    type: "news",
    reliability: 0.91,
    country: "UK",
    description: "Professional security & crisis wire service",
  },
  {
    id: "src-013",
    handle: "AgencePressLibre",
    type: "news",
    reliability: 0.85,
    country: "FR",
    description: "French-language international wire — French text sources",
  },
  {
    id: "src-014",
    handle: "LaCorriereDelMare",
    type: "news",
    reliability: 0.82,
    country: "IT",
    description: "Italian maritime and coastal news service",
  },
  {
    id: "src-015",
    handle: "MidwestAlertNetwork",
    type: "news",
    reliability: 0.76,
    country: "US",
    description: "US regional crisis and weather news aggregator",
  },

  // Official / gov
  {
    id: "src-016",
    handle: "PortHalworthFireDept",
    type: "official",
    reliability: 0.97,
    country: "US",
    description: "Official Port Halworth Fire Department public account",
  },
  {
    id: "src-017",
    handle: "NadirCityEmergencyMgmt",
    type: "official",
    reliability: 0.96,
    country: "US",
    description: "Nadir City Office of Emergency Management",
  },
  {
    id: "src-018",
    handle: "CalaveraBayPortAuthority",
    type: "official",
    reliability: 0.94,
    country: "US",
    description: "Calavera Bay Port Authority — maritime incident authority",
  },
  {
    id: "src-019",
    handle: "NationalWeatherServiceHW",
    type: "official",
    reliability: 0.99,
    country: "US",
    description: "NWS Port Halworth/Calavera Bay office",
  },
  {
    id: "src-020",
    handle: "SeleneDistrictPolice",
    type: "official",
    reliability: 0.95,
    country: "US",
    description: "Selene District Police Department public affairs",
  },

  // Sensor / weather
  {
    id: "src-021",
    handle: "SensorNet-PH-AQI",
    type: "sensor",
    reliability: 0.93,
    country: "US",
    description: "Port Halworth air quality sensor network",
  },
  {
    id: "src-022",
    handle: "SensorNet-CB-Flood",
    type: "sensor",
    reliability: 0.92,
    country: "US",
    description: "Calavera Bay flood gauge network",
  },
  {
    id: "src-023",
    handle: "WeatherCam-Verdana",
    type: "sensor",
    reliability: 0.89,
    country: "US",
    description: "Verdana stadium area weather and visibility sensors",
  },
  {
    id: "src-024",
    handle: "KesslerLineSensor",
    type: "sensor",
    reliability: 0.9,
    country: "US",
    description: "Automated sensors along Kessler freight line",
  },
  {
    id: "src-025",
    handle: "PartnerFeed-Securitas",
    type: "sensor",
    reliability: 0.87,
    country: "US",
    description: "Partner feed from private security intelligence provider",
  },
];

export function getSourceById(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function getSourceByHandle(handle: string): Source | undefined {
  return SOURCES.find((s) => s.handle === handle);
}
