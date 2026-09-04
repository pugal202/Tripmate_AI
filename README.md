# TripMate AI

**Your intelligent co-pilot for every part of your journey.**

TripMate AI is an enterprise business-travel workspace that connects the complete journey: flights, hotels, ground transport, dining, weather, meetings, expenses, notifications, and disruption recovery.

## What is real today

- **Live weather:** Delhi weather is retrieved from Open-Meteo through the server (`/api/weather`). No key is required. The UI shows loading/error states and the source.
- **Live flight search boundary:** `/api/flights/search` uses the official Amadeus OAuth and Flight Offers APIs when configured. It defaults to the Amadeus test environment and never returns invented offers.
- **Live place discovery boundary:** `/api/places/search` uses Google Places API (New) when a restricted server key is configured. Restaurant reservation is not claimed because Places does not confirm reservations.
- **Contextual copilot boundary:** `/api/copilot` uses OpenAI when configured and otherwise returns an explicit rule-based response. It is instructed not to claim bookings or availability that are not in the supplied context.
- **Provider readiness:** `/api/providers` reports which integrations are configured and what capabilities they expose.

The current booking UI is intentionally provider-truthful: a selection can be added to local trip state, but it is not labeled as a provider-confirmed booking unless a provider order/confirmation endpoint is connected.

## Architecture

- `client/` — React SPA, navigation, responsive product UI, and user interactions.
- `server/routes/` — server-only provider boundaries and credential handling.
- `shared/api.ts` — shared response contracts.
- `server/routes/weather.ts` — geocoding + live Open-Meteo forecast.
- `server/routes/flights.ts` — Amadeus token cache and live flight-offer search.
- `server/routes/places.ts` — Google Places text search.
- `server/routes/chat.ts` — OpenAI Responses API with contextual India-journey fallback.
- `server/routes/providers.ts` — configuration/capability status.

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The app runs at the configured Vite port. Without credentials, the app still runs, but credential-gated services display a clear configuration state rather than fake data.

## Credentials

### Amadeus

Create an Amadeus Self-Service app and add:

```bash
AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
```

The test environment returns test/sandbox availability. It is not a production booking confirmation. Production flight orders require the commercial access and payment setup required by Amadeus.

### Google Places

Enable Places API (New), create a server-side key, restrict it to the required API and deployment environment, then add:

```bash
GOOGLE_MAPS_SERVER_KEY=...
```

Google Places supports discovery and place metadata. It does not by itself confirm restaurant reservations, so TripMate does not show a fake reservation success.

### OpenAI (optional)

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

The key remains server-side. Without it, the copilot explains its limitation and provides only deterministic responses based on the supplied context.

### Supabase (next persistence adapter)

The environment contract is prepared for a server-side Supabase adapter:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Do not expose the service-role key to the browser. Persistent booking, trip, expense, notification, and document tables should be created before enabling production persistence.

## Honest provider limitations

- Flight order creation depends on provider eligibility, ticketing/payment setup, and passenger document requirements. The current API boundary stops at live offers until those requirements are configured.
- Hotel booking and transport booking require a provider with booking inventory and commercial credentials; no fake hotel or ride confirmations are emitted.
- Restaurant reservation requires a reservation provider (for example, a partner integration). Google Places alone is discovery only.
- Travel requirements link to the official IATA Travel Centre instead of inventing visa or immigration rules.
- Simulated disruption controls are labeled as demo/test behavior and are not presented as real-world flight-status events.

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
```
