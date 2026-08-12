import { RequestHandler } from "express";
import { ProviderStatus } from "@shared/api";

export const handleProviderStatus: RequestHandler = (_req, res) => {
  const providers: ProviderStatus[] = [
    { provider: "open-meteo", configured: true, capabilities: ["live weather", "five-day forecast", "geocoding"] },
    { provider: "amadeus", configured: Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET), capabilities: ["flight offers", "provider order boundary"], missing: ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"].filter((key) => !process.env[key]) },
    { provider: "google-places", configured: Boolean(process.env.GOOGLE_MAPS_SERVER_KEY), capabilities: ["place search", "restaurant discovery", "map coordinates"], missing: process.env.GOOGLE_MAPS_SERVER_KEY ? [] : ["GOOGLE_MAPS_SERVER_KEY"] },
    { provider: "openai", configured: Boolean(process.env.OPENAI_API_KEY), capabilities: ["contextual copilot", "trip analysis"], missing: process.env.OPENAI_API_KEY ? [] : ["OPENAI_API_KEY"] },
    { provider: "supabase", configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY), capabilities: ["persistent trips", "bookings", "expenses"], missing: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !process.env[key]) },
  ];
  res.json({ providers });
};
