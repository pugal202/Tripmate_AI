import { RequestHandler } from "express";

const systemPrompt =
  "You are TripMate AI, an intelligent enterprise travel copilot. Give concise, useful and action-oriented travel guidance using the supplied journey context.";

export const handleChat: RequestHandler = async (req, res) => {
  const message =
    typeof req.body?.message === "string"
      ? req.body.message.trim()
      : "";

  const context =
    req.body?.context && typeof req.body.context === "object"
      ? req.body.context
      : {};

  if (!message) {
    return res.status(400).json({
      error: "Please enter a question for TripMate AI.",
    });
  }

  return res.json({
    ...ruleBasedAnswer(message, context),
    provider: "TripMate AI",
  });
};

function ruleBasedAnswer(
  message: string,
  context: Record<string, any>,
) {
  const query = message.toLowerCase();

  const disrupted = Boolean(context.journeyStatus?.disrupted);

  const flights =
    context.availableDemoData?.flights ?? [
      {
        flightNumber: "AI 482",
        price: "₹8,250",
        stops: "Non-stop",
        arrival: "10:35",
      },
      {
        flightNumber: "6E 531",
        price: "₹6,100",
        stops: "Non-stop",
        arrival: "10:00",
      },
      {
        flightNumber: "UK 945",
        price: "₹9,400",
        stops: "Non-stop",
        arrival: "13:35",
      },
    ];

  let answer =
    "I can help you understand your current journey, flight options, meeting risk, hotels and travel plans.";

  if (
    query.includes("delay") ||
    query.includes("risk") ||
    query.includes("what should i do")
  ) {
    answer = disrupted
  ? "Your current flight is AI 482. Its scheduled time is 06:30–08:20 IST with a duration of 1h 50m. It is currently delayed by 2h 15m, so the journey is at risk."
  : "Your current flight is AI 482 from Bengaluru to Mumbai. It departs at 06:30 IST and arrives at 08:20 IST, with a duration of 1h 50m.";
  } else if (
    query.includes("alternative") ||
    query.includes("another flight") ||
    query.includes("best flight")
  ) {
    answer =
      `I found ${flights.length} available flight options. ` +
      flights
        .map(
          (flight: any, index: number) =>
            `${index + 1}. ${flight.flightNumber} — ${flight.price} — ${flight.stops} — arrival ${flight.arrival}`,
        )
        .join("; ") +
      ". I recommend the earliest option because it gives you the best protection for your business meeting.";
  } else if (
    query.includes("cheaper") ||
    query.includes("option b")
  ) {
    answer =
      "The cheaper option saves money, but its later arrival creates more risk for your 09:00 Delhi meeting. Since your preference is TIME > COMFORT > PRICE, I recommend the earlier flight.";
  } else if (query.includes("hotel")) {
    answer =
      "Andaz Delhi Aerocity is the recommended hotel near your Delhi meeting location. It provides convenient access to the meeting area.";
  } else if (
    query.includes("meeting") ||
    query.includes("who am i meeting")
  ) {
    answer =
      "You are meeting Sarah Mitchell, VP of Enterprise Partnerships at Enterprise Client, at 09:00 in the Aerocity, New Delhi Business Center. The topic is Travel Intelligence Platform Integration.";
  } else if (
    query.includes("current flight") ||
    query.includes("flight time")
  ) {
    answer = disrupted
      ? "Your current flight is AI 482. It is delayed by 2h 15m, so the journey is currently at risk."
      : "Your current flight is AI 482 from Bengaluru to Mumbai. It departs at 06:30 IST and arrives at 08:20 IST, with a duration of 1h 50m.";
  } else if (
    query.includes("summarize") ||
    query.includes("my trip") ||
    query.includes("trip")
  ) {
    answer =
      `Your business journey is Bengaluru → Mumbai → Delhi with a 09:00 meeting in Delhi. ` +
      (disrupted
        ? "AI 482 is currently delayed, creating connection and meeting risk."
        : "Your journey is currently being monitored.");
  } else if (
    query.includes("recommend") ||
    query.includes("what do you recommend")
  ) {
    answer =
      "I recommend the earliest alternative flight because protecting your 09:00 business meeting is more important than saving a small amount on the fare.";
  }

  return {
    answer,
    action: actionFor(message, context),
  };
}

function actionFor(
  message: string,
  context: Record<string, any>,
) {
  const query = message.toLowerCase();

  if (
    query.includes("alternative") ||
    query.includes("cheaper") ||
    query.includes("option")
  ) {
    return {
      type: "compare-alternatives",
      label: "Compare Alternatives",
      requiresConfirmation: false,
    };
  }

  if (query.includes("hotel")) {
    return {
      type: "view-hotels",
      label: "View Hotels",
      requiresConfirmation: false,
    };
  }

  if (
    query.includes("meeting") ||
    query.includes("miss") ||
    (context.journeyStatus?.disrupted &&
      (query.includes("delay") || query.includes("risk")))
  ) {
    return {
      type: "view-journey-impact",
      label: "View Journey Impact",
      requiresConfirmation: false,
    };
  }

  return undefined;
}