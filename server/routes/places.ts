import { RequestHandler } from "express";
import { PlacesSearchResponse } from "@shared/api";

export const handlePlacesSearch: RequestHandler = async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (!query) return res.status(400).json({ error: "A place query is required.", code: "INVALID_QUERY" });
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) return res.status(503).json({ error: "Live place search is not configured. Add GOOGLE_MAPS_SERVER_KEY on the server.", code: "GOOGLE_NOT_CONFIGURED" });
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey, "x-goog-fieldmask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types,places.currentOpeningHours" }, body: JSON.stringify({ textQuery: query, languageCode: "en" }) });
    if (!response.ok) return res.status(502).json({ error: "Google Places could not return live results.", code: "PLACES_PROVIDER_ERROR" });
    const data = await response.json() as { places?: any[] };
    const places = (data.places ?? []).map((place) => ({ id: place.id, name: place.displayName?.text ?? "Unnamed place", address: place.formattedAddress ?? "Address unavailable", rating: place.rating, types: place.types ?? [], location: { latitude: place.location?.latitude, longitude: place.location?.longitude }, openNow: place.currentOpeningHours?.openNow }));
    return res.json({ places, provider: "google-places" } satisfies PlacesSearchResponse);
  } catch {
    return res.status(502).json({ error: "Unable to retrieve live places right now. Please try again.", code: "NETWORK_ERROR" });
  }
};
