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
    if (code === "AMADEUS_NOT_CONFIGURED") return res.status(503).json({ error: "Live flight search is not configured. Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET on the server.", code });
    return res.status(502).json({ error: "Unable to retrieve live flight availability right now. Please try again.", code: "FLIGHT_SEARCH_FAILED" });
  }
};
