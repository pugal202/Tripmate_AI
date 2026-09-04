export type FlightSearchForm = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  travelers: number;
  cabin: string;
};

export type FlightSearchResult = {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: string;
  price: number;
  currency: string;
  cabin: string;
  baggage: string;
  score: number;
  recommendationReason: string;
  highlights: string[];
  provider: "amadeus" | "demo";
  rawOffer?: unknown;
};

const airportNames: Record<string, string> = {
  BLR: "Bengaluru",
  MAA: "Chennai",
  DEL: "Delhi",
  BOM: "Mumbai",
  HYD: "Hyderabad",
  LHR: "London",
  FRA: "Frankfurt",
  SIN: "Singapore",
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDuration = (value: string) =>
  value.replace("PT", "").replace("H", "h ").replace("M", "m").trim();

const demoFlights = (form: FlightSearchForm): FlightSearchResult[] => {
  const origin = form.origin.toUpperCase();
  const destination = form.destination.toUpperCase();
  const originName = airportNames[origin] ?? origin;
  const destinationName = airportNames[destination] ?? destination;
  const date = form.departureDate;
  const options = [
    { airline: "IndiGo", flightNumber: "6E 6114", departure: "06:30", arrival: "07:35", duration: "1h 05m", stops: "Non-stop", price: 5840, score: 96, reason: "Matches your preferred morning departure and lowest acceptable travel time." },
    { airline: "Air India", flightNumber: "AI 571", departure: "08:10", arrival: "09:20", duration: "1h 10m", stops: "Non-stop", price: 6420, score: 92, reason: "Strong meeting fit with a preferred airline and a nonstop itinerary." },
    { airline: "Vistara", flightNumber: "UK 839", departure: "11:45", arrival: "12:55", duration: "1h 10m", stops: "Non-stop", price: 7190, score: 84, reason: "Comfortable timing with a flexible fare and nonstop travel." },
  ];

  return options.map((option, index) => ({
    id: `demo-${origin}-${destination}-${index + 1}`,
    airline: option.airline,
    flightNumber: option.flightNumber,
    origin: `${origin} · ${originName}`,
    destination: `${destination} · ${destinationName}`,
    departureTime: formatTime(`${date}T${option.departure}:00`),
    arrivalTime: formatTime(`${date}T${option.arrival}:00`),
    duration: option.duration,
    stops: option.stops,
    price: option.price * Math.max(form.travelers, 1),
    currency: "INR",
    cabin: form.cabin === "BUSINESS" ? "Business" : "Economy",
    baggage: "1 checked bag",
    score: option.score,
    recommendationReason: option.reason,
    highlights: ["Morning departure", "Non-stop", "Fits your budget", "Matches your travel preferences"].slice(0, index === 2 ? 3 : 4),
    provider: "demo",
  }));
};

const mapAmadeusOffer = (offer: any, form: FlightSearchForm): FlightSearchResult => {
  const itinerary = offer.itineraries?.[0];
  const segments = itinerary?.segments ?? [];
  const first = segments[0];
  const last = segments[segments.length - 1] ?? first;
  const stops = Math.max(segments.length - 1, 0);
  const price = Number.parseFloat(offer.price?.total ?? "0");
  return {
    id: offer.id,
    airline: offer.validatingAirlineCodes?.[0] ?? offer.airlineCodes?.[0] ?? "Provider airline",
    flightNumber: first ? `${first.carrierCode} ${first.number}` : "Provider offer",
    origin: first?.departure?.iataCode ?? form.origin,
    destination: last?.arrival?.iataCode ?? form.destination,
    departureTime: first?.departure?.at ? formatTime(first.departure.at) : "—",
    arrivalTime: last?.arrival?.at ? formatTime(last.arrival.at) : "—",
    duration: itinerary?.duration ? formatDuration(itinerary.duration) : "—",
    stops: stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`,
    price,
    currency: offer.price?.currency ?? "INR",
    cabin: form.cabin === "BUSINESS" ? "Business" : "Economy",
    baggage: "Provider allowance",
    score: 88 - stops * 8,
    recommendationReason: stops === 0 ? "Nonstop routing protects your meeting buffer and matches your travel preferences." : "Ranked against your meeting priority, cabin and stop preferences.",
    highlights: [stops === 0 ? "Non-stop" : `${stops} stop`, "Provider availability", "Traveler preferences applied"],
    provider: "amadeus",
    rawOffer: offer,
  };
};

export async function searchFlights(form: FlightSearchForm): Promise<{ results: FlightSearchResult[]; provider: "amadeus" | "demo"; fallback: boolean }> {
  const params = new URLSearchParams({
    origin: form.origin,
    destination: form.destination,
    departureDate: form.departureDate,
    adults: String(form.travelers),
    travelClass: form.cabin,
  });

  try {
    const response = await fetch(`/api/flights/search?${params}`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.offers) || data.offers.length === 0) throw new Error("FLIGHT_PROVIDER_UNAVAILABLE");
    return { results: data.offers.map((offer: any) => mapAmadeusOffer(offer, form)), provider: "amadeus", fallback: false };
  } catch {
    return { results: demoFlights(form), provider: "demo", fallback: true };
  }
}
