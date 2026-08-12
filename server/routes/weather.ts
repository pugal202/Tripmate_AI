import { RequestHandler } from "express";
import { WeatherResponse } from "@shared/api";

const weatherUrl = "https://api.open-meteo.com/v1/forecast";
const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";

export const handleWeather: RequestHandler = async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  if (!city) return res.status(400).json({ error: "A city is required.", code: "INVALID_CITY" });
  try {
    const geocodeResponse = await fetch(`${geocodeUrl}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!geocodeResponse.ok) return res.status(502).json({ error: "Weather location lookup is unavailable.", code: "GEOCODING_UNAVAILABLE" });
    const geocode = (await geocodeResponse.json()) as { results?: Array<{ name: string; latitude: number; longitude: number }> };
    const location = geocode.results?.[0];
    if (!location) return res.status(404).json({ error: `No weather location found for ${city}.`, code: "LOCATION_NOT_FOUND" });
    const forecastResponse = await fetch(`${weatherUrl}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`);
    if (!forecastResponse.ok) return res.status(502).json({ error: "Live weather is temporarily unavailable.", code: "WEATHER_UNAVAILABLE" });
    const forecast = await forecastResponse.json() as { current: any; daily: any };
    const response: WeatherResponse = {
      location: { name: location.name, latitude: location.latitude, longitude: location.longitude },
      current: { temperature: forecast.current.temperature_2m, feelsLike: forecast.current.apparent_temperature, humidity: forecast.current.relative_humidity_2m, windSpeed: forecast.current.wind_speed_10m, weatherCode: forecast.current.weather_code, updatedAt: forecast.current.time },
      daily: forecast.daily.time.map((date: string, index: number) => ({ date, high: forecast.daily.temperature_2m_max[index], low: forecast.daily.temperature_2m_min[index], weatherCode: forecast.daily.weather_code[index] })),
      source: "open-meteo",
    };
    return res.json(response);
  } catch {
    return res.status(502).json({ error: "Unable to retrieve live weather right now. Please try again.", code: "NETWORK_ERROR" });
  }
};
