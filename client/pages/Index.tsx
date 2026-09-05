import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { JourneySegment } from "@shared/api";
import { searchFlights, type FlightSearchForm, type FlightSearchResult } from "@/lib/flights";
import { calculateJourneyImpact, recoveryOptions as journeyRecoveryOptions } from "@/lib/journey-intelligence";
import { useTripContext, type AutoRebookPreferences, type TripContext as SharedTripContext, demoHotels as sharedHotels, demoRestaurants as sharedRestaurants, demoExpenses as sharedExpenses } from "@/lib/trip-context";
import { indianAirports } from "@/data/airports";
import { Activity, AlertTriangle, ArrowRight, Bell, BrainCircuit, CalendarDays, Car, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, CloudSun, CreditCard, FileText, GitCompareArrows, Hotel, LayoutDashboard, LifeBuoy, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Plane, Plus, RefreshCw, Search, Send, Settings2, ShieldCheck, Sparkles, Target, TicketCheck, Utensils, Users, X, Zap } from "lucide-react";

function getCurrentUserName() {
  try {
    const auth = JSON.parse(
      window.localStorage.getItem("tripmate-auth") || "{}",
    );

    return auth.name || "Traveler";
  } catch {
    return "Traveler";
  }
}
function getCurrentUserInitials() {
  const name = getCurrentUserName();

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Section = "Dashboard" | "Trips" | "Flights" | "Hotels" | "Transport" | "Restaurants" | "AI Copilot" | "Journey Intelligence" | "Weather" | "Expenses" | "Notifications" | "Travel Requirements" | "Profile";
type DemoState = "on-track" | "disruption" | "confirmed";
type RebookStatus = "idle" | "searching" | "results" | "no-match" | "error";
type TripContext = SharedTripContext;
const defaultPreferences: AutoRebookPreferences = { enabled: false, maxAdditionalPrice: 5000, maxTravelTime: 3, preferredAirlines: "Air India, Vistara", cabin: "ECONOMY", maxStops: "0", departureWindow: "06:00 – 12:00", meetingPriority: "Critical", seatPreference: "Window", baggage: "1 checked bag", refundPreference: "Refundable / flexible" };
const defaultTrip: any = { origin: { city: "Bengaluru", country: "India", code: "BLR" }, destination: { city: "Delhi", country: "India", countryCode: "IN", latitude: 28.5562, longitude: 77.1, timezone: "Asia/Kolkata", code: "DEL" }, dates: { departure: "2026-10-20", return: "2026-10-26" }, travelers: 1, purpose: "Business", budget: 150000, meeting: { name: "Aerocity, New Delhi", latitude: 28.552, longitude: 77.089, time: "09:00", priority: "High" }, segments: [{ type: "flight", provider: "Air India", serviceNumber: "AI 482", origin: "Bengaluru", destination: "Mumbai", departure: "08:40", arrival: "10:35", status: "on_time", terminal: "2", bookingReference: "TRIPMATE-DEMO" }, { type: "flight", provider: "Air India", serviceNumber: "AI 618", origin: "Mumbai", destination: "Delhi", departure: "20:00", arrival: "22:10", status: "scheduled" }, { type: "taxi", provider: "Airport Cab", serviceNumber: "AC 204", origin: "Delhi Airport", destination: "Aerocity, New Delhi", departure: "22:30", arrival: "22:50", status: "scheduled" }, { type: "walking", provider: "Airport walkway", origin: "Aerocity Hotel", destination: "Business Center", departure: "08:30", arrival: "08:40", status: "scheduled" }], selectedFlight: "AI 482", selectedHotel: { name: "Andaz Delhi Aerocity", latitude: 28.552, longitude: 77.089 } };

const navGroups = [
  { label: "WORKSPACE", items: [{ label: "Dashboard", icon: LayoutDashboard }, { label: "Trips", icon: MapPin }, { label: "Flights", icon: Plane }, { label: "Hotels", icon: Hotel }, { label: "Transport", icon: Car }, { label: "Restaurants", icon: Utensils }] },
  { label: "INTELLIGENCE", items: [{ label: "AI Copilot", icon: Sparkles }, { label: "Journey Intelligence", icon: BrainCircuit }, { label: "Weather", icon: CloudSun }, { label: "Expenses", icon: CreditCard }, { label: "Notifications", icon: Bell, count: 3 }, { label: "Travel Requirements", icon: FileText }] },
  { label: "ACCOUNT", items: [{ label: "Profile", icon: Users }, { label: "Preferences", icon: Settings2 }] },
];
const flights = [{ airline: "Air India", code: "AI 482", route: "Bengaluru → Mumbai", depart: "06:30", arrive: "08:20", duration: "1h 50m", price: "₹12,500", tag: "Best for your meeting" }, { airline: "Vistara", code: "UK 945", route: "Bengaluru → Mumbai", depart: "10:15", arrive: "13:05", duration: "3h 20m", price: "₹31,800", tag: "Preferred airline" }, { airline: "IndiGo", code: "6E 1453", route: "Bengaluru → Mumbai", depart: "17:30", arrive: "20:40", duration: "3h 25m", price: "₹22,900", tag: "Lowest fare" }];
const hotels = sharedHotels;
const restaurants = sharedRestaurants;

function More() { return <MoreHorizontal size={17} />; }
function Status({ state }: { state: DemoState }) { return <span className={`status-pill ${state}`}><i className="status-dot" /> {state === "on-track" ? "ON TRACK" : state === "confirmed" ? "RECOVERY CONFIRMED" : "ACTION NEEDED"}</span>; }

export default function Index({ initialSection = "Dashboard" }: { initialSection?: Section }) {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>(initialSection);
  const [state, setState] = useState<DemoState>("on-track");
  const [mobileNav, setMobileNav] = useState(false);
  const [question, setQuestion] = useState("");
  const [copilotMessage, setCopilotMessage] = useState("I’m watching your full trip context. Ask me anything about your itinerary.");
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [journeyAlert, setJourneyAlert] = useState(false);
  const [booked, setBooked] = useState<string[]>(["AI 482", "Andaz Delhi Aerocity"]);
  const { activeTrip: trip, setActiveTrip: setTrip, preferences, setPreferences } = useTripContext();
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [rebookStatus, setRebookStatus] = useState<RebookStatus>("idle");
  const [alternatives, setAlternatives] = useState<any[]>([]);

  const savePreferences = (next: AutoRebookPreferences) => setPreferences(next);
  const searchDestinations = async () => { if (!destinationQuery.trim()) return; setDestinationSearching(true); try { const response = await fetch(`/api/destinations/search?query=${encodeURIComponent(destinationQuery)}`); const data = await response.json(); setDestinationResults(response.ok ? (data.results ?? []).filter((result: any) => result.countryCode === "IN") : []); } finally { setDestinationSearching(false); } };
  const selectDestination = (result: any) => { const next = { ...trip, destination: { city: result.city, country: result.country, countryCode: result.countryCode,code: result.code || result.iataCode, latitude: result.latitude, longitude: result.longitude, timezone: result.timezone }, meeting: { ...trip.meeting, name: `${result.city} Business Center`, latitude: result.latitude, longitude: result.longitude } }; setTrip(next); window.localStorage.setItem("tripmate-trip", JSON.stringify(next)); setDestinationQuery(""); setDestinationResults([]); setCopilotMessage(`Trip context updated to ${result.city}, ${result.country}. Weather, places, maps and recommendations will now use this destination.`); notify(`${result.city}, ${result.country} is now your active destination`); };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const go = (next: string) => { const nextSection = next as Section; setSection(nextSection); setMobileNav(false); if (nextSection === "Journey Intelligence") navigate("/journey-intelligence"); else if (window.location.pathname === "/journey-intelligence") navigate("/"); };
  const triggerDisruption = async () => { setState("disruption"); setSection("Dashboard"); setRebookStatus("searching"); setAlternatives([]); setCopilotMessage("Demo event recorded: AI 482 is cancelled. I’m querying the configured flight provider and applying your rebooking rules."); notify("Flight Disruption Demo · AI 482 cancelled"); try { const departureDate = trip.startDate; const response = await fetch("/api/flights/search?origin=BLR&destination=BOM&departureDate=" + departureDate + "&adults=1&travelClass=" + preferences.cabin); const data = await response.json(); if (!response.ok) { setRebookStatus(data.code === "AMADEUS_NOT_CONFIGURED" ? "no-match" : "error"); return; } const ranked = (data.offers ?? []).map((offer: any) => ({ ...offer, recommendationReason: "Ranked against your meeting priority, cabin, airline and stop preferences." })); setAlternatives(ranked); setRebookStatus(ranked.length ? "results" : "no-match"); } catch { setRebookStatus("error"); } };
  const acceptRecovery = async (offer?: any) => { if (!offer) return; setRebookStatus("searching"); setCopilotMessage("The selected offer is being revalidated. No booking has been confirmed yet."); try { const response = await fetch("/api/flights/revalidate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ offer }) }); const data = await response.json(); if (!response.ok) { setRebookStatus("error"); notify(data.error ?? "Provider revalidation failed"); return; } setRebookStatus("results"); notify("Offer revalidated; provider booking still requires confirmation"); } catch { setRebookStatus("error"); } };
  const ask = (text = question) => { if (!text.trim()) return; const q = text.toLowerCase(); const activeCity = trip.destination.city; setCopilotMessage(q.includes("spend") ? "Your current India trip estimate is ₹23,700: flights ₹12,500, hotel ₹8,500, transport ₹1,200 and dining ₹1,500, within your ₹80,000 budget." : q.includes("restaurant") || q.includes("food") ? "Delhi House is 0.6 km from your hotel, has a 4.8 rating, and matches your vegetarian preference. I can reserve it for 20:00." : q.includes("meeting") || q.includes("miss") ? state === "on-track" ? "You’re scheduled to arrive 2h 15m before the meeting. I’ll alert you if that changes." : "Not with AI 618. You’ll arrive 30 minutes early, with your hotel and transfer still aligned." : `Your active destination is ${activeCity}. I’ll use its live weather, places, hotel coordinates and meeting context for the next recommendation.`); setQuestion(""); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}><div className="brand"><span className="brand-mark"><Plane size={16} /></span><span>tripmate<span className="brand-ai">AI</span></span></div><div className="workspace-label">WORKSPACE <ChevronDown size={13} /></div><div className="workspace"><span className="workspace-icon">
  {getCurrentUserInitials().charAt(0)}
</span><span><strong>{getCurrentUserName()}'s workspace</strong><small>Personal travel</small></span><ChevronDown size={14} /></div><nav className="main-nav">{navGroups.map((group) => <div key={group.label}><span className="nav-label">{group.label}</span>{group.items.map(({ label, icon: Icon, count }) => <button key={label} onClick={() => go(label)} className={`nav-item ${section === label || (section === "Dashboard" && label === "Dashboard") ? "active" : ""}`}><Icon size={17} /><span>{label}</span>{count && <em>{count}</em>}</button>)}</div>)}</nav><div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><LifeBuoy size={16} /></div><div><strong>Need a hand?</strong><p>Our travel desk is online</p></div><ArrowRight size={14} /></div><div className="profile"><div className="avatar">{getCurrentUserInitials()}</div><div><strong>{getCurrentUserName()}</strong><small>Traveler · Air India Gold</small></div><More /></div></div></aside>{mobileNav && <button className="nav-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
    <main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ArrowRight size={13} /><strong>{section}</strong></div><div className="top-actions"><button className="icon-button"><Search size={18} /></button><div className="notification-wrap"><button className="icon-button" onClick={() => setNotifications(!notifications)}><Bell size={18} /><i /></button>{notifications && <div className="notification-popover"><strong>Notifications <span className="notification-count">3 new</span></strong><p>AI 482 status is being monitored</p><p>Hotel check-in is confirmed</p><p>TripMate found a better alternative</p></div>}</div><button className="top-avatar" onClick={() => go("Profile")}>{getCurrentUserInitials()}</button></div></header><div className="page-wrap">{section === "Journey Intelligence" ? <JourneyIntelligence trip={trip} preferences={preferences} notify={notify} onRiskDetected={() => setJourneyAlert(true)} /> : section === "Dashboard" ? <Dashboard notify={notify} trip={trip} destinationQuery={destinationQuery} setDestinationQuery={setDestinationQuery} destinationResults={destinationResults} destinationSearching={destinationSearching} searchDestinations={searchDestinations} selectDestination={selectDestination} state={state} trigger={triggerDisruption} accept={acceptRecovery} rebookStatus={rebookStatus} alternatives={alternatives} preferences={preferences} copilotMessage={copilotMessage} ask={ask} question={question} setQuestion={setQuestion} booked={booked} go={go} /> : section === "AI Copilot" ? <AICopilot trip={trip} preferences={preferences} journeyAlert={journeyAlert} go={go} notify={notify} /> : <WorkspaceSection section={section} trip={trip} booked={booked} setBooked={setBooked} notify={notify} go={go} preferences={preferences} savePreferences={savePreferences} journeyAlert={journeyAlert} />}{toast && <div className="toast"><Check size={15} /> {toast}</div>}<footer><span>TripMate AI <b>·</b> Your intelligent co-pilot for every part of your journey.</span><span><CircleHelp size={14} /> Help center <span className="divider" /> Last synced just now</span></footer></div></main>
  </div>;
}

type IntelligencePhase = "normal" | "analyzing" | "disrupted" | "accepted";
type RecoveryChoice = "A" | "B" | "C";

const intelligenceSteps = ["Traveler preferences", "Current itinerary", "Connection buffer", "Hotel reservation", "Meeting schedule", "Enterprise travel policy"];

function JourneyIntelligence({ trip, preferences, notify, onRiskDetected }: { trip: TripContext; preferences: AutoRebookPreferences; notify: (message: string) => void; onRiskDetected: () => void }) {
  const [phase, setPhase] = useState<IntelligencePhase>("normal");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [choice, setChoice] = useState<RecoveryChoice>("A");
  const [whatIf, setWhatIf] = useState(false);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = window.setInterval(() => setAnalysisStep((current) => {
      if (current >= intelligenceSteps.length - 1) {
        window.clearInterval(timer);
        setPhase("disrupted");
        return current;
      }
      return current + 1;
    }), 450);
    return () => window.clearInterval(timer);
  }, [phase]);

  const simulate = () => {
    setChoice("A");
    setWhatIf(false);
    setAnalysisStep(0);
    setPhase("analyzing");
    onRiskDetected();
    notify("Journey risk detected · analyzing the complete itinerary");
  };
  const selected = journeyRecoveryOptions[choice];
  const isRecovered = phase === "accepted";
  const impact = calculateJourneyImpact(phase === "normal" ? 0 : 135, { priority: "TIME > COMFORT > PRICE", meetingTime: trip.meeting.startTime, meetingPriority: preferences.meetingPriority });
  const health = isRecovered ? 94 : impact.health;

  const choose = (next: RecoveryChoice) => {
    setChoice(next);
    setWhatIf(true);
  };

  return <>
    <section className="section-page-header journey-intelligence-header"><div><p className="eyebrow">JOURNEY INTELLIGENCE · DEMO DATA</p><h1>Understand the journey before it breaks</h1><p>TripMate continuously evaluates Pugal’s complete business journey and recommends the action that best protects the trip.</p></div><button className="demo-button" onClick={phase === "normal" ? simulate : phase === "accepted" ? () => { setPhase("normal"); setChoice("A"); } : simulate}><Zap size={16} fill="currentColor" /> {phase === "normal" ? "Simulate Flight Disruption" : phase === "accepted" ? "Reset Demo" : "Run Again"}</button></section>
    <section className="journey-intelligence-journey card"><div className="journey-intelligence-trip"><div><span className="eyebrow">ACTIVE JOURNEY · PUGAL</span><strong>{trip.journey.origin} → {trip.journey.stops.join(" → ")} → {trip.journey.destination}</strong><small>{trip.traveler.tripType} · {trip.meeting.location} meeting at {trip.meeting.startTime}</small></div><span className="demo-badge">Demo data</span></div><div className="intelligence-timeline">{[{ title: "BLR → BOM", detail: phase === "normal" || isRecovered ? "AI 482 · 08:40 → 10:35" : "AI 482 · 12:50 after +2h 15m delay", location: `${trip.origin.city} to ${trip.journey.stops[0]}`, risk: phase === "normal" ? "Normal" : isRecovered ? "Alternative selected" : "Delayed", tone: phase === "normal" ? "safe" : isRecovered ? "safe" : "risk", icon: Plane }, { title: "BOM → DEL", detail: isRecovered ? "Protected connection" : "AI 618 · 20:00", location: `${trip.journey.stops[0]} connection`, risk: phase === "normal" ? "High risk" : isRecovered ? "Safe" : "At risk", tone: phase === "normal" ? "risk" : isRecovered ? "safe" : "risk", icon: ArrowRight }, { title: "Delhi Hotel", detail: "Andaz Delhi Aerocity · check-in 22:50", location: trip.destination.city, risk: "Confirmed", tone: "safe", icon: Hotel }, { title: "Business Meeting", detail: "Enterprise client · 09:00", location: trip.meeting.location, risk: isRecovered ? "Protected" : phase === "normal" ? "Medium risk" : "At risk", tone: isRecovered ? "safe" : "risk", icon: Users }].map(({ title, detail, location, risk, tone, icon: Icon }, index) => <div className="intelligence-stage" key={title}><div className={`intelligence-stage-icon ${tone}`}><Icon size={16} /></div><div className="intelligence-stage-copy"><strong>{title}</strong><span>{detail}</span><small>{location}</small></div><span className={`risk-label ${tone}`}>{risk}</span>{index < 3 && <i className="intelligence-connector" />}</div>)}</div></section>
    <section className={`journey-health card ${phase !== "normal" ? "health-alert" : ""}`}><div className="health-score"><span className="eyebrow">JOURNEY HEALTH</span><strong>{health}<small>/ 100</small></strong><b>{isRecovered ? "✓ Journey Protected" : phase === "normal" ? "⚠ Attention Required" : "⚠ High Impact Detected"}</b><p>{isRecovered ? "TripMate has prepared the optimized recovery plan." : phase === "normal" ? "Potential disruption detected" : "The current delay threatens the connection and meeting."}</p></div><div className="health-factors"><div><span>Flight Status</span><b className={phase === "normal" || isRecovered ? "safe-text" : "risk-text"}>{phase === "normal" || isRecovered ? "✓ Normal" : "⚠ Delayed +2h 15m"}</b></div><div><span>Connection Risk</span><b className={phase === "normal" || isRecovered ? "risk-text" : "risk-text"}>{isRecovered ? "✓ Safe" : "⚠ High"}</b></div><div><span>Meeting Risk</span><b className={isRecovered ? "safe-text" : "risk-text"}>{isRecovered ? "✓ Protected" : "⚠ Medium"}</b></div><div><span>Hotel</span><b className="safe-text">✓ Confirmed</b></div></div></section>
    {phase === "analyzing" && <section className="card intelligence-analysis"><div className="analysis-heading"><div className="analysis-spinner"><BrainCircuit size={18} /></div><div><span className="eyebrow">TRIPMATE AI · ANALYSIS IN PROGRESS</span><h2>Analyzing journey impact…</h2></div></div><div className="analysis-steps">{intelligenceSteps.map((step, index) => <div className={index <= analysisStep ? "checked" : ""} key={step}>{index <= analysisStep ? <CheckCircle2 size={15} /> : <span className="step-dot" />}<span>{step}</span></div>)}</div></section>}
    {(phase === "disrupted" || phase === "accepted") && <><section className="card impact-analysis"><div className="impact-analysis-heading"><div><span className="demo-label"><AlertTriangle size={12} /> JOURNEY IMPACT DETECTED · DEMO DATA</span><h2>{isRecovered ? "Recovery plan prepared" : "High impact detected"}</h2></div><span className="impact-score">HIGH</span></div><p className="impact-explanation">{isRecovered ? "Option A protects the Delhi meeting while keeping the hotel reservation unchanged." : impact.explanation}</p><div className="impact-metrics"><div><span>Connection risk</span><strong>{isRecovered ? "8%" : `${impact.connectionRisk}%`}</strong></div><div><span>Meeting risk</span><strong>{isRecovered ? "4%" : `${impact.meetingRisk}%`}</strong></div><div><span>Hotel impact</span><strong>LOW</strong></div><div><span>Budget impact</span><strong>{isRecovered ? "MEDIUM" : "MEDIUM"}</strong></div></div></section><section className="card personalization-card"><div className="section-heading"><div><p className="eyebrow">PERSONALIZED DECISION</p><h2>Why this matters</h2></div><Target size={18} /></div><p>Because this traveler is on a business trip with a fixed 09:00 meeting, protecting arrival time has higher priority than minimizing additional fare.</p><div className="personalization-tags"><span>TIME &gt; COMFORT &gt; PRICE</span><span>Business trip: YES</span><span>Meeting: 09:00</span><span>Avoid long layovers: YES</span><span>Cabin: {preferences.cabin === "BUSINESS" ? "Business" : "Economy"}</span></div></section><section className="recovery-options"><div className="section-heading"><div><p className="eyebrow">PERSONALIZED RECOVERY OPTIONS · DEMO DATA</p><h2>Choose the trade-off that fits this journey</h2></div><span className="source-label">3 alternatives evaluated</span></div><div className="recovery-option-grid">{(Object.keys(journeyRecoveryOptions) as RecoveryChoice[]).map((key) => { const option = journeyRecoveryOptions[key]; return <button className={`card recovery-option ${choice === key ? "active" : ""}`} key={key} onClick={() => choose(key)}><div className="recovery-option-top"><span>{option.title}</span>{key === "A" && <b>★ AI RECOMMENDED</b>}</div><h3>{option.label}</h3><strong>{option.cost}</strong><div><span>Arrival</span><b>{option.arrival}</b></div><div><span>Connection</span><b className={option.connection === "SAFE" ? "safe-text" : "risk-text"}>{option.connection}</b></div><div><span>Meeting</span><b className={option.meeting === "PROTECTED" ? "safe-text" : "risk-text"}>{option.meeting}</b></div><div><span>Hotel</span><b>{option.hotel}</b></div><div className="option-score"><span>Journey Score</span><b>{option.score}</b></div></button>; })}</div></section><section className="intelligence-two-column"><div className="card recommendation-panel"><div className="recommendation-panel-head"><div><span className="eyebrow">TRIPMATE RECOMMENDATION</span><h2>Option A · Early alternative</h2></div><span className="confidence-score">94%</span></div><p>TripMate recommends the early alternative because it protects the business meeting without changing the hotel reservation.</p><div className="reason-list"><span><Check size={14} /> Protects the business meeting</span><span><Check size={14} /> Safe connection</span><span><Check size={14} /> Matches the traveler’s time priority</span><span><Check size={14} /> Existing hotel remains unaffected</span><span><Check size={14} /> Acceptable additional cost</span></div><div className="recommendation-actions"><button className="accept-button" onClick={() => { setChoice("A"); setPhase("accepted"); setWhatIf(false); notify("Demo action completed · recovery plan ready") }}><CheckCircle2 size={14} /> Accept Recommendation</button><button className="text-button" onClick={() => setWhatIf(true)}><GitCompareArrows size={14} /> Compare Options</button><button className="text-button" onClick={() => notify("Customize flow ready for traveler policy inputs")}>Customize</button></div></div><div className="card explainability-card"><div className="section-heading"><div><p className="eyebrow">EXPLAINABILITY</p><h2>Why this recommendation?</h2></div><Sparkles size={17} /></div><div className="explain-row"><span>Traveler preference</span><b>→ Time priority</b></div><div className="explain-row"><span>Journey context</span><b>→ Business meeting at 9 AM</b></div><div className="explain-row"><span>Risk detected</span><b>→ Connection failure probability 68%</b></div><div className="explain-row"><span>Enterprise policy</span><b>→ Protect business-critical travel</b></div><div className="explain-row decision"><span>Decision</span><b>→ Recommend earlier alternative</b></div></div></section>{whatIf && <section className="card what-if-panel"><div className="section-heading"><div><p className="eyebrow">WHAT IF? · {selected.title}</p><h2>Compare current journey vs {choice === "A" ? "Option A" : choice === "B" ? "Option B" : "Option C"}</h2></div><button className="text-button" onClick={() => setWhatIf(false)}>Close <X size={14} /></button></div><div className="comparison-grid"><div><strong>CURRENT JOURNEY</strong><span>Departure <b>08:40</b></span><span>Arrival <b>12:10</b></span><span>Connection <b className="risk-text">At risk</b></span><span>Meeting <b className="risk-text">Missed</b></span><span>Hotel <b>Unchanged</b></span><span>Additional cost <b>+₹0</b></span><span>Journey health <b>72 → 42</b></span></div><div className="comparison-selected"><strong>{selected.title.toUpperCase()}</strong><span>Departure <b>05:20</b></span><span>Arrival <b>{selected.arrival}</b></span><span>Connection <b className={selected.connection === "SAFE" ? "safe-text" : "risk-text"}>{selected.connection}</b></span><span>Meeting <b className={selected.meeting === "PROTECTED" ? "safe-text" : "risk-text"}>{selected.meeting}</b></span><span>Hotel <b>{selected.hotel}</b></span><span>Additional cost <b>{selected.cost}</b></span><span>Journey health <b>72 → {selected.score}</b></span></div></div><p className="ai-assessment"><Sparkles size={15} /> AI assessment: “{selected.assessment}”</p></section>}</>}
    <section className="card decision-context"><div className="section-heading"><div><p className="eyebrow">DECISION CONTEXT</p><h2>Signals used by TripMate</h2></div><span className="demo-badge">Demo data</span></div><div className="context-source-grid"><div><strong>AMADEUS</strong><span>Flight and itinerary data · Demo data</span></div><div><strong>CONTENTSTACK</strong><span>Enterprise travel policy · Demo data</span></div><div><strong>TRAVELER PROFILE</strong><span>Preferences and trip purpose</span></div><div><strong>TRIPMATE AI</strong><span>Risk analysis and recommendation engine</span></div></div></section>
    <section className="card decision-timeline"><div className="section-heading"><div><p className="eyebrow">AI DECISION TIMELINE</p><h2>TripMate is reasoning over the journey</h2></div><BrainCircuit size={17} /></div><div className="decision-events">{["09:41 · Flight disruption detected", "09:41 · Traveler context loaded", "09:42 · Connection risk calculated", "09:42 · Meeting dependency detected", "09:43 · Traveler preferences evaluated", "09:43 · Recovery alternatives generated", "09:44 · Options compared", "09:44 · Option A recommended"].map((event, index) => <div key={event} className={phase !== "normal" || index === 0 ? "complete" : ""}><span>{event.split(" · ")[0]}</span><i /> <b>{event.split(" · ")[1]}</b></div>)}</div></section>
    {isRecovered && <div className="confirmed-banner"><TicketCheck size={17} /><span><strong>RECOVERY PLAN READY</strong> · Option A selected. Demo action completed; no provider booking was submitted.</span></div>}
  </>;
}

function DestinationPicker({ trip, query, setQuery, results, searching, onSearch, onSelect }: any) { return <section className="destination-picker card"><div className="destination-current"><div className="destination-pin"><MapPin size={18} /></div><div><span className="eyebrow">ACTIVE DESTINATION</span><strong>{trip.destination.city}, {trip.destination.country}</strong><small>{trip.destination.timezone} · {trip.destination.countryCode}</small></div></div><div className="destination-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSearch()} placeholder="Search a city, country, airport or business location" /><button onClick={onSearch}>{searching ? "Searching…" : "Change destination"}</button>{results.length > 0 && <div className="destination-results">{results.map((result: any) => <button key={result.id} onClick={() => onSelect(result)}><MapPin size={14} /><span><strong>{result.city}</strong><small>{result.country} · {result.countryCode}</small></span><ArrowRight size={14} /></button>)}</div>}</div></section>; }
function Dashboard({ notify, trip, destinationQuery, setDestinationQuery, destinationResults, destinationSearching, searchDestinations, selectDestination, state, trigger, accept, rebookStatus, alternatives, preferences, copilotMessage, ask, question, setQuestion, booked, go }: any) { return <><section className="welcome-row"><div><p className="eyebrow">{new Date().toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})}<span className="live-indicator"><i /> LIVE MONITORING</span></p><h1>Good morning, {getCurrentUserName()} <span>👋</span></h1><p className="welcome-copy">Here’s everything you need for your upcoming journey.</p></div><button className="demo-button" onClick={state === "on-track" ? trigger : () => window.location.reload()}><Zap size={16} fill="currentColor" /> {state === "on-track" ? "Flight Disruption Demo" : "Reset test event"}</button></section><DestinationPicker trip={trip} query={destinationQuery} setQuery={setDestinationQuery} results={destinationResults} searching={destinationSearching} onSearch={searchDestinations} onSelect={selectDestination} />{state === "disruption" && <div className="incident-banner"><div className="incident-symbol"><Activity size={19} /></div><div className="incident-copy"><div><strong>Travel impact detected</strong><span>AI 482 was cancelled in the labeled demo event · connection, hotel and meeting at risk</span></div><span className="impact-score">IMPACT <b>78</b> / 100</span></div><button onClick={() => document.getElementById("recovery")?.scrollIntoView({ behavior: "smooth" })}>Review recovery <ArrowRight size={15} /></button></div>}{state === "confirmed" && <div className="confirmed-banner"><div className="confirmed-icon"><Check size={19} /></div><div><strong>Recovery workflow complete</strong><span>The selected offer was revalidated, but no provider booking confirmation was received.</span></div></div>}{state === "disruption" && <DisruptionPanel status={rebookStatus} alternatives={alternatives} preferences={preferences} accept={accept} />}<section className="hero-grid"><div className="trip-card card"><div className="card-top"><div><p className="eyebrow">UPCOMING BUSINESS TRIP · AUG 20 – AUG 26</p><h2>{trip.origin.city} <span>→</span> {trip.destination.city}</h2><p className="muted"><CalendarDays size={11} /> 6 days <span className="divider" /> 5 services connected <span className="divider" /> ₹23,700 estimated</p></div><Status state={state} /></div><div className="route-line"><div className="route-node active"><span>{trip.airports.origin}</span><small>{trip.origin.city}</small></div><div className={`route-segment ${state !== "on-track" ? "warning" : ""}`}><div className="route-flight"><Plane size={14} /> {state === "confirmed" ? "AI 618" : "AI 482"}</div><span>{state === "on-track" ? "1h 50m" : "Updated"}</span></div><div className="route-node"><span>{trip.airports.connection}</span><small>{trip.journey.stops[0]}</small></div><div className="route-segment"><div className="route-flight"><Plane size={14} /> AI 618</div><span>2h 10m</span></div><div className="route-node final"><span>{trip.airports.destination}</span><small>{trip.destination.city}</small></div></div><div className="trip-stats"><div><span>NEXT FLIGHT</span><strong>{state === "on-track" ? "AI 482" : "AI 618 · Updated"}</strong><small>{state === "on-track" ? "20 Oct · 08:40 IST" : "New departure 12:50 IST"}</small></div><div><span>HOTEL</span><strong>Andaz Delhi Aerocity</strong><small>5 nights · Confirmed</small></div><div><span>MEETING</span><strong>Fri, 09:00</strong><small>High priority · HQ</small></div></div></div><div className="status-card card"><div className="status-heading"><div className="ai-spark"><Sparkles size={17} /></div><div><h3>AI travel status</h3><span>Trip context engine active</span></div><span className="online-dot" /></div>{state === "on-track" ? <><div className="status-message"><ShieldCheck size={18} /><p><strong>Everything is on schedule.</strong><br />I’m monitoring flights, hotel, transport, dining and your meeting.</p></div><div className="monitor-list"><span><Plane size={14} /> Flights <b>2</b></span><span><Hotel size={14} /> Hotel <b>1</b></span><span><Utensils size={14} /> Dining <b>1</b></span></div></> : <><div className="status-message warning-message"><Activity size={18} /><p><strong>Action needed.</strong><br />I found a low-risk recovery plan for you.</p></div><button className="inline-link" onClick={() => document.getElementById("recovery")?.scrollIntoView({ behavior: "smooth" })}>View recommendation <ArrowRight size={14} /></button></>}</div></section><section className="service-strip"><Service icon={<Plane />} label="Flight" value={booked.includes("AI 618") ? "AI 618 · Updated" : "AI 482 · Confirmed"} tone="blue" onClick={() => go("Flights")} /><Service icon={<Hotel />} label="Hotel" value="Hilton Mumbai · 5 nights" tone="violet" onClick={() => go("Hotels")} /><Service icon={<Car />} label="Transport" value="Airport transfer scheduled" tone="orange" onClick={() => go("Transport")} /><Service icon={<Utensils />} label="Dining" value="Dinner · 20:00" tone="teal" onClick={() => go("Restaurants")} /><Service icon={<Users />} label="Meeting" value="Sarah Mitchell · 09:00" tone="pink" onClick={() => notify("Meeting details · Sarah Mitchell · VP Enterprise Partnerships · Aerocity, New Delhi · 09:00–10:00 IST")} /></section><JourneySegments segments={trip.segments} /><section className="content-grid"><div className="left-column"><div className="section-heading"><div><p className="eyebrow">YOUR JOURNEY</p><h2>Trip timeline</h2></div><button className="text-button" onClick={() => go("Trips")}>View full itinerary <ArrowRight size={14} /></button></div><div className="timeline card">{["Flight to Mumbai|AI 482 · {trip.origin.city} → {trip.journey.stops[0]}|08:40|20 Oct · Terminal 2 · Confirmed", "Connecting flight|AI 618 · Mumbai → Delhi|20:00|20 Oct · Terminal 3 · Confirmed", "Hotel check-in|Andaz Delhi Aerocity|22:50|20 Oct · Reservation ADA-2841", "Business meeting|Sarah Mitchell · Aerocity, New Delhi|09:00|21 Oct · High priority"].map((item, index) => { const [label, detail, time, sub] = item.split("|"); const icons: any[] = [Plane, Plane, Hotel, Users]; const Icon = icons[index]; return <div className="timeline-item" key={label}><div className={`timeline-icon ${index === 2 ? "violet" : index === 3 ? "teal" : "blue"}`}><Icon size={16} /></div><div className="timeline-body"><div><strong>{label}</strong><p>{detail}</p><small>{sub}</small></div><div className="timeline-time"><strong>{time}</strong></div></div></div>; })}</div>{false && state !== "on-track" && <div id="recovery" className="recovery-card card"><div className="recovery-header"><div><span className="recommend-label"><Sparkles size={13} /> TRIPMATE RECOMMENDS</span><h2>Switch to AI 618</h2><p>Safest route for your priorities</p></div><span className="low-risk">LOW RISK</span></div><div className="reasons"><span><Check size={14} /> Arrives before your meeting</span><span><Check size={14} /> Matches Air India preference</span><span><Check size={14} /> Preserves hotel reservation</span><span><Check size={14} /> Lowest disruption risk</span></div><div className="recovery-footer"><div><small>WHY THIS OPTION?</small><p>TripMate prioritized your high-importance meeting and ₹35,000 travel budget.</p></div><button className="accept-button" onClick={accept}><Check size={16} /> Accept recovery plan</button></div></div>}</div><aside className="right-column"><Copilot message={copilotMessage} ask={ask} question={question} setQuestion={setQuestion} /></aside></section></>; }

function JourneySegments({ segments }: { segments: JourneySegment[] }) { const icons: Record<string, any> = { flight: Plane, train: TrainIcon, bus: BusIcon, taxi: Car, rental_car: Car, metro: TrainIcon, tram: TrainIcon, walking: FootprintsIcon, bike: BikeIcon, other: MapPin }; return <div className="journey-segments card"><div className="section-heading"><div><p className="eyebrow">CONNECTED JOURNEY</p><h2>One itinerary, every mode</h2></div><span className="source-label">Provider status where available</span></div><div className="journey-segment-list">{segments.map((segment, index) => { const Icon = icons[segment.type] ?? MapPin; return <div className="journey-segment" key={`${segment.type}-${index}`}><div className={`journey-mode ${segment.type}`}><Icon size={16} /></div><div className="journey-segment-main"><strong>{segment.serviceNumber || segment.type.replace("_", " ")}</strong><span>{segment.origin} → {segment.destination}</span><small>{segment.provider || "Provider unavailable"} · {segment.status === "unavailable" ? "Live status unavailable" : segment.status.replace("_", " ")}</small></div><div className="journey-segment-time"><strong>{segment.departure || "—"}</strong><span>{segment.arrival || "—"}</span></div></div>; })}</div></div>; }
function TrainIcon({ size }: { size?: number }) { return <span style={{ fontSize: size ? `${size}px` : "16px" }}>🚆</span>; }
function BusIcon({ size }: { size?: number }) { return <span style={{ fontSize: size ? `${size}px` : "16px" }}>🚌</span>; }
function FootprintsIcon({ size }: { size?: number }) { return <span style={{ fontSize: size ? `${size}px` : "16px" }}>🚶</span>; }
function BikeIcon({ size }: { size?: number }) { return <span style={{ fontSize: size ? `${size}px` : "16px" }}>🚲</span>; }
function DisruptionPanel({ status, alternatives, preferences, accept }: any) { const autoAttempted = useRef(false); useEffect(() => { if (!autoAttempted.current && status === "results" && preferences.enabled && alternatives[0]) { autoAttempted.current = true; accept(alternatives[0]); } }, [status, alternatives, preferences.enabled]); return <section id="recovery" className="disruption-panel card"><div className="disruption-panel-head"><div><span className="demo-label"><Zap size={12} /> FLIGHT DISRUPTION DEMO · TEST EVENT</span><h2>AI 482 cancelled</h2><p>Provider status is not being claimed. This cancellation was triggered for testing the recovery workflow.</p></div><span className="cancelled-pill">CANCELLED · DEMO</span></div><div className="impact-grid"><div><Plane size={15} /><span>Flight</span><b>Cancelled</b></div><div><ArrowRight size={15} /><span>Connection</span><b>High risk</b></div><div><Hotel size={15} /><span>Hotel</span><b>Check-in impact</b></div><div><Car size={15} /><span>Transport</span><b>Pickup adjustment</b></div><div><Utensils size={15} /><span>Dinner</span><b>May be affected</b></div><div><Users size={15} /><span>Meeting</span><b>Critical · 09:00</b></div></div>{status === "searching" && <div className="provider-state"><RefreshCwIcon /> Searching live Amadeus offers and applying your rules…</div>}{status === "no-match" && <div className="provider-state warning"><InfoIcon /> No live alternative results are available. This may mean Amadeus credentials are not configured or the provider returned no offers. No booking was attempted.</div>}{status === "error" && <div className="provider-state warning"><InfoIcon /> Live alternative search failed. No booking was attempted. Check the provider status and try again.</div>}{status === "results" && <><div className="rules-applied"><Check size={14} /> Rules applied: up to ₹{preferences.maxAdditionalPrice.toLocaleString()} extra · {preferences.maxTravelTime}h additional travel · {preferences.maxStops} stops max · {preferences.cabin} · {preferences.meetingPriority} meeting</div><div className="alternative-list">{alternatives.slice(0, 3).map((offer: any, index: number) => <div className="alternative-row" key={offer.id}><div className="alternative-rank">{index + 1}</div><div><strong>{offer.itineraries?.[0]?.segments?.map((segment: any) => `${segment.carrierCode} ${segment.number}`).join(" · ") || "Provider offer"}</strong><p>{offer.itineraries?.[0]?.duration || "Duration returned by provider"} · {offer.price?.currency} {offer.price?.total}</p></div><span className={index === 0 ? "best-option" : "provider-tag"}>{index === 0 ? "AI RANKED BEST" : "LIVE OFFER"}</span><button className="accept-button" onClick={() => accept(offer)}>{preferences.enabled ? "Revalidate auto-rule match" : "Review & revalidate"}</button></div>)}</div></>}</section>; }
function RefreshCwIcon() { return <RefreshCw size={16} />; }
function InfoIcon() { return <CircleHelp size={16} />; }
function Service({ icon, label, value, tone, onClick }: any) { return <button className="service-card" onClick={onClick}><div className={`service-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div><ArrowRight size={14} /></button>; }
type ChatMessage = { id: string; role: "user" | "assistant" | "system"; content: string; action?: { type: string; label: string } };

function AICopilot({ trip, preferences, journeyAlert, go, notify }: any) {
  const initialMessage = journeyAlert ? `⚠ Journey disruption detected. AI 482 is delayed by 2h 15m, your ${trip.journey.stops[0]} connection is at high risk and your ${trip.destination.city} meeting is potentially affected. I’ve analyzed demo alternatives and prepared a recommendation.` : `I’m TripMate AI, your intelligent travel companion. I’m monitoring ${trip.traveler.name}’s ${trip.journey.origin} → ${trip.journey.stops.join(" → ")} → ${trip.journey.destination} business journey.`;
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", content: initialMessage }]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState("");

  const context = {
    traveler: { name: "Pugal", purpose: "Business", budget: trip.budget, preferences: { priority: "TIME > COMFORT > PRICE", departureWindow: preferences.departureWindow, cabin: preferences.cabin, maxStops: preferences.maxStops, meetingPriority: preferences.meetingPriority, loyalty: "Air India Gold" } },
    currentTrip: { route: `${trip.origin.city} → ${trip.journey.stops.join(" → ")} → ${trip.destination.city}`, origin: trip.origin, destination: trip.destination.city, dates: trip.dates, hotel: trip.selectedHotel?.name ?? "Andaz Delhi Aerocity", transport: `${trip.journey.stops[0]} airport connection and ${trip.destination.city} transfer`, dining: "Business dinner near hotel", meeting: `${trip.meeting.person} · ${trip.meeting.startTime} · ${trip.meeting.location}` },
    journeyStatus: { disrupted: journeyAlert, flight: journeyAlert ? "AI 482 delayed +2h 15m" : "Normal", connectionRisk: journeyAlert ? "68%" : "High", meetingRisk: journeyAlert ? "74%" : "Medium", hotelImpact: "Low", journeyHealth: journeyAlert ? 38 : 72 },
    availableDemoData: { flights: [{ flightNumber: "AI 482", price: "₹8,250", stops: "Non-stop", arrival: "10:35" }, { flightNumber: "6E 531", price: "₹6,100", stops: "Non-stop", arrival: "10:00" }, { flightNumber: "UK 945", price: "₹9,400", stops: "Non-stop", arrival: "13:35" }], hotels: hotels, meeting: `${trip.meeting.person} · ${trip.meeting.company} · ${trip.meeting.startTime}` },
    enterpriseContent: { travelPolicy: "Protect business-critical travel; provider confirmation is required before booking." },
  };

  const send = async (value = question) => {
    const text = value.trim();
    if (!text || loading) return;
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: "user", content: text };
    const history = [...messages, userMessage].filter((item) => item.role === "user" || item.role === "assistant").map((item) => ({ role: item.role, content: item.content }));
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, history, context }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "AI Copilot is temporarily unavailable.");
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: "assistant", content: data.answer, action: data.action }]);
      if (data.availability) setAvailability(data.availability);
    } catch (reason: any) {
      setError(reason.message ?? "AI Copilot is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setMessages([{ id: "welcome", role: "assistant", content: initialMessage }]); setError(""); setAvailability(""); };
  const handleAction = (type?: string) => { if (type === "compare-alternatives" || type === "view-journey-impact") go("Journey Intelligence"); else if (type === "view-hotels") go("Hotels"); else notify("This is a demo action; provider confirmation is still required"); };
  const prompts = ["Analyze my current journey", "Check my meeting risk", "Find the best alternative flight", "Why do you recommend this option?", "What happens if my flight is delayed?", "Summarize my trip"];

  return <section className="copilot-workspace"><div className="copilot-workspace-header"><div className="copilot-title-wrap"><div className="copilot-orb"><Sparkles size={20} /></div><div><p className="eyebrow">TRIPMATE AI COPILOT</p><h1>Your intelligent travel companion</h1><span>Context-aware guidance for Pugal’s complete business journey</span></div></div><div className="copilot-header-actions"><span className="copilot-context-status"><i /> Context loaded</span><button className="text-button" onClick={clear}><RefreshCw size={14} /> Clear conversation</button></div></div><div className="copilot-context-strip"><span><Plane size={13} /> {trip.origin.city} → {trip.journey.stops[0]} → Delhi</span><span><CalendarDays size={13} /> Business · Meeting 09:00</span><span className={journeyAlert ? "risk-text" : "safe-text"}><AlertTriangle size={13} /> {journeyAlert ? "Journey risk detected" : "Journey monitored"}</span><span className="demo-badge">Demo data</span></div><div className="copilot-chat card"><div className="chat-history">{messages.map((item) => <div className={`chat-message ${item.role}`} key={item.id}><div className="chat-avatar">{item.role === "user" ? "PS" : <Sparkles size={14} />}</div><div className="chat-bubble"><span className="chat-role">{item.role === "user" ? "Pugal" : "TripMate AI"}</span><p>{item.content}</p>{item.action && <button className="chat-action" onClick={() => handleAction(item.action?.type)}>{item.action.label} <ArrowRight size={13} /></button>}</div></div>)}{loading && <div className="chat-message assistant"><div className="chat-avatar"><Sparkles size={14} /></div><div className="chat-bubble typing-bubble"><span className="chat-role">TripMate AI</span><div className="typing-indicator"><i /><i /><i /></div><small>Reviewing your journey context…</small></div></div>}</div>{messages.length === 1 && <div className="copilot-prompts"><span>Try asking TripMate</span><div>{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div></div>}{availability && <div className="copilot-availability"><CircleHelp size={15} /> {availability}</div>}{error && <div className="copilot-error"><X size={15} /> {error}</div>}<div className="copilot-composer"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Ask about your flights, meeting risk, hotel, alternatives or trip policy…" rows={1} /><button onClick={() => send()} disabled={loading || !question.trim()} aria-label="Send message"><Send size={16} /></button></div><small className="copilot-disclaimer">TripMate explains available context and demo data. Booking, payment and rebooking actions always require provider confirmation.</small></div></section>;
}

function Copilot({ message, ask, question, setQuestion }: any) { return <section className="copilot-card card"><div className="copilot-head"><div className="copilot-orb"><Sparkles size={18} /></div><div><h3>TripMate copilot</h3><span>Knows your complete trip context</span></div><span className="online-dot" /></div><div className="copilot-response"><div className="mini-orb"><Sparkles size={12} /></div><p>{message}</p></div><div className="suggested"><span>Try asking</span><button onClick={() => ask("Will I make my meeting if my flight is delayed?")}>Will I make my meeting?</button><button onClick={() => ask("Find a vegetarian restaurant nearby")}>Find dinner nearby</button><button onClick={() => ask("How much am I spending?")}>How much am I spending?</button></div><div className="copilot-input"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about your trip..." /><button onClick={() => ask()} aria-label="Send question"><Send size={15} /></button></div></section>; }

const fallbackAirports = indianAirports.map((airport) => ({ code: airport.iataCode, name: airport.city, airportName: airport.airportName, state: airport.state }));

const demoDate = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };

function FlightsSection({ trip, setBooked, go, preferences, notify }: any) {
  const [form, setForm] = useState<FlightSearchForm>(() => ({ origin: trip.origin.code || "BLR", destination: trip.destination.code || "DEL", departureDate: trip.startDate, returnDate: trip.endDate, travelers: 1, cabin: preferences.cabin || "ECONOMY" }));
  const [originText, setOriginText] = useState("BLR · Bengaluru");
  const [destinationText, setDestinationText] =  useState(
  `${trip.destination.code || "DEL"} · ${trip.destination.city}`,
);
  const [results, setResults] = useState<FlightSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const updateAirport = (field: "origin" | "destination", value: string) => {
    const airport = fallbackAirports.find((item) => item.code === value);
    if (!airport) return;
    setForm((current) => ({ ...current, [field]: airport.code }));
    (field === "origin" ? setOriginText : setDestinationText)(`${airport.code} · ${airport.name}`);
  };

  const runSearch = async () => {
    const departureDate = form.departureDate || "";
    if (!form.origin || !form.destination || !departureDate || !form.travelers) {
      setMessage("Please select your departure city and travel date.");
      setResults([]);
      return;
    }
    setSearching(true);
    setSearched(true);
    setMessage("");
    setSelected(null);
    const response = await searchFlights({ ...form, departureDate });
    setResults(response.results);
    if (response.fallback) setMessage("Showing shared Demo Provider flight options for this route.");
    setSearching(false);
  };

  const selectFlight = (flight: FlightSearchResult) => {
    setSelected(flight.id);
    setBooked((current: string[]) => current.includes(flight.flightNumber) ? current : [...current, flight.flightNumber]);
    notify(`${flight.flightNumber} selected for your trip`);
  };

  return <>
    <section className="section-page-header"><div><p className="eyebrow">FLIGHT SEARCH · PERSONALIZED</p><h1>Find the right flight</h1><p>Compare provider-backed offers with a reliable demo fallback for every presentation.</p></div><span className="source-label">Traveler preferences applied</span></section>
    <section className="search-panel card" aria-label="Flight search form">
      <div><Plane size={16} /><label>From<select value={form.origin} onChange={(event) => updateAirport("origin", event.target.value)}>{fallbackAirports.map((airport) => <option key={airport.code} value={airport.code}>{airport.code} · {airport.name} · {airport.airportName}</option>)}</select></label></div>
      <div><ArrowRight size={16} /><label>To<select value={form.destination} onChange={(event) => updateAirport("destination", event.target.value)}>{fallbackAirports.map((airport) => <option key={airport.code} value={airport.code}>{airport.code} · {airport.name} · {airport.airportName}</option>)}</select></label></div>
      <div><CalendarDays size={16} /><label>Dates<input type="date" value={form.departureDate} min={demoDate(1)} onChange={(event) => setForm((current) => ({ ...current, departureDate: event.target.value }))} /><small>Return {form.returnDate}</small></label></div>
      <div><Users size={16} /><label>Travelers<select value={form.travelers} onChange={(event) => setForm((current) => ({ ...current, travelers: Number(event.target.value) }))}><option value={1}>1 traveler</option><option value={2}>2 travelers</option><option value={3}>3 travelers</option><option value={4}>4 travelers</option></select></label></div>
      <button className="demo-button" onClick={runSearch} disabled={searching}>{searching ? "Searching…" : "Search Flights"}</button>
    </section>
    <div className="flight-form-context"><span>{originText} → {destinationText}</span><span>Preference: {preferences.departureWindow === "06:00 – 12:00" ? "Morning departures" : preferences.departureWindow}</span><span>Priority: {preferences.meetingPriority === "Critical" ? "Time &gt; Price" : preferences.meetingPriority}</span></div>
    {message && <div className={`card live-state ${message.startsWith("Please") ? "error-state" : ""}`}><CircleHelp size={16} /> {message}</div>}
    {searching && <div className="card live-state"><RefreshCw size={16} /> Finding the best options for your trip…</div>}
    {!searching && searched && results.length > 0 && <><div className="results-heading"><div><p className="eyebrow">{results[0].provider === "amadeus" ? "AMADEUS FLIGHT RESULTS" : "DEMO FLIGHT RESULTS"}</p><h2>Recommended for your journey</h2></div><span>{results.length} options · ranked for your preferences</span></div><div className="result-grid">{results.map((flight) => <article className={`card result-card ${selected === flight.id ? "selected-result" : ""}`} key={flight.id}><div className="result-card-head"><div><span className="recommendation-label">{flight.score >= 92 ? "AI RECOMMENDED" : "PERSONALIZED OPTION"}</span><h3>{flight.airline} <small>{flight.flightNumber}</small></h3></div><strong>{flight.score}/100</strong></div><div className="flight-route"><b>{flight.origin.split(" · ")[0]} → {flight.destination.split(" · ")[0]}</b><span>{flight.departureTime} → {flight.arrivalTime}</span></div><div className="flight-meta"><span>{flight.duration}</span><span>{flight.stops}</span><span>{flight.cabin}</span><span>{flight.baggage}</span></div><div className="flight-price"><strong>{flight.currency === "INR" ? "₹" : flight.currency + " "}{flight.price.toLocaleString("en-IN")}</strong><span>per traveler</span></div><div className="recommendation-reason"><b>Why TripMate recommends this</b><p>{flight.recommendationReason}</p>{flight.highlights.map((highlight) => <span key={highlight}><Check size={12} /> {highlight}</span>)}</div><div className="result-actions"><button className="text-button" onClick={() => notify(`${flight.flightNumber}: ${flight.origin} to ${flight.destination} · ${flight.duration}`)}>View Details</button><button className="accept-button" onClick={() => selectFlight(flight)}>{selected === flight.id ? "Selected" : "Select Flight"}</button></div></article>)}</div></>}
    {!searching && searched && !results.length && <div className="card live-state error-state"><X size={16} /> No flight options were found for these search details.</div>}
    {selected && <div className="confirmed-banner"><TicketCheck size={17} /><span>Your flight is selected. Continue to Trip to review the connected itinerary.</span><button className="text-button" onClick={() => go("Trips")}>Continue to Trip <ArrowRight size={14} /></button></div>}
  </>;
}

function WorkspaceSection({ section, trip, booked, setBooked, notify, go, preferences, savePreferences, journeyAlert }: any) { const [query, setQuery] = useState(""); const [livePlaces, setLivePlaces] = useState<any[]>([]); const [liveFlights, setLiveFlights] = useState<any[]>([]); const [placeError, setPlaceError] = useState(""); const [flightError, setFlightError] = useState(""); useEffect(() => { if (false && section === "Flights") { setLiveFlights([]); setFlightError(""); const departureDate = trip.startDate; fetch(`/api/flights/search?origin=${trip.origin.code}&destination=${trip.destination.code ?? ""}&departureDate=${departureDate}&adults=${trip.travelers}&travelClass=ECONOMY`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data.offers ?? []; }).then(setLiveFlights).catch((reason) => setFlightError(reason.message)); return; } if (section !== "Hotels" && section !== "Restaurants") return; setLivePlaces([]); setPlaceError(""); fetch(`/api/places/search?query=${encodeURIComponent(`${section === "Hotels" ? "hotels" : "restaurants"} in ${trip.destination.city}`)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data.places ?? []; }).then(setLivePlaces).catch(() => { setPlaceError(""); setLivePlaces(section === "Hotels" ? hotels : restaurants); }); }, [section, trip.destination.city]); if (section === "Flights") return <FlightsSection trip={trip} setBooked={setBooked} go={go} preferences={preferences} notify={notify} />; const data = section === "Flights" ? liveFlights.map((offer: any) => ({ name: offer.itineraries?.[0]?.segments?.[0] ? `${offer.itineraries[0].segments[0].carrierCode} ${offer.itineraries[0].segments[0].number}` : "Provider offer", route: `${trip.origin.city} → ${trip.destination.city}`, rating: "Live", distance: offer.itineraries?.[0]?.duration ?? "Provider duration", price: `${offer.price?.currency ?? ""} ${offer.price?.total ?? ""}`, tag: "Live Amadeus offer", providerOffer: offer })) : livePlaces.map((place: any) => ({ name: place.name, rating: place.rating?.toFixed?.(1) ?? "Live", distance: place.address, price: "Provider data", tag: place.openNow === false ? "Closed now" : "Open status from provider", location: place.location })); const isBrowse = ["Flights", "Hotels", "Restaurants"].includes(section); if (section === "Expenses") return <Expenses />; if (section === "Notifications") return <Notifications journeyAlert={journeyAlert} />; if (section === "Profile") return <Profile preferences={preferences} savePreferences={savePreferences} />; if (section === "Trips") return <Trips trip={trip} booked={booked} go={go} />; if (section === "Transport") return <JourneyPlanner trip={trip} notify={notify} />; if (section === "Weather") return <Weather city={trip.destination.city} />; if (section === "Travel Requirements") return <TravelRequirements destination={trip.destination} />; return <><section className="section-page-header"><div><p className="eyebrow">TRIPMATE MARKETPLACE</p><h1>{section === "Flights" ? "Find your next flight" : section === "Hotels" ? "Stay close to what matters" : "Discover places worth the detour"}</h1><p>{section === "Flights" ? "Search, compare and book with your meeting schedule in mind." : section === "Hotels" ? "Personalized stays selected around your meeting and preferences." : "Curated dining near your hotel, airport and meeting."}</p></div><button className="demo-button"><Plus size={16} /> Create new {section.slice(0, -1).toLowerCase()}</button></section><div className="search-panel"><div><MapPin size={15} /><span>{section === "Flights" ? `${trip.origin.code} → ${trip.destination.code ?? trip.destination.city}` : trip.destination.city}</span></div><div><CalendarDays size={15} /><span>20 Oct – 26 Oct</span></div><div><Users size={15} /><span>1 traveler</span></div><button onClick={() => setQuery("ready")}>Search {section}</button></div>{query && <div className="results-note"><Check size={15} /> Showing live provider results for {trip.destination.city} · traveler preferences applied.</div>}{placeError && <div className="card live-state error-state"><X size={15} /> {placeError}</div>}{flightError && <div className="card live-state error-state"><X size={15} /> {flightError}</div>}{(section === "Hotels" || section === "Restaurants") && !placeError && !livePlaces.length && <div className="card live-state"><MapPin size={16} /> Loading live {section.toLowerCase()} for {trip.destination.city}. Results require the configured provider.</div>}{section === "Flights" && !flightError && !liveFlights.length && <div className="card live-state"><Plane size={16} /> Loading live flights from {trip.origin.city} to {trip.destination.city}. Results require Amadeus credentials.</div>}<div className="result-grid">{data.map((item: any) => <article className="result-card card" key={item.name || item.code}><div className={`result-visual ${section.toLowerCase()}`}><span>{section === "Flights" ? <Plane size={30} /> : section === "Hotels" ? <Hotel size={30} /> : <Utensils size={30} />}</span><b>{item.tag}</b></div><div className="result-body"><div className="result-title"><div><h3>{item.name || item.code}</h3><p>{item.route || item.cuisine}</p></div><span className="rating">★ {item.rating || "AI pick"}</span></div>{section === "Flights" ? <div className="flight-times"><strong>{item.depart}</strong><span>→ {item.duration} →</span><strong>{item.arrive}</strong></div> : <p className="result-detail"><MapPin size={13} /> {item.distance}</p>}<div className="result-bottom"><strong>{item.price}{section === "Hotels" ? "/night" : ""}</strong><button onClick={() => { setBooked((current: string[]) => [...new Set([...current, item.name || item.code])]); notify(`${item.name || item.code} added to your trip`); }}> {booked.includes(item.name || item.code) ? <><Check size={14} /> Added</> : section === "Restaurants" ? "Reserve table" : section === "Hotels" ? "Book hotel" : "Select flight"}</button></div></div></article>)}</div></>; }

