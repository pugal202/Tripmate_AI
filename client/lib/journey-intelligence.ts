export type JourneyPreferenceContext = {
  priority: "TIME > COMFORT > PRICE" | string;
  meetingTime: string;
  meetingPriority: string;
};

export type JourneyImpact = {
  originalArrival: string;
  delayedArrival: string;
  nextConnection: string;
  connectionBuffer: number;
  delhiArrival: string;
  meetingStart: string;
  connectionRisk: number;
  meetingRisk: number;
  hotelImpact: "LOW" | "MEDIUM" | "HIGH";
  budgetImpact: "LOW" | "MEDIUM" | "HIGH";
  health: number;
  overallRisk: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
};

export const recoveryOptions = {
  A: { label: "EARLY ALTERNATIVE", title: "Option A", cost: "+₹8,200", arrival: "07:40", connection: "SAFE", meeting: "PROTECTED", hotel: "UNCHANGED", score: 94, assessment: "Protects the meeting with the strongest arrival buffer." },
  B: { label: "LOWER COST", title: "Option B", cost: "+₹2,100", arrival: "09:20", connection: "SAFE", meeting: "AT RISK", hotel: "UNCHANGED", score: 78, assessment: "Lower financial cost, but increased risk to the business meeting." },
  C: { label: "KEEP CURRENT ITINERARY", title: "Option C", cost: "+₹0", arrival: "12:10", connection: "FAILED", meeting: "MISSED", hotel: "UNCHANGED", score: 42, assessment: "No additional fare, but the current delay misses the meeting." },
} as const;

const toMinutes = (value: string) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };
const toTime = (minutes: number) => `${String(Math.floor((minutes % 1440) / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function calculateJourneyImpact(delayMinutes: number, preferences: JourneyPreferenceContext): JourneyImpact {
  const originalArrival = "10:35";
  const delayedArrival = toTime(toMinutes(originalArrival) + delayMinutes);
  const nextConnection = "12:00";
  const connectionBuffer = toMinutes(nextConnection) - toMinutes(delayedArrival);
  const connectionRisk = delayMinutes === 0 ? 22 : Math.min(98, 68 + Math.max(0, delayMinutes - 135) / 3);
  const meetingRisk = delayMinutes === 0 ? 32 : Math.min(98, 74 + Math.max(0, delayMinutes - 135) / 4);
  const health = delayMinutes === 0 ? 72 : Math.max(20, 100 - Math.round((connectionRisk + meetingRisk) / 2));
  const overallRisk = delayMinutes === 0 ? "MEDIUM" : "HIGH";
  return {
    originalArrival,
    delayedArrival,
    nextConnection,
    connectionBuffer,
    delhiArrival: delayMinutes === 0 ? "14:10" : "16:25",
    meetingStart: preferences.meetingTime,
    connectionRisk: Math.round(connectionRisk),
    meetingRisk: Math.round(meetingRisk),
    hotelImpact: "LOW",
    budgetImpact: delayMinutes === 0 ? "LOW" : "MEDIUM",
    health,
    overallRisk,
    explanation: delayMinutes === 0 ? "The Mumbai connection is the key dependency before the 09:00 Delhi business meeting." : `AI 482 was due to arrive in Mumbai at ${originalArrival} and now arrives at ${delayedArrival}. The ${Math.max(connectionBuffer, 0)} minute connection buffer is insufficient for the ${nextConnection} Mumbai → Delhi connection, putting the ${preferences.meetingTime} Delhi meeting at risk.`,
  };
}
