import { RequestHandler } from "express";

const systemPrompt = `You are TripMate AI, an intelligent enterprise travel copilot. Use the supplied traveler profile, journey, flight, hotel, meeting, transport, dining and policy context. Prioritize safety and journey feasibility, important commitments, traveler preferences, comfort, then cost. Be concise, useful and action-oriented. Explain why recommendations fit the traveler. Never claim an action was booked, cancelled, rebooked or purchased unless a real provider confirmation is present. Treat simulated and demo records as demo data. Do not invent unavailable information; state uncertainty clearly. Understand follow-up questions from the conversation history.`;

export const handleChat: RequestHandler = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const context = req.body?.context && typeof req.body.context === "object" ? req.body.context : {};
  const history = Array.isArray(req.body?.history) ? req.body.history.filter((item: any) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string").slice(-10) : [];

  if (!message) return res.status(400).json({ error: "Please enter a question for TripMate AI.", code: "INVALID_MESSAGE" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.json({ ...ruleBasedAnswer(message, context),  });

  try {
    const input = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: `TripMate context:\n${JSON.stringify(context)}\n\nQuestion:\n${message}` },
    ];
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", input }),
    });
    const data = await response.json() as { output_text?: string; error?: { message?: string } };
    if (!response.ok) return res.json({ ...ruleBasedAnswer(message, context),  });
    const answer = data.output_text?.trim();
    if (!answer) return res.json({ ...ruleBasedAnswer(message, context),  });
    return res.json({ answer, provider: "openai", action: actionFor(message, context) });
  } catch {
    return res.json({ ...ruleBasedAnswer(message, context),  });
  }
};

function ruleBasedAnswer(message: string, context: Record<string, any>) {
  const query = message.toLowerCase();
  const disrupted = Boolean(context.journeyStatus?.disrupted);
  const flights = context.availableDemoData?.flights ?? [
    { flightNumber: "AI 482", price: "₹8,250", stops: "Non-stop", arrival: "10:35" },
    { flightNumber: "6E 531", price: "₹6,100", stops: "Non-stop", arrival: "10:00" },
    { flightNumber: "UK 945", price: "₹9,400", stops: "Non-stop", arrival: "13:35" },
  ];
  let answer = "I can explain the current TripMate journey, compare the demo recovery options, or help you review the meeting, hotel and travel policy context.";

  if (query.includes("delay") || query.includes("risk") || query.includes("what should i do")) {
    answer = disrupted
      ? "Your AI 482 flight is delayed by 2h 15m. This reduces your Mumbai connection buffer to 55 minutes and puts your 09:00 Delhi meeting at risk. I found 3 demo alternatives; based on your preference for protecting business commitments, I recommend Option A. Would you like me to compare the alternatives?"
      : "Your current journey is being monitored. The Mumbai connection is the key dependency before the 09:00 Delhi business meeting. Open Journey Intelligence to run the disruption simulation and see the full impact analysis.";
  } else if (query.includes("cheaper") || query.includes("option b")) {
    answer = "Option B saves ₹6,100 versus the early alternative, but arrival moves to 09:20. That puts your 09:00 meeting in Delhi at risk. Your traveler profile prioritizes business commitments over minimizing cost, so I recommend the earlier option.";
  } else if (query.includes("alternative") || query.includes("another flight") || query.includes("best flight")) {
    answer = `I found ${flights.length} demo alternatives ranked for your business commitment: ${flights.map((flight: any, index: number) => `${index + 1}. ${flight.flightNumber} — ${flight.price} — ${flight.stops} — ${flight.arrival}`).join("; ")} . I recommend ${flights[0].flightNumber} because it protects your 09:00 meeting.`;
  } else if (query.includes("hotel")) {
    answer = "The demo hotel closest to the meeting is Andaz Delhi Aerocity, rated 4.8 and 0.8 km from the Aerocity business center. Availability and booking confirmation still require a configured hotel provider.";
  } else if (query.includes("meeting") || query.includes("who am i meeting")) {
    answer = "You are meeting Sarah Mitchell, VP of Enterprise Partnerships at Enterprise Client, at 09:00 in the Aerocity, New Delhi Business Center. The topic is Travel Intelligence Platform Integration.";
  } else if (query.includes("summarize") || query.includes("trip")) {
    answer = `This is a ${context.traveler?.purpose ?? "business"} journey for ${context.traveler?.name ?? "Pugal"}: Bengaluru → Mumbai → Delhi, with a 09:00 Delhi meeting and a confirmed hotel. ${disrupted ? "The current demo disruption puts the Mumbai connection and Delhi meeting at risk." : "The journey is currently being monitored with a potential connection risk."}`;
  } else if (query.includes("recommend")) {
    answer = "I recommend Option A, the early alternative. It scores 94/100, protects the meeting, keeps the hotel unchanged and matches your TIME > COMFORT > PRICE preference. This is a demo recommendation; provider revalidation and approval are still required.";
  }

  return { answer, provider: "rule-based", action: actionFor(message, context) };
}

function actionFor(message: string, context: Record<string, any>) {
  const query = message.toLowerCase();
  if (query.includes("alternative") || query.includes("cheaper") || query.includes("option")) return { type: "compare-alternatives", label: "Compare Alternatives", requiresConfirmation: false };
  if (query.includes("hotel")) return { type: "view-hotels", label: "View Hotels", requiresConfirmation: false };
  if (query.includes("meeting") || query.includes("miss")) return { type: "view-journey-impact", label: "View Journey Impact", requiresConfirmation: false };
  if (context.journeyStatus?.disrupted && (query.includes("delay") || query.includes("risk"))) return { type: "view-journey-impact", label: "View Journey Impact", requiresConfirmation: false };
  return undefined;
}
