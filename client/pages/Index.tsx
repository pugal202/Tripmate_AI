import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudSun,
  Coffee,
  Compass,
  CreditCard,
  FileText,
  Gauge,
  Hotel,
  Inbox,
  Info,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Menu,
  MessageCircle,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

type DemoState = "on-track" | "disruption" | "confirmed";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My trips", icon: Compass },
  { label: "Travel wallet", icon: CreditCard },
  { label: "Approvals", icon: TicketCheck, count: 2 },
];

const events = [
  { time: "09:42", title: "All systems normal", detail: "TripMate is monitoring your itinerary", icon: ShieldCheck, tone: "teal" },
  { time: "08:10", title: "Trip context synced", detail: "Flight, hotel and meeting connected", icon: RefreshCw, tone: "blue" },
  { time: "Yesterday", title: "Travel policy checked", detail: "Your itinerary is within company policy", icon: FileText, tone: "violet" },
];

function StatusPill({ state }: { state: DemoState }) {
  const label = state === "on-track" ? "ON TRACK" : state === "confirmed" ? "RECOVERY CONFIRMED" : "ACTION NEEDED";
  return (
    <span className={`status-pill ${state}`}>
      <span className="status-dot" /> {label}
    </span>
  );
}

export default function Index() {
  const [state, setState] = useState<DemoState>("on-track");
  const [mobileNav, setMobileNav] = useState(false);
  const [question, setQuestion] = useState("");
  const [copilotMessage, setCopilotMessage] = useState("I’m watching your full trip context. Ask me anything about your itinerary.");
  const [showNotifications, setShowNotifications] = useState(false);

  const triggerDisruption = () => {
    setState("disruption");
    setCopilotMessage("I detected a 2-hour delay on AI 482 and found a safer route that protects your Frankfurt meeting.");
  };

  const acceptRecovery = () => {
    setState("confirmed");
    setCopilotMessage("Recovery plan confirmed. I’ve updated your flight, hotel arrival and airport transfer.");
  };

  const askCopilot = (text = question) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    if (lower.includes("miss") || lower.includes("meeting")) {
      setCopilotMessage(state === "on-track" ? "You’re currently scheduled to arrive 2h 15m before your meeting. I’ll alert you if that changes." : "Not with the recommended AI 618. You’ll arrive 30 minutes early, with your hotel and transfer still aligned.");
    } else if (lower.includes("why") || lower.includes("recommend")) {
      setCopilotMessage("AI 618 matches your preferred airline, keeps your high-priority meeting on time, and avoids a second connection. It is the lowest-risk option.");
    } else {
      setCopilotMessage("Based on your itinerary and preferences, the safest choice is AI 618 from Dubai. It preserves your hotel booking and arrives before the meeting.");
    }
    setQuestion("");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Plane size={16} /></span><span>tripmate<span className="brand-ai">AI</span></span></div>
        <div className="workspace-label">WORKSPACE <button aria-label="Switch workspace"><ChevronDown size={13} /></button></div>
        <div className="workspace"><span className="workspace-icon">P</span><span><strong>Pugal’s workspace</strong><small>Personal travel</small></span><ChevronDown size={14} /></div>
        <nav className="main-nav">
          <span className="nav-label">WORKSPACE</span>
          {navItems.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-item ${label === "Overview" ? "active" : ""}`}><Icon size={17} /><span>{label}</span>{count && <em>{count}</em>}</button>)}
          <span className="nav-label nav-label-spaced">MANAGE</span>
          <button className="nav-item"><Users size={17} /><span>Travelers</span></button>
          <button className="nav-item"><Settings2 size={17} /><span>Preferences</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><LifeBuoy size={16} /></div><div><strong>Need a hand?</strong><p>Our travel desk is online</p></div><ArrowRight size={14} /></div>
          <div className="profile"><div className="avatar">PS</div><div><strong>Pugal S</strong><small>Traveler</small></div><MoreDots /></div>
        </div>
      </aside>
      {mobileNav && <button className="nav-overlay" aria-label="Close menu" onClick={() => setMobileNav(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><ArrowRight size={13} /><strong>Overview</strong></div>
          <div className="top-actions"><button className="icon-button"><Search size={18} /></button><div className="notification-wrap"><button className="icon-button" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18} /><i /></button>{showNotifications && <div className="notification-popover"><strong>Notifications</strong><p>AI 482 status is being monitored</p><p>All other services are on schedule</p></div>}</div><div className="top-avatar">PS</div></div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row"><div><p className="eyebrow">THURSDAY, 24 OCTOBER 2024 <span className="live-indicator"><i /> LIVE MONITORING</span></p><h1>Good morning, Pugal <span>👋</span></h1><p className="welcome-copy">Here’s your travel at a glance. TripMate is keeping an eye on the details.</p></div><button className="demo-button" onClick={state === "on-track" ? triggerDisruption : () => setState("on-track")}><Zap size={16} fill="currentColor" /> {state === "on-track" ? "Run disruption demo" : "Reset demo"}</button></section>

          {state === "disruption" && <section className="incident-banner"><div className="incident-symbol"><Activity size={19} /></div><div className="incident-copy"><div><strong>Travel impact detected</strong><span>Flight AI 482 is delayed by 2 hours</span></div><span className="impact-score">IMPACT <b>78</b> / 100</span></div><button onClick={() => document.getElementById("recovery")?.scrollIntoView({ behavior: "smooth" })}>Review recovery <ArrowRight size={15} /></button></section>}
          {state === "confirmed" && <section className="confirmed-banner"><div className="confirmed-icon"><Check size={19} /></div><div><strong>Recovery plan confirmed</strong><span>Your itinerary and travel services have been updated successfully.</span></div><button onClick={() => setState("on-track")}><X size={16} /></button></section>}

          <section className="hero-grid">
            <div className="trip-card card"><div className="card-top"><div><p className="eyebrow">UPCOMING BUSINESS TRIP</p><h2>Bengaluru <span>→</span> Frankfurt</h2><p className="muted"><span className="calendar-dot" /> 24 – 27 October 2024 <span className="divider" /> 3 days</p></div><StatusPill state={state} /></div><div className="route-line"><div className="route-node active"><span>BLR</span><small>Bengaluru</small></div><div className={`route-segment ${state !== "on-track" ? "warning" : ""}`}><div className="route-flight"><Plane size={14} /> AI 482</div><span>{state === "on-track" ? "3h 35m" : "Delayed +2h"}</span></div><div className="route-node"><span>DXB</span><small>Dubai</small></div><div className="route-segment"><div className="route-flight"><Plane size={14} /> AI 618</div><span>6h 45m</span></div><div className="route-node final"><span>FRA</span><small>Frankfurt</small></div></div><div className="trip-stats"><div><span>NEXT FLIGHT</span><strong>{state === "on-track" ? "AI 482" : "AI 482 · Delayed"}</strong><small>{state === "on-track" ? "Today, 22:45" : "New departure 00:45"}</small></div><div><span>CONNECTION</span><strong className={state !== "on-track" ? "warn-text" : ""}>{state === "on-track" ? "2h 10m" : "High risk"}</strong><small>Dubai (DXB)</small></div><div><span>MEETING</span><strong>Fri, 09:00</strong><small>Frankfurt HQ</small></div></div></div>
            <div className="status-card card"><div className="status-heading"><div className="ai-spark"><Sparkles size={17} /></div><div><h3>AI travel status</h3><span>Context engine active</span></div><span className="online-dot" /></div>{state === "on-track" ? <><div className="status-message"><ShieldCheck size={18} /><p><strong>Everything is on schedule.</strong><br />TripMate is monitoring 4 services across your journey.</p></div><div className="monitor-list"><span><Plane size={14} /> Flights <b>2</b></span><span><Hotel size={14} /> Hotel <b>1</b></span><span><Users size={14} /> Meeting <b>1</b></span></div></> : <><div className="status-message warning-message"><Activity size={18} /><p><strong>Action needed.</strong><br />I found a low-risk recovery plan for you.</p></div><button className="inline-link" onClick={() => document.getElementById("recovery")?.scrollIntoView({ behavior: "smooth" })}>View recommendation <ArrowRight size={14} /></button></>}</div>
          </section>

          <section className="content-grid">
            <div className="left-column"><div className="section-heading"><div><p className="eyebrow">YOUR JOURNEY</p><h2>Trip timeline</h2></div><button className="text-button">View full itinerary <ArrowRight size={14} /></button></div><div className="timeline card">{[
              { icon: Plane, label: "Flight to Dubai", detail: "AI 482 · Bengaluru → Dubai", time: state === "on-track" ? "22:45" : "00:45", sub: state === "on-track" ? "Today · Terminal 2 · Gate 14" : "Today · Delayed 2 hours", tone: state !== "on-track" ? "warning" : "blue" },
              { icon: Plane, label: "Connecting flight", detail: "AI 618 · Dubai → Frankfurt", time: "06:20", sub: "Tomorrow · Terminal 3 · Gate B22", tone: state !== "on-track" ? "warning" : "blue" },
              { icon: Hotel, label: "Hotel check-in", detail: "The Hoxton, Frankfurt", time: "08:15", sub: "Tomorrow · Reservation THX-2841", tone: state !== "on-track" ? "warning" : "violet" },
              { icon: Users, label: "Business meeting", detail: "Q4 Enterprise Planning · Frankfurt HQ", time: "09:00", sub: "Tomorrow · High priority", tone: "teal" },
            ].map(({ icon: Icon, label, detail, time, sub, tone }, index) => <div className={`timeline-item ${index === 0 ? "first" : ""}`} key={label}><div className={`timeline-icon ${tone}`}><Icon size={16} /></div><div className="timeline-body"><div><strong>{label}</strong><p>{detail}</p><small>{sub}</small></div><div className="timeline-time"><strong>{time}</strong><small>{index < 2 ? "local time" : ""}</small></div></div></div>)}</div>
              {state !== "on-track" && <div id="recovery" className="recovery-card card"><div className="recovery-header"><div><span className="recommend-label"><Sparkles size={13} /> TRIPMATE RECOMMENDS</span><h2>Switch to AI 618</h2><p>Safest route for your priorities</p></div><span className="low-risk">LOW RISK</span></div><div className="reasons"><span><Check size={14} /> Arrives 30 min before your meeting</span><span><Check size={14} /> Matches your preferred airline</span><span><Check size={14} /> Preserves your hotel reservation</span><span><Check size={14} /> Avoids a second connection</span></div><div className="recovery-footer"><div><small>WHY THIS OPTION?</small><p>TripMate prioritized your high-importance meeting and preferred Air India loyalty benefits.</p></div><button className="accept-button" onClick={acceptRecovery}><Check size={16} /> Accept recovery plan</button></div></div>}
            </div>
            <aside className="right-column"><section className="copilot-card card"><div className="copilot-head"><div className="copilot-orb"><Sparkles size={18} /></div><div><h3>TripMate copilot</h3><span>Knows your trip context</span></div><button className="more-button"><MoreDots /></button></div><div className="copilot-response"><div className="mini-orb"><Sparkles size={12} /></div><p>{copilotMessage}</p></div><div className="suggested"><span>Try asking</span><button onClick={() => askCopilot("Will I miss my meeting?")}>Will I miss my meeting?</button><button onClick={() => askCopilot("Why did you recommend this flight?")}>Why this recommendation?</button></div><div className="copilot-input"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askCopilot()} placeholder="Ask about your trip..." /><button onClick={() => askCopilot()} aria-label="Send question"><Send size={15} /></button></div></section><section className="activity-card"><div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>Travel activity</h3></div><button className="more-button"><MoreDots /></button></div><div className="activity-list">{(state !== "on-track" ? [{ time: "Just now", title: "Disruption detected", detail: "AI 482 delayed by 2 hours", icon: Activity, tone: "orange" }, { time: "Just now", title: "Alternative found", detail: "AI 618 · Low risk", icon: Sparkles, tone: "teal" }, ...events] : events).map(({ time, title, detail, icon: Icon, tone }) => <div className="activity-item" key={title}><div className={`activity-icon ${tone}`}><Icon size={14} /></div><div><strong>{title}</strong><p>{detail}</p></div><time>{time}</time></div>)}</div><button className="full-activity">View all activity <ArrowRight size={14} /></button></section></aside>
          </section>
          <footer><span>TripMate AI <b>·</b> Enterprise travel intelligence</span><span><CircleHelp size={14} /> Help center <span className="divider" /> Last synced just now</span></footer>
        </div>
      </main>
    </div>
  );
}

function MoreDots() { return <span className="more-dots"><i /><i /><i /></span>; }
