import { airportByCode } from "@/data/airports";
import { demoFlightDatabase } from "@/data/flights";

export type FlightSearchForm = { origin: string; destination: string; departureDate: string; returnDate?: string; travelers: number; cabin: string };
export type FlightSearchResult = { id: string; airline: string; flightNumber: string; origin: string; destination: string; departureTime: string; arrivalTime: string; duration: string; stops: string; price: number; currency: "INR"; cabin: string; baggage: string; score: number; recommendationReason: string; highlights: string[]; provider: "amadeus" | "demo"; rawOffer?: unknown };

const formatTime = (value: string) => new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
const formatDuration = (value: string) => value.replace("PT", "").replace("H", "h ").replace("M", "m").trim();
const label = (code: string) => { const airport = airportByCode(code); return airport ? `${code} · ${airport.city}` : code; };

const demoFlights = (form: FlightSearchForm): FlightSearchResult[] => demoFlightDatabase
  .filter((flight) => flight.originAirport === form.origin.toUpperCase() && flight.destinationAirport === form.destination.toUpperCase())
  .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
  .map((flight, index) => ({
    id: `demo-${flight.id}`,
    airline: flight.airline,
    flightNumber: flight.flightNumber,
    origin: label(flight.originAirport),
    destination: label(flight.destinationAirport),
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    duration: flight.duration,
    stops: flight.stops,
    price: flight.price * Math.max(form.travelers, 1),
    currency: "INR",
    cabin: form.cabin === "BUSINESS" ? "Business" : "Economy",
    baggage: flight.baggage,
    score: Math.max(70, 96 - index * 7 - (flight.delayMinutes ? 12 : 0)),
    recommendationReason: index === 0 ? "Earliest available demo option, ranked to protect time for your connected business journey." : "A demo alternative ranked against your TIME > COMFORT > PRICE preferences.",
    highlights: ["Demo provider", flight.stops, `${flight.seatAvailability} demo seats`, "INR fare"],
    provider: "demo",
  }));

const mapAmadeusOffer = (offer: any, form: FlightSearchForm): FlightSearchResult => {
  const itinerary = offer.itineraries?.[0];
  const segments = itinerary?.segments ?? [];
  const first = segments[0];
  const last = segments[segments.length - 1] ?? first;
  const stops = Math.max(segments.length - 1, 0);
  return { id: offer.id, airline: offer.validatingAirlineCodes?.[0] ?? "Provider airline", flightNumber: first ? `${first.carrierCode} ${first.number}` : "Provider offer", origin: label(first?.departure?.iataCode ?? form.origin), destination: label(last?.arrival?.iataCode ?? form.destination), departureTime: first?.departure?.at ? formatTime(first.departure.at) : "—", arrivalTime: last?.arrival?.at ? formatTime(last.arrival.at) : "—", duration: itinerary?.duration ? formatDuration(itinerary.duration) : "—", stops: stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`, price: Number.parseFloat(offer.price?.total ?? "0"), currency: "INR", cabin: form.cabin === "BUSINESS" ? "Business" : "Economy", baggage: "Provider allowance", score: 88 - stops * 8, recommendationReason: "Provider offer ranked against your meeting priority, cabin and stop preferences.", highlights: [stops === 0 ? "Non-stop" : `${stops} stop`, "Provider availability", "Traveler preferences applied"], provider: "amadeus", rawOffer: offer };
};

export async function searchFlights(form: FlightSearchForm): Promise<{ results: FlightSearchResult[]; provider: "amadeus" | "demo"; fallback: boolean }> {
  const params = new URLSearchParams({ origin: form.origin, destination: form.destination, departureDate: form.departureDate, adults: String(form.travelers), travelClass: form.cabin });
  try {
    const response = await fetch(`/api/flights/search?${params}`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.offers) || data.offers.length === 0) throw new Error("FLIGHT_PROVIDER_UNAVAILABLE");
    return { results: data.offers.map((offer: any) => mapAmadeusOffer(offer, form)), provider: "amadeus", fallback: false };
  } catch {
    return { results: demoFlights(form), provider: "demo", fallback: true };
  }
}
