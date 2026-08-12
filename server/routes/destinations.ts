import { RequestHandler } from "express";

export const handleDestinationSearch: RequestHandler = async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (!query) return res.status(400).json({ error: "A destination query is required.", code: "INVALID_QUERY" });
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
    if (!response.ok) return res.status(502).json({ error: "Destination search is temporarily unavailable.", code: "GEOCODING_UNAVAILABLE" });
    const data = await response.json() as { results?: Array<{ id: number; name: string; country: string; country_code: string; latitude: number; longitude: number; timezone: string; feature_code?: string }> };
    const results = (data.results ?? []).map((place) => ({ id: String(place.id), city: place.name, country: place.country, countryCode: place.country_code, latitude: place.latitude, longitude: place.longitude, timezone: place.timezone, featureCode: place.feature_code }));
    return res.json({ results, source: "open-meteo-geocoding" });
  } catch {
    return res.status(502).json({ error: "Unable to search destinations right now.", code: "NETWORK_ERROR" });
  }
};