function Trips({ trip, booked, go }: any) { return <><section className="section-page-header"><div><p className="eyebrow">MY TRIPS · 1 ACTIVE</p><h1>Your complete journey</h1><p>Everything connected in one intelligent itinerary.</p></div><button className="demo-button" onClick={() => go("Dashboard")}><ArrowRight size={16} /> Open live dashboard</button></section><div className="trip-detail-grid"><div className="card itinerary-panel"><div className="panel-title"><h2>{trip.origin.city} → {trip.destination.city} business trip</h2><Status state="on-track" /></div><p className="muted">{trip.origin.city} → {trip.journey.stops.join(" → ")} → {trip.destination.city} · {trip.startDate} – {trip.endDate}</p>{["08:40 · AI 482 · {trip.origin.city} → {trip.journey.stops[0]}", "20:00 · AI 618 · Mumbai → Delhi", "22:30 · Airport cab to Andaz Delhi Aerocity", "22:50 · Hotel check-in · Andaz Delhi Aerocity", "09:00 · Sarah Mitchell · Aerocity meeting"].map((event) => <div className="itinerary-row" key={event}><Check size={15} /><span>{event}</span><More /></div>)}</div><div className="card context-panel"><div className="ai-spark"><Sparkles size={17} /></div><h3>Trip context</h3><p>TripMate is tracking {booked.length} connected bookings and one high-priority meeting.</p><div className="context-metric"><span>Trip budget used</span><b>₹23,700 / ₹80,000</b></div><div className="progress"><i /></div></div></div></>; }
function JourneyPlanner({ trip, notify }: any) { const [from, setFrom] = useState(trip.origin.city); const [to, setTo] = useState(trip.destination.city); const [searching, setSearching] = useState(false); const [capabilities, setCapabilities] = useState<any[]>([]); const [offers, setOffers] = useState<any[]>([]); const [error, setError] = useState(""); const search = async () => { setSearching(true); setError(""); setOffers([]); try { const response = await fetch(`/api/journeys/search?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCapabilities(data.capabilities); const flightCapability = data.capabilities.find((item: any) => item.type === "flight" && item.configured); if (flightCapability && trip.destination.code) { const flightResponse = await fetch(`/api/flights/search?origin=${trip.origin.code}&destination=${trip.destination.code}&departureDate=${trip.startDate}&adults=${trip.travelers}&travelClass=ECONOMY`); const flightData = await flightResponse.json(); if (flightResponse.ok) setOffers(flightData.offers ?? []); } } catch (reason: any) { setError(reason.message); } finally { setSearching(false); } }; return <><section className="section-page-header"><div><p className="eyebrow">MULTIMODAL TRAVEL</p><h1>Plan Your Journey</h1><p>Compare provider-backed transport modes as one connected trip.</p></div><span className="auto-status disabled">LIVE PROVIDER DATA ONLY</span></section><div className="journey-search card"><label>From<input value={from} onChange={(event) => setFrom(event.target.value)} /></label><ArrowRight size={16} /><label>To<input value={to} onChange={(event) => setTo(event.target.value)} /></label><label>Date<input type="date" defaultValue={trip.dates.departure} /></label><label>Travelers<input type="number" min="1" defaultValue={trip.travelers} /></label><button className="demo-button" onClick={search}>{searching ? "Searching…" : "Search Journey"}</button></div>{error && <div className="card live-state error-state"><X size={15} /> {error}</div>}{offers.length > 0 && <div className="journey-results card"><div className="section-heading"><div><p className="eyebrow">RECOMMENDED · LIVE OFFERS</p><h2>Available flight segments</h2></div><span className="source-label">Amadeus</span></div>{offers.map((offer: any) => <div className="journey-result-row" key={offer.id}><Plane size={17} /><div><strong>{offer.itineraries?.[0]?.segments?.[0]?.carrierCode} {offer.itineraries?.[0]?.segments?.[0]?.number}</strong><span>{from} → {to}</span></div><small>{offer.itineraries?.[0]?.duration}</small><b>{offer.price?.currency} {offer.price?.total}</b><button onClick={() => notify("Offer selected for review; provider booking confirmation is still required.")}>Review offer</button></div>)}</div>}<div className="mode-capability-grid">{(capabilities.length ? capabilities : [{ type: "flight", provider: "amadeus", configured: false, reason: "Search to check provider capability." }, { type: "train", provider: "rail provider", configured: false, reason: "No railway provider configured." }, { type: "bus", provider: "bus provider", configured: false, reason: "No bus provider configured." }, { type: "taxi", provider: "routes provider", configured: false, reason: "Ride booking requires a mobility partner." }, { type: "metro", provider: "GTFS / transit", configured: false, reason: "Destination transit data is not configured." }]).map((mode: any) => <div className={`mode-card card ${mode.configured ? "available" : "unavailable"}`} key={mode.type}><span className="mode-emoji">{mode.type === "flight" ? "✈️" : mode.type === "train" ? "🚆" : mode.type === "bus" ? "🚌" : mode.type === "taxi" ? "🚕" : mode.type === "metro" ? "🚇" : "🚶"}</span><div><strong>{mode.type.replace("_", " ")}</strong><small>{mode.configured ? `Provider: ${mode.provider}` : "Unavailable in this deployment"}</small><p>{mode.reason}</p></div></div>)}</div></>; }
function Transport({ notify }: any) { return <><section className="section-page-header"><div><p className="eyebrow">GROUND CONNECTIONS</p><h1>Move through the city</h1><p>Pre-booked transport that keeps your business trip on time.</p></div><button className="demo-button" onClick={() => notify("Airport Cab scheduled for 22:30 IST")}><Plus size={16} /> Schedule a ride</button></section><div className="transport-grid"><div className="card ride-card"><div className="ride-map"><MapPin size={25} /><span>BOM Airport</span><div className="map-line" /><MapPin size={25} /><span>Andaz Delhi Aerocity</span></div><div className="ride-info"><div><p className="eyebrow">RECOMMENDED TRANSFER</p><h2>Delhi Airport → Aerocity</h2><p><Clock3 size={13} /> 20 min · ₹850 · Airport Cab demo</p></div><button className="accept-button" onClick={() => notify("Your airport transfer is confirmed")}>Manage ride</button></div></div><div className="card transport-options"><h3>Other options</h3><div><Car size={17} /><span>Ola Airport Cab</span><b>₹720</b></div><div><Car size={17} /><span>BluSmart Airport Ride</span><b>₹980</b></div></div></div></>; }
function Expenses() { return <><section className="section-page-header"><div><p className="eyebrow">ENTERPRISE SPEND</p><h1>Trip expenses</h1><p>Stay on top of spend without losing sight of the journey.</p></div><button className="demo-button"><Plus size={16} /> Add expense</button></section><div className="expense-grid"><div className="card spend-total"><p className="eyebrow">TOTAL TRIP SPEND</p><h2>₹23,700</h2><span>Within your ₹80,000 budget</span><div className="progress"><i /></div><small>90% of budget · ₹14,450 remaining</small></div>{[["Flights", "₹12,500", "21%", Plane], ["Hotel", "₹8,500", "68%", Hotel], ["Transport", "₹1,200", "6%", Car], ["Food", "₹1,500", "5%", Utensils]].map(([label, value, percent, Icon]: any) => <div className="card expense-item" key={label}><div className="expense-icon"><Icon size={16} /></div><span>{label}</span><strong>{value}</strong><small>{percent} of trip</small></div>)}</div><div className="card expense-table"><div className="section-heading"><div><p className="eyebrow">EXPENSE TIMELINE</p><h2>Recent activity</h2></div><button className="text-button">Export report <ArrowRight size={14} /></button></div>{["Air India AI 482 · Flight", "Hilton Mumbai · 5 nights", "Airport transfer · Mumbai", "Delhi House · Dinner reservation"].map((item, i) => <div className="itinerary-row" key={item}><CalendarDays size={15} /><span>{item}</span><b>{["₹12,500", "₹8,500", "₹1,200", "₹1,850"][i]}</b></div>)}</div></>; }
function Notifications({ journeyAlert }: { journeyAlert: boolean }) { return <><section className="section-page-header"><div><p className="eyebrow">TRAVEL GUARDIAN</p><h1>Notifications</h1><p>Contextual updates from every part of your journey.</p></div><button className="text-button">Mark all as read <Check size={14} /></button></section><div className="notification-list card">{[...(journeyAlert ? [["Journey risk detected", "Your Mumbai connection is at risk. TripMate has analyzed alternatives and prepared a personalized recovery recommendation.", AlertTriangle, "Just now"]] : []), ["Flight confirmed", "AI 482 is confirmed for 20 Oct at 06:30 IST.", Plane, "2 min ago"], ["Hotel booking confirmed", "Hilton Mumbai is reserved for 5 nights.", Hotel, "1 hour ago"], ["Transfer scheduled", "Airport Cab meets you at arrivals at 22:30 IST.", Car, "Yesterday"], ["Meeting reminder", "Enterprise Client Meeting begins tomorrow at 09:00.", Users, "Yesterday"]].map(([title, detail, Icon, time]: any) => <div className="notification-row" key={title}><div className="activity-icon teal"><Icon size={15} /></div><div><strong>{title}</strong><p>{detail}</p></div><time>{time}</time><button><More /></button></div>)}</div></>; }
function Weather({ city }: { city: string }) { const [data, setData] = useState<any>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); useEffect(() => { fetch(`/api/weather?city=${encodeURIComponent(city)}`).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); return payload; }).then(setData).catch((reason) => setError(reason.message)).finally(() => setLoading(false)); }, [city]); return <><section className="section-page-header"><div><p className="eyebrow">LIVE DESTINATION WEATHER</p><h1>Weather in {city}</h1><p>Real conditions from Open-Meteo · updates when you refresh.</p></div><button className="demo-button" onClick={() => window.location.reload()}><CloudSun size={16} /> Refresh weather</button></section>{loading && <div className="card live-state"><CloudSun size={19} /> Checking live weather...</div>}{error && <div className="card live-state error-state"><X size={17} /> {error}</div>}{data && <><div className="weather-grid"><div className="card weather-current"><div className="weather-icon"><CloudSun size={35} /></div><div><p className="eyebrow">{data.location.name.toUpperCase()} · LIVE</p><h2>{Math.round(data.current.temperature)}°C</h2><p>Feels like {Math.round(data.current.feelsLike)}°C · {data.current.humidity}% humidity</p></div><span>Code {data.current.weatherCode}</span></div><div className="card weather-stat"><span>WIND</span><strong>{Math.round(data.current.windSpeed)} km/h</strong><small>Current wind speed</small></div><div className="card weather-stat"><span>UPDATED</span><strong>{data.current.updatedAt.slice(11, 16)}</strong><small>Local destination time</small></div></div><div className="card forecast-panel"><div className="section-heading"><div><p className="eyebrow">5-DAY OUTLOOK</p><h2>Plan around the weather</h2></div><span className="source-label">Source: Open-Meteo</span></div><div className="forecast-row">{data.daily.map((day: any) => <div key={day.date}><strong>{new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}</strong><CloudSun size={21} /><b>{Math.round(day.high)}° <small>{Math.round(day.low)}°</small></b><span>{day.date}</span></div>)}</div></div></>}</>; }
function TravelRequirements({ destination }: { destination: TripContext["destination"] }) { return <><section className="section-page-header"><div><p className="eyebrow">OFFICIAL TRAVEL INFORMATION</p><h1>Travel requirements for {destination.city}</h1><p>Review India travel documents and business-trip requirements. TripMate does not invent policy guidance.</p></div><button className="demo-button" onClick={() => window.open("https://www.iatatravelcentre.com/", "_blank", "noopener,noreferrer")}><ArrowRight size={16} /> Open official checker</button></section><div className="requirements-grid"><div className="card requirement-card"><div className="requirement-icon"><FileText size={18} /></div><h3>{destination.countryCode === "IN" ? "India" : "Your origin"} → {destination.country}</h3><p>Requirements can change based on nationality, passport, purpose and dates. Use the official IATA Travel Centre for the authoritative result.</p><span>Source: IATA Travel Centre · External verification required</span><button onClick={() => window.open("https://www.iatatravelcentre.com/", "_blank", "noopener,noreferrer")}>Verify requirements <ArrowRight size={14} /></button></div><div className="card requirement-card"><div className="requirement-icon"><ShieldCheck size={18} /></div><h3>Document checklist</h3>{["Passport valid for the required period", "Visa / entry authorization if required", "Flight and accommodation details", "Travel insurance and company policy"].map((item) => <div className="check-row" key={item}><Check size={14} /> {item}</div>)}</div></div></>; }
function Profile({
  preferences,
  savePreferences,
}: {
  preferences: AutoRebookPreferences;
  savePreferences: (next: AutoRebookPreferences) => void;
}) {
  const navigate = useNavigate();

  const logout = () => {
    window.localStorage.removeItem("tripmate-auth");
    navigate("/login");
  };

  const update = (
    key: keyof AutoRebookPreferences,
    value: string | number | boolean,
  ) => {
    savePreferences({ ...preferences, [key]: value });
  };

  return (
    <>
      <section className="section-page-header">
        <div>
          <p className="eyebrow">TRAVELER PROFILE</p>
          <h1>Personalize your journey</h1>
          <p>
            These rules control how TripMate handles a cancelled or
            significantly disrupted flight.
          </p>
        </div>

        <span
          className={`auto-status ${
            preferences.enabled ? "enabled" : "disabled"
          }`}
        >
          {preferences.enabled
            ? "AUTO-REBOOKING ON"
            : "AUTO-REBOOKING OFF"}
        </span>
      </section>

      <div className="profile-grid">
        <div className="card profile-hero">
          <div className="large-avatar">PS</div>

          <h2>Pugal S</h2>
          <p>Business traveler · Bengaluru</p>

          <span className="profile-badge">
            <ShieldCheck size={13} />
            Air India Gold
          </span>

          <div className="profile-note">
            <Sparkles size={14} />
            AI will prioritize Critical meetings and your airline preferences.
          </div>

          <button
            type="button"
            className="text-button"
            onClick={logout}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        <div className="card preference-panel auto-panel">
          <div className="auto-header">
            <div>
              <h2>Automatic Rebooking</h2>
              <p>
                Allow TripMate to revalidate eligible alternatives
                automatically. Provider confirmation is always required.
              </p>
            </div>

            <button
              className={`toggle ${preferences.enabled ? "on" : ""}`}
              onClick={() =>
                update("enabled", !preferences.enabled)
              }
              aria-label="Toggle automatic rebooking"
            >
              <i />
            </button>
          </div>

          <div className="rule-grid">
            <label>
              Maximum additional price
              <input
                type="number"
                min="0"
                value={preferences.maxAdditionalPrice}
                onChange={(e) =>
                  update(
                    "maxAdditionalPrice",
                    Number(e.target.value),
                  )
                }
              />
              <small>INR above original fare</small>
            </label>

            <label>
              Maximum travel time / delay
              <input
                type="number"
                min="0"
                step=".5"
                value={preferences.maxTravelTime}
                onChange={(e) =>
                  update(
                    "maxTravelTime",
                    Number(e.target.value),
                  )
                }
              />
              <small>Additional hours allowed</small>
            </label>

            <label>
              Preferred airlines
              <input
                value={preferences.preferredAirlines}
                onChange={(e) =>
                  update("preferredAirlines", e.target.value)
                }
              />
              <small>Comma-separated airline names</small>
            </label>

            <label>
              Allowed cabin
              <select
                value={preferences.cabin}
                onChange={(e) =>
                  update("cabin", e.target.value)
                }
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">
                  Premium Economy
                </option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </label>

            <label>
              Maximum stops
              <select
                value={preferences.maxStops}
                onChange={(e) =>
                  update("maxStops", e.target.value)
                }
              >
                <option value="0">Non-stop only</option>
                <option value="1">Up to 1 stop</option>
                <option value="2+">2+ stops</option>
              </select>
            </label>

            <label>
              Preferred departure window
              <select
                value={preferences.departureWindow}
                onChange={(e) =>
                  update("departureWindow", e.target.value)
                }
              >
                <option>06:00 – 12:00</option>
                <option>12:00 – 18:00</option>
                <option>18:00 – 23:00</option>
                <option>Any time</option>
              </select>
            </label>

            <label>
              Meeting priority
              <select
                value={preferences.meetingPriority}
                onChange={(e) =>
                  update("meetingPriority", e.target.value)
                }
              >
                <option>Critical</option>
                <option>High</option>
                <option>Normal</option>
              </select>
            </label>

            <label>
              Seat preference
              <select
                value={preferences.seatPreference}
                onChange={(e) =>
                  update("seatPreference", e.target.value)
                }
              >
                <option>Window</option>
                <option>Aisle</option>
                <option>No preference</option>
              </select>
            </label>

            <label>
              Baggage requirement
              <select
                value={preferences.baggage}
                onChange={(e) =>
                  update("baggage", e.target.value)
                }
              >
                <option>1 checked bag</option>
                <option>2 checked bags</option>
                <option>Carry-on only</option>
              </select>
            </label>

            <label>
              Refund / change preference
              <select
                value={preferences.refundPreference}
                onChange={(e) =>
                  update("refundPreference", e.target.value)
                }
              >
                <option>Refundable / flexible</option>
                <option>Lowest fare</option>
                <option>Any policy</option>
              </select>
            </label>
          </div>

          {preferences.enabled && (
            <div className="auto-warning">
              <ShieldCheck size={15} />
              Auto-rebooking is limited to these rules. If no offer
              satisfies them, TripMate will not book or rebook automatically.
            </div>
          )}
        </div>
      </div>
    </>
  );
}