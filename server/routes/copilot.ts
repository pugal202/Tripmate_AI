import { RequestHandler } from "express";
import { AiResponse } from "@shared/api";

export const handleCopilot: RequestHandler = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const context = req.body?.context ?? {};
  if (!message) return res.status(400).json({ error: "A message is required.", code: "INVALID_MESSAGE" });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.json(ruleBasedAnswer(message, context));
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", input: [{ role: "system", content: "You are TripMate AI, a truthful enterprise travel copilot. Only use the supplied trip context. Never claim a booking, payment, availability, weather result, or provider action happened unless it is present in context. For actions, explain that approval and provider confirmation are required." }, { role: "user", content: `Trip context: ${JSON.stringify(context)}\nQuestion: ${message}` }] }) });
    if (!response.ok) return res.status(502).json({ error: "The AI provider is temporarily unavailable.", code: "AI_PROVIDER_ERROR" });
    const data = await response.json() as { output_text?: string };
    const result: AiResponse = { answer: data.output_text?.trim() || "I could not produce a response from the current trip context.", provider: "openai" };
    return res.json(result);
  } catch {
    return res.status(502).json({ error: "Unable to reach the AI provider right now.", code: "AI_NETWORK_ERROR" });
  }
};

function ruleBasedAnswer(message: string, context: Record<string, any>): AiResponse {
  const query = message.toLowerCase();
  const city = context.destination ?? "your destination";
  const answer = query.includes("weather") ? `I need a live weather result for ${city} before I can answer accurately. Open the Weather section to fetch it.` : query.includes("itinerary") ? `Your current itinerary contains ${context.bookingCount ?? 0} connected bookings. I can summarize details that are present in your trip state.` : "I can help search live services and explain your current trip, but no LLM key is configured. Connect OPENAI_API_KEY for richer contextual answers.";
  return { answer, provider: "rule-based" };
}
