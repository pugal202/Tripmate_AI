export interface DemoResponse {
  message: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface WeatherResponse {
  location: { name: string; latitude: number; longitude: number };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    updatedAt: string;
  };
  daily: Array<{ date: string; high: number; low: number; weatherCode: number }>;
  source: "open-meteo";
}

export interface ProviderStatus {
  provider: string;
  configured: boolean;
  capabilities: string[];
  missing?: string[];
}

export type JourneyMode = "flight" | "train" | "bus" | "taxi" | "rental_car" | "metro" | "tram" | "walking" | "bike" | "other";

export interface JourneySegment {
  type: JourneyMode;
  provider?: string;
  serviceNumber?: string;
  origin: string;
  destination: string;
  departure?: string;
  arrival?: string;
  status: "scheduled" | "boarding" | "on_time" | "delayed" | "cancelled" | "completed" | "unavailable";
  currentLocation?: string;
  nextStop?: string;
  eta?: string;
  delay?: number;
  platform?: string;
  gate?: string;
  terminal?: string;
  bookingReference?: string;
  price?: number;
  currency?: string;
}

export interface JourneySearchResponse {
  origin: string;
  destination: string;
  segments: JourneySegment[];
  capabilities: Array<{ type: JourneyMode; provider: string; configured: boolean; reason?: string }>;
}

export interface FlightOffer {
  id: string;
  source: string;
  airlineCodes: string[];
  itineraries: Array<{ duration: string; segments: Array<{ carrierCode: string; number: string; departure: string; arrival: string; from: string; to: string }> }>;
  price: { currency: string; total: string };
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
  provider: "amadeus";
  testEnvironment: boolean;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  types: string[];
  location: { latitude: number; longitude: number };
  openNow?: boolean;
}

export interface PlacesSearchResponse {
  places: PlaceResult[];
  provider: "google-places";
}

export interface AiResponse {
  answer: string;
  action?: { type: string; requiresConfirmation: boolean; payload: Record<string, unknown> };
  provider: "openai" | "rule-based";
}
