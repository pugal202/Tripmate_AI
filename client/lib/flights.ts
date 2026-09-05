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
  BOM: "Mumbai",
  DEL: "Delhi",
  HYD: "Hyderabad",
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

const formatDuration = (value: string) =>
  value.replace("PT", "").replace("H", "h ").replace("M", "m").trim();

const demoFlights = (form: FlightSearchForm): FlightSearchResult[] => {
  const origin = form.origin.toUpperCase();
  const destination = form.destination.toUpperCase();
  const originName = airportNames[origin] ?? origin;
  const destinationName = airportNames[destination] ?? destination;
  const date = form.departureDate;
  const routeOptions: Record<string, Array<{ airline: string; flightNumber: string; departure: string; arrival: string; duration: string; stops: string; price: number; score: number; reason: string }>> = {
    "BLR-BOM": [{ airline: "Air India", flightNumber: "AI 482", departure: "06:30", arrival: "08:20", duration: "1h 50m", stops: "Non-stop", price: 8250, score: 96, reason: "Protects the Mumbai connection with the earliest nonstop departure." }, { airline: "IndiGo", flightNumber: "6E 531", departure: "08:10", arrival: "10:00", duration: "1h 50m", stops: "Non-stop", price: 6100, score: 89, reason: "Lower fare with a reliable nonstop route between Bengaluru and Mumbai." }, { airline: "Vistara", flightNumber: "UK 945", departure: "11:45", arrival: "13:35", duration: "1h 50m", stops: "Non-stop", price: 9400, score: 84, reason: "Comfortable timing with a flexible fare." }],
    "BLR-DEL": [{ airline: "Air India", flightNumber: "AI 204", departure: "06:00", arrival: "08:45", duration: "2h 45m", stops: "Non-stop", price: 9800, score: 95, reason: "Earliest nonstop arrival for a Delhi business meeting." }, { airline: "IndiGo", flightNumber: "6E 204", departure: "08:30", arrival: "11:15", duration: "2h 45m", stops: "Non-stop", price: 7200, score: 86, reason: "Balanced price and nonstop travel." }, { airline: "Vistara", flightNumber: "UK 811", departure: "14:20", arrival: "17:05", duration: "2h 45m", stops: "Non-stop", price: 8800, score: 78, reason: "Afternoon alternative with a flexible fare." }],
    "BLR-HYD": [{ airline: "IndiGo", flightNumber: "6E 6318", departure: "06:40", arrival: "07:50", duration: "1h 10m", stops: "Non-stop", price: 4800, score: 93, reason: "Fastest nonstop option." }],
    "BOM-DEL": [{ airline: "Air India", flightNumber: "AI 618", departure: "20:00", arrival: "22:10", duration: "2h 10m", stops: "Non-stop", price: 8200, score: 96, reason: "Protects the Delhi meeting with a dependable nonstop connection." }, { airline: "IndiGo", flightNumber: "6E 518", departure: "21:10", arrival: "23:20", duration: "2h 10m", stops: "Non-stop", price: 6100, score: 82, reason: "Lower cost while keeping a nonstop route." }],
    "BOM-BLR": [{ airline: "Vistara", flightNumber: "UK 866", departure: "07:00", arrival: "08:40", duration: "1h 40m", stops: "Non-stop", price: 7600, score: 91, reason: "Early nonstop return option." }],
    "DEL-BLR": [{ airline: "Air India", flightNumber: "AI 803", departure: "07:15", arrival: "10:00", duration: "2h 45m", stops: "Non-stop", price: 9200, score: 92, reason: "Strong morning schedule for business travel." }],
    "DEL-BOM": [{ airline: "IndiGo", flightNumber: "6E 531", departure: "06:30", arrival: "08:35", duration: "2h 05m", stops: "Non-stop", price: 6800, score: 94, reason: "Fastest value option between Delhi and Mumbai." }],
    "HYD-DEL": [{ airline: "Air India", flightNumber: "AI 542", departure: "06:20", arrival: "08:40", duration: "2h 20m", stops: "Non-stop", price: 7900, score: 92, reason: "Morning arrival for a Delhi business commitment." }],
  };
  const options = routeOptions[`${origin}-${destination}`] ?? routeOptions["BLR-BOM"];

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
