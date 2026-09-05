import type { RequestHandler } from "express";
import type { JourneyMode, JourneySearchResponse, JourneySegment } from "@shared/api";

const cityCode: Record<string, string> = { bengaluru: "BLR", mumbai: "BOM", delhi: "DEL", hyderabad: "HYD", chennai: "MAA" };
const options = [
  { type: "flight", provider: "TripMate Demo Air", service: "AI 482", origin: "BLR", destination: "BOM", departure: "08:40", arrival: "10:35", price: 8250 },
  { type: "train", provider: "Indian Railways Demo", service: "Udyan Express · 11302", origin: "BLR", destination: "BOM", departure: "20:45", arrival: "10:25", price: 2140 },
  { type: "bus", provider: "VRL Travels Demo", service: "AC Sleeper", origin: "BLR", destination: "BOM", departure: "20:30", arrival: "09:30", price: 1850 },
  { type: "flight", provider: "TripMate Demo Air", service: "AI 618", origin: "BOM", destination: "DEL", departure: "20:00", arrival: "22:10", price: 8200 },
  { type: "train", provider: "Indian Railways Demo", service: "Mumbai Rajdhani · 12951", origin: "BOM", destination: "DEL", departure: "17:00", arrival: "08:35", price: 3260 },
  { type: "bus", provider: "IntrCity Demo", service: "AC Sleeper", origin: "BOM", destination: "DEL", departure: "18:00", arrival: "19:00", price: 2600 },
  { type: "flight", provider: "TripMate Demo Air", service: "AI 204", origin: "BLR", destination: "DEL", departure: "06:00", arrival: "08:45", price: 9800 },
  { type: "train", provider: "Indian Railways Demo", service: "Karnataka Sampark Kranti · 12649", origin: "BLR", destination: "DEL", departure: "13:50", arrival: "10:30", price: 2870 },
];
const normalize = (value: string) => cityCode[value.trim().toLowerCase()] ?? value.trim().toUpperCase();

export const handleJourneySearch: RequestHandler = (req, res) => {
  const origin = normalize(typeof req.query.origin === "string" ? req.query.origin : "");
  const destination = normalize(typeof req.query.destination === "string" ? req.query.destination : "");
  if (!origin || !destination) return res.json({ origin, destination, segments: [], capabilities: [] } satisfies JourneySearchResponse);
  const segments: JourneySegment[] = options.filter((option) => option.origin === origin && option.destination === destination).map((option, index) => ({ type: option.type as JourneyMode, provider: option.provider, serviceNumber: option.service, origin, destination, departure: option.departure, arrival: option.arrival, price: option.price, currency: "INR", status: "scheduled", bookingReference: `DEMO-${index + 1}` }));
  const capabilities: JourneySearchResponse["capabilities"] = ["flight", "train", "bus", "taxi", "metro"].map((type) => ({ type: type as JourneyMode, provider: "Demo Provider", configured: true, reason: "Demo provider data" }));
  res.json({ origin, destination, segments, capabilities } satisfies JourneySearchResponse);
};
