import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleWeather } from "./routes/weather";
import { handleFlightSearch, handleFlightRevalidate } from "./routes/flights";
import { handlePlacesSearch } from "./routes/places";
import { handleProviderStatus } from "./routes/providers";
import { handleCopilot } from "./routes/copilot";
import { handleDestinationSearch } from "./routes/destinations";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/weather", handleWeather);
  app.get("/api/flights/search", handleFlightSearch);
  app.post("/api/flights/revalidate", handleFlightRevalidate);
  app.get("/api/places/search", handlePlacesSearch);
  app.get("/api/providers", handleProviderStatus);
  app.post("/api/copilot", handleCopilot);
  app.get("/api/destinations/search", handleDestinationSearch);

  return app;
}
