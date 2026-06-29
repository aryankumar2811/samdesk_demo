export type AssetType = "office" | "venue" | "route" | "facility";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  lat: number;
  lng: number;
  description: string;
  criticality: "low" | "medium" | "high";
}

export const ASSETS: Asset[] = [
  {
    id: "asset-001",
    name: "Meridian Tower — Port Halworth HQ",
    type: "office",
    lat: 37.78,
    lng: -122.41,
    description: "Primary corporate HQ, ~1,200 staff",
    criticality: "high",
  },
  {
    id: "asset-002",
    name: "Verdana Stadium",
    type: "venue",
    lat: 37.755,
    lng: -122.435,
    description: "80,000-capacity multi-use stadium",
    criticality: "high",
  },
  {
    id: "asset-003",
    name: "Calavera Bay Port Terminal",
    type: "facility",
    lat: 37.806,
    lng: -122.274,
    description: "Container port terminal, critical freight node",
    criticality: "high",
  },
  {
    id: "asset-004",
    name: "Kessler Depot — Mile 50",
    type: "facility",
    lat: 37.815,
    lng: -122.252,
    description: "Freight sorting and storage depot",
    criticality: "medium",
  },
  {
    id: "asset-005",
    name: "Nadir City Data Center North",
    type: "facility",
    lat: 37.77,
    lng: -122.43,
    description: "Tier-III data center serving metro area",
    criticality: "high",
  },
  {
    id: "asset-006",
    name: "Selene Convention Center",
    type: "venue",
    lat: 37.762,
    lng: -122.441,
    description: "Convention and event center, often during large gatherings",
    criticality: "medium",
  },
  {
    id: "asset-007",
    name: "Port Halworth Branch Office",
    type: "office",
    lat: 37.784,
    lng: -122.415,
    description: "Regional satellite office, ~200 staff",
    criticality: "medium",
  },
  {
    id: "asset-008",
    name: "Highway 9 Interchange — Falco Ridge",
    type: "route",
    lat: 37.79,
    lng: -122.39,
    description: "Critical evacuation and supply route",
    criticality: "high",
  },
  {
    id: "asset-009",
    name: "Docklands Warehouse Complex",
    type: "facility",
    lat: 37.783,
    lng: -122.413,
    description: "Logistics hub adjacent to Meridian Chemical site",
    criticality: "high",
  },
  {
    id: "asset-010",
    name: "Nadir City Research Campus",
    type: "facility",
    lat: 37.745,
    lng: -122.45,
    description: "R&D facility with sensitive materials storage",
    criticality: "medium",
  },
  {
    id: "asset-011",
    name: "CalaveraBay Bridge Route 12",
    type: "route",
    lat: 37.801,
    lng: -122.268,
    description: "Primary bridge connecting bay north and south zones",
    criticality: "high",
  },
  {
    id: "asset-012",
    name: "Selene District Police HQ",
    type: "facility",
    lat: 37.764,
    lng: -122.439,
    description: "Law enforcement coordination center",
    criticality: "medium",
  },
  {
    id: "asset-013",
    name: "Port Halworth Medical Center",
    type: "facility",
    lat: 37.779,
    lng: -122.408,
    description: "Regional trauma center, Level II designation",
    criticality: "high",
  },
  {
    id: "asset-014",
    name: "Nadir City Airport Access Road",
    type: "route",
    lat: 37.749,
    lng: -122.471,
    description: "Primary access route to Nadir City Regional Airport",
    criticality: "medium",
  },
  {
    id: "asset-015",
    name: "FalcoRidge Substation Alpha",
    type: "facility",
    lat: 37.795,
    lng: -122.382,
    description: "Grid substation serving northern districts",
    criticality: "high",
  },
];

export function getAssetById(id: string): Asset | undefined {
  return ASSETS.find((a) => a.id === id);
}

export function getAssetsNearLocation(
  lat: number,
  lng: number,
  radiusKm: number
): Asset[] {
  return ASSETS.filter((asset) => {
    const distance = haversineKm(lat, lng, asset.lat, asset.lng);
    return distance <= radiusKm;
  });
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

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
