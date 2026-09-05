export type JourneyOption = { id: string; mode: "flight" | "train" | "bus" | "taxi" | "metro"; provider: string; service: string; origin: string; destination: string; departureTime: string; arrivalTime: string; duration: string; price: number; availability: string; comfort: number };

export const journeyOptions: JourneyOption[] = [
  { id: "train-blr-bom-1", mode: "train", provider: "Indian Railways", service: "Udyan Express · 11302", origin: "BLR", destination: "BOM", departureTime: "20:45", arrivalTime: "10:25", duration: "13h 40m", price: 2140, availability: "Demo availability", comfort: 72 },
  { id: "train-bom-del-1", mode: "train", provider: "Indian Railways", service: "Mumbai Rajdhani · 12951", origin: "BOM", destination: "DEL", departureTime: "17:00", arrivalTime: "08:35", duration: "15h 35m", price: 3260, availability: "Demo availability", comfort: 82 },
  { id: "train-blr-del-1", mode: "train", provider: "Indian Railways", service: "Karnataka Sampark Kranti · 12649", origin: "BLR", destination: "DEL", departureTime: "13:50", arrivalTime: "10:30", duration: "20h 40m", price: 2870, availability: "Demo availability", comfort: 75 },
  { id: "train-hyd-bom-1", mode: "train", provider: "Indian Railways", service: "Konark Express · 11020", origin: "HYD", destination: "BOM", departureTime: "21:20", arrivalTime: "10:45", duration: "13h 25m", price: 1890, availability: "Demo availability", comfort: 70 },
  { id: "bus-blr-bom-1", mode: "bus", provider: "VRL Travels", service: "AC Sleeper", origin: "BLR", destination: "BOM", departureTime: "20:30", arrivalTime: "09:30", duration: "13h", price: 1850, availability: "12 demo seats", comfort: 60 },
  { id: "bus-bom-del-1", mode: "bus", provider: "IntrCity SmartBus", service: "AC Sleeper", origin: "BOM", destination: "DEL", departureTime: "18:00", arrivalTime: "19:00", duration: "25h", price: 2600, availability: "8 demo seats", comfort: 58 },
  { id: "metro-del-1", mode: "metro", provider: "Delhi Metro", service: "Airport Express", origin: "Delhi Airport", destination: "New Delhi", departureTime: "22:35", arrivalTime: "22:55", duration: "20m", price: 60, availability: "Demo service", comfort: 78 },
  { id: "taxi-del-1", mode: "taxi", provider: "Airport Cab", service: "Executive Sedan", origin: "Delhi Airport", destination: "Aerocity, New Delhi", departureTime: "22:30", arrivalTime: "22:50", duration: "20m", price: 850, availability: "Demo option", comfort: 90 },
  { id: "taxi-del-2", mode: "taxi", provider: "BluSmart", service: "Electric Sedan", origin: "Delhi Airport", destination: "Aerocity, New Delhi", departureTime: "22:35", arrivalTime: "23:00", duration: "25m", price: 720, availability: "Demo option", comfort: 88 },
  { id: "taxi-del-3", mode: "taxi", provider: "Ola", service: "Prime Sedan", origin: "Delhi Airport", destination: "Aerocity, New Delhi", departureTime: "22:30", arrivalTime: "22:55", duration: "25m", price: 680, availability: "Demo option", comfort: 76 },
];

export function getJourneyOptions(origin: string, destination: string) {
  const from = origin.toUpperCase();
  const to = destination.toUpperCase();
  return journeyOptions.filter((option) => option.origin.toUpperCase() === from && option.destination.toUpperCase() === to);
}
