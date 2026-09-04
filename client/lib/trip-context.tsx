import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { JourneySegment } from "@shared/api";

export type AutoRebookPreferences = {
  enabled: boolean;
  maxAdditionalPrice: number;
  maxTravelTime: number;
  preferredAirlines: string;
  cabin: string;
  maxStops: string;
  departureWindow: string;
  meetingPriority: string;
  seatPreference: string;
  baggage: string;
  refundPreference: string;
};

export type TripContext = {
  traveler: { name: string; tripType: string; loyalty: string; preferences: string[]; budget: number };
  origin: { city: string; country: string; code: string };
  destination: { city: string; country: string; countryCode: string; latitude: number; longitude: number; timezone: string; code?: string };
  dates: { departure: string; return: string };
  startDate: string;
  endDate: string;
  travelers: number;
  purpose: string;
  budget: number;
  timezone: "Asia/Kolkata";
  currency: "INR";
  journey: { origin: string; stops: string[]; destination: string };
  airports: { origin: string; connection: string; destination: string };
  meeting: { name: string; person: string; designation: string; company: string; topic: string; location: string; latitude: number; longitude: number; time: string; startTime: string; endTime: string; priority: string };
  segments: JourneySegment[];
  selectedFlight?: string;
  selectedHotel?: { name: string; latitude?: number; longitude?: number };
  selectedRestaurant?: { name: string; latitude?: number; longitude?: number };
};

export const defaultPreferences: AutoRebookPreferences = {
  enabled: false,
  maxAdditionalPrice: 5000,
  maxTravelTime: 3,
  preferredAirlines: "Air India, IndiGo, Vistara",
  cabin: "ECONOMY",
  maxStops: "0",
  departureWindow: "06:00 – 12:00",
  meetingPriority: "High",
  seatPreference: "Window",
  baggage: "1 checked bag",
  refundPreference: "Refundable / flexible",
};

export const activeTrip: TripContext = {
  traveler: { name: "Pugal", tripType: "Business", loyalty: "Air India Gold", preferences: ["TIME", "COMFORT", "PRICE"], budget: 80000 },
  origin: { city: "Bengaluru", country: "India", code: "BLR" },
  destination: { city: "Delhi", country: "India", countryCode: "IN", latitude: 28.5562, longitude: 77.1, timezone: "Asia/Kolkata", code: "DEL" },
  dates: { departure: "2026-10-20", return: "2026-10-26" },
  startDate: "2026-10-20",
  endDate: "2026-10-26",
  travelers: 1,
  purpose: "Business meeting",
  budget: 80000,
  timezone: "Asia/Kolkata",
  currency: "INR",
  journey: { origin: "Bengaluru", stops: ["Mumbai"], destination: "Delhi" },
  airports: { origin: "BLR", connection: "BOM", destination: "DEL" },
  meeting: { name: "Sarah Mitchell · Aerocity, New Delhi", person: "Sarah Mitchell", designation: "VP Enterprise Partnerships", company: "Enterprise Client", topic: "Travel Intelligence Platform Integration", location: "Aerocity, New Delhi", latitude: 28.552, longitude: 77.089, time: "09:00", startTime: "09:00", endTime: "10:00", priority: "HIGH" },
  segments: [
    { type: "flight", provider: "Air India", serviceNumber: "AI 482", origin: "Bengaluru", destination: "Mumbai", departure: "08:40", arrival: "10:35", status: "on_time", terminal: "2", bookingReference: "TRIPMATE-DEMO" },
    { type: "flight", provider: "Air India", serviceNumber: "AI 618", origin: "Mumbai", destination: "Delhi", departure: "20:00", arrival: "22:10", status: "scheduled" },
    { type: "taxi", provider: "Airport Cab", serviceNumber: "AC 204", origin: "Delhi Airport", destination: "Aerocity, New Delhi", departure: "22:30", arrival: "22:50", status: "scheduled" },
    { type: "walking", provider: "Airport walkway", origin: "Aerocity Hotel", destination: "Business Center", departure: "08:30", arrival: "08:40", status: "scheduled" },
  ],
  selectedFlight: "AI 482",
  selectedHotel: { name: "Andaz Delhi Aerocity", latitude: 28.552, longitude: 77.089 },
};

export const demoFlights = [
  { airline: "Air India", code: "AI 482", route: "Bengaluru → Mumbai", depart: "08:40", arrive: "10:35", duration: "1h 55m", price: "₹8,250", tag: "Best for connection" },
  { airline: "IndiGo", code: "6E 531", route: "Mumbai → Delhi", depart: "20:00", arrive: "22:10", duration: "2h 10m", price: "₹6,100", tag: "Connected segment" },
  { airline: "Vistara", code: "UK 945", route: "Bengaluru → Mumbai", depart: "11:45", arrive: "13:35", duration: "1h 50m", price: "₹9,400", tag: "Comfort option" },
];

