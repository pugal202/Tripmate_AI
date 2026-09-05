import type { RequestHandler } from "express";
import type { WeatherResponse } from "@shared/api";

const weatherUrl = "https://api.open-meteo.com/v1/forecast";
const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
const fallbackWeather = (name: string): WeatherResponse => ({
  location: { name, latitude: 28.5562, longitude: 77.1 },
  current: { temperature: 29, feelsLike: 31, humidity: 46, windSpeed: 12, weatherCode: 2, updatedAt: "2026-10-20T08:00" },
  daily: ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"].map((date, index) => ({ date, high: 31 + (index % 2), low: 20 + index % 2, weatherCode: 2 })),
  source: "open-meteo",
});

export const handleWeather: RequestHandler = async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "Delhi";
  try {
    const geocodeResponse = await fetch(`${geocodeUrl}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!geocodeResponse.ok) return res.json({ ...fallbackWeather(city), demo: true });
    const geocode = (await geocodeResponse.json()) as { results?: Array<{ name: string; latitude: number; longitude: number }> };
    const location = geocode.results?.[0];
    if (!location) return res.json({ ...fallbackWeather(city), demo: true });
    const forecastResponse = await fetch(`${weatherUrl}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=Asia%2FKolkata`);
    if (!forecastResponse.ok) return res.json({ ...fallbackWeather(location.name), demo: true });
    const forecast = await forecastResponse.json() as { current: any; daily: any };
    const response: WeatherResponse = { location: { name: location.name, latitude: location.latitude, longitude: location.longitude }, current: { temperature: forecast.current.temperature_2m, feelsLike: forecast.current.apparent_temperature, humidity: forecast.current.relative_humidity_2m, windSpeed: forecast.current.wind_speed_10m, weatherCode: forecast.current.weather_code, updatedAt: forecast.current.time }, daily: forecast.daily.time.map((date: string, index: number) => ({ date, high: forecast.daily.temperature_2m_max[index], low: forecast.daily.temperature_2m_min[index], weatherCode: forecast.daily.weather_code[index] })), source: "open-meteo" };
    return res.json(response);
  } catch {
    return res.json({ ...fallbackWeather(city), demo: true });
  }
};
