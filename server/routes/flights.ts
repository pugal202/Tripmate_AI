import { RequestHandler } from "express";
import { FlightSearchResponse } from "@shared/api";

let tokenCache: { value: string; expiresAt: number } | null = null;

async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("AMADEUS_NOT_CONFIGURED");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;
  const base = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
  const response = await fetch(`${base}/v1/security/oauth2/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }) });
  if (!response.ok) throw new Error("AMADEUS_AUTH_FAILED");
  const data = await response.json() as { access_token: string; expires_in: number };
  tokenCache = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export const handleFlightSearch: RequestHandler = async (req, res) => {
  const { origin, destination, departureDate, adults = "1", travelClass = "ECONOMY" } = req.query;
  if (![origin, destination, departureDate].every((value) => typeof value === "string" && value)) return res.status(400).json({ error: "origin, destination and departureDate are required.", code: "INVALID_SEARCH" });
  try {
    const token = await getAmadeusToken();
    const base = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
    const params = new URLSearchParams({ originLocationCode: origin as string, destinationLocationCode: destination as string, departureDate: departureDate as string, adults: String(adults), travelClass: String(travelClass), currencyCode: "INR", max: "20" });
    const response = await fetch(`${base}/v2/shopping/flight-offers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: "The flight provider could not return live offers.", code: "FLIGHT_PROVIDER_ERROR" });
    const data = await response.json() as { data: FlightSearchResponse["offers"] };
    return res.json({ offers: data.data ?? [], provider: "amadeus", testEnvironment: base.includes("test.") } satisfies FlightSearchResponse);
  } catch (error) {
    const code = error instanceof Error ? error.message : "FLIGHT_SEARCH_FAILED";
    if (code === "AMADEUS_NOT_CONFIGURED") return res.status(503).json({ error: "Flight provider temporarily unavailable.", code });
    return res.status(502).json({ error: "Unable to retrieve live flight availability right now. Please try again.", code: "FLIGHT_SEARCH_FAILED" });
  }
};

export const handleFlightRevalidate: RequestHandler = async (req, res) => {
  const offer = req.body?.offer;
  if (!offer || typeof offer !== "object" || typeof offer.id !== "string") return res.status(400).json({ error: "A provider flight offer is required.", code: "INVALID_OFFER" });
  try {
    const token = await getAmadeusToken();
    const base = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
    const response = await fetch(`${base}/v1/shopping/flight-offers/pricing`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/vnd.amadeus+json" }, body: JSON.stringify({ data: { type: "flight-offer-pricing", flightOffers: [offer] } }) });
    const data = await response.json() as any;
    if (!response.ok) return res.status(502).json({ error: data?.errors?.[0]?.detail ?? "The provider could not revalidate this offer.", code: "OFFER_REVALIDATION_FAILED" });
    return res.json({ revalidatedOffer: data.data?.flightOffers?.[0] ?? null, bookingRequired: true, providerConfirmed: false, message: "Offer revalidated. No booking order was submitted." });
  } catch (error) {
    const code = error instanceof Error ? error.message : "OFFER_REVALIDATION_FAILED";
    if (code === "AMADEUS_NOT_CONFIGURED") return res.status(503).json({ error: "Live flight revalidation is not configured.", code });
    return res.status(502).json({ error: "Unable to revalidate the provider offer.", code: "OFFER_REVALIDATION_FAILED" });
  }
};