export const demoHotels = [
  { name: "Andaz Delhi Aerocity", rating: "4.8", distance: "0.8 km from meeting", price: "₹8,500", tag: "Best match" },
  { name: "Pullman New Delhi Aerocity", rating: "4.7", distance: "1.1 km from meeting", price: "₹9,200", tag: "Business friendly" },
  { name: "Taj Palace, Delhi", rating: "4.9", distance: "7.4 km from meeting", price: "₹12,400", tag: "Premium stay" },
];

export const demoRestaurants = [
  { name: "Cafe Delhi Heights", cuisine: "Indian · Vegetarian", rating: "4.8", distance: "0.6 km from hotel", price: "₹₹", tag: "Quick dinner" },
  { name: "Indian Accent", cuisine: "Modern Indian", rating: "4.7", distance: "1.2 km from meeting", price: "₹₹₹", tag: "Client dinner" },
  { name: "Punjab Grill Aerocity", cuisine: "North Indian", rating: "4.6", distance: "0.4 km from hotel", price: "₹₹₹", tag: "Business suitable" },
];

export const demoTransport = [
  { provider: "Airport Cab", route: "Delhi Airport → Aerocity", time: "22:30", price: "₹850", status: "Demo scheduled" },
  { provider: "Ola", route: "Mumbai Airport → Hotel", time: "18:20", price: "₹720", status: "Demo option" },
  { provider: "BluSmart", route: "Bengaluru Airport → Airport", time: "06:00", price: "₹980", status: "Demo option" },
];

export const demoExpenses = [
  ["Flights", "₹12,500", "16%"], ["Hotel", "₹8,500", "11%"], ["Transport", "₹1,200", "2%"], ["Dining", "₹1,500", "2%"],
] as const;

export const demoNotifications = [
  ["Flight confirmed", "AI 482 is confirmed for 20 Oct at 08:40 IST.", "08:42"],
  ["Hotel selected", "Andaz Delhi Aerocity is selected near the 09:00 meeting.", "08:20"],
  ["Transfer scheduled", "Airport Cab meets you at Delhi arrivals at 22:30 IST.", "Yesterday"],
  ["Meeting reminder", "Sarah Mitchell meeting begins 21 Oct at 09:00 IST.", "Yesterday"],
] as const;

export const demoPolicy = "Protect high-priority business meetings; prefer time and feasibility over lowest fare.";

type TripContextValue = { activeTrip: TripContext; setActiveTrip: (trip: TripContext) => void; preferences: AutoRebookPreferences; setPreferences: (preferences: AutoRebookPreferences) => void; demo: { flights: typeof demoFlights; hotels: typeof demoHotels; restaurants: typeof demoRestaurants; transport: typeof demoTransport; expenses: typeof demoExpenses; notifications: typeof demoNotifications; policy: string } };
const TripContextProvider = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [currentTrip, setCurrentTrip] = useState<TripContext>(() => { try { const stored = window.localStorage.getItem("tripmate-trip"); const parsed = stored ? JSON.parse(stored) : null; return parsed?.airports?.origin === "BLR" && parsed?.airports?.connection === "BOM" && parsed?.airports?.destination === "DEL" ? { ...activeTrip, ...parsed } : activeTrip; } catch { return activeTrip; } });
  const [preferences, setPreferencesState] = useState<AutoRebookPreferences>(() => { try { const stored = window.localStorage.getItem("tripmate-preferences"); return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences; } catch { return defaultPreferences; } });
  const setActiveTrip = (next: TripContext) => { setCurrentTrip(next); window.localStorage.setItem("tripmate-trip", JSON.stringify(next)); };
  const setPreferences = (next: AutoRebookPreferences) => { setPreferencesState(next); window.localStorage.setItem("tripmate-preferences", JSON.stringify(next)); };
  const value = useMemo(() => ({ activeTrip: currentTrip, setActiveTrip, preferences, setPreferences, demo: { flights: demoFlights, hotels: demoHotels, restaurants: demoRestaurants, transport: demoTransport, expenses: demoExpenses, notifications: demoNotifications, policy: demoPolicy } }), [currentTrip, preferences]);
  return <TripContextProvider.Provider value={value}>{children}</TripContextProvider.Provider>;
}

export function useTripContext() {
  const value = useContext(TripContextProvider);
  if (!value) throw new Error("useTripContext must be used inside TripProvider");
  return value;
}
