import { RequestHandler } from "express";
import { JourneySearchResponse } from "@shared/api";

export const handleJourneySearch: RequestHandler = (req, res) => {
  const origin = typeof req.query.origin === "string" ? req.query.origin : "";
  const destination = typeof req.query.destination === "string" ? req.query.destination : "";
  if (!origin || !destination) return res.status(400).json({ error: "Origin and destination are required.", code: "INVALID_JOURNEY_SEARCH" });
  const capabilities: JourneySearchResponse["capabilities"] = [
    { type: "flight", provider: "amadeus", configured: Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET), reason: "Live flight offers use Amadeus Flight Offers Search." },
    { type: "train", provider: "not-configured", configured: false, reason: "No railway inventory provider is configured for this deployment." },
    { type: "bus", provider: "not-configured", configured: false, reason: "No bus inventory provider is configured for this deployment." },
    { type: "taxi", provider: "google-routes", configured: Boolean(process.env.GOOGLE_MAPS_SERVER_KEY), reason: "Routes can calculate drive estimates; ride booking requires a supported mobility partner." },
    { type: "rental_car", provider: "not-configured", configured: false, reason: "No rental-car booking provider is configured for this deployment." },
    { type: "metro", provider: "transit-provider", configured: false, reason: "Transit routing requires a destination-specific GTFS or maps provider." },
    { type: "walking", provider: "google-routes", configured: Boolean(process.env.GOOGLE_MAPS_SERVER_KEY), reason: "Walking routes require the configured routes provider." },
    { type: "bike", provider: "mobility-provider", configured: false, reason: "Micromobility availability is destination/provider dependent." },
  ];
  res.json({ origin, destination, segments: [], capabilities } satisfies JourneySearchResponse);
};
