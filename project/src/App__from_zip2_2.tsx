import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarDays, ChevronDown, Crosshair, LogOut, Radio, Save, ShieldCheck, Timer, TrendingUp, Zap } from 'lucide-react';
import { calculateMetrics, statusFor } from '@/lib/attendance';
import { clampDate, countRemainingSlots, formatDate, SEMESTER_END, SEMESTER_START, sections, type Section } from '@/lib/timetable';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Login from '@/components/Login';

const systemDate = new Date();
const defaultToday = clampDate(formatDate(systemDate));

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function StatCard({ label, value, suffix, detail, tone = 'neutral' }: { label: string; value: string; suffix?: string; detail: string; tone?: 'green' | 'amber' | 'pink' | 'neutral' }) {
  return <div className={`stat-card ${tone}`}><div className="stat-label">{label}</div><div className="stat-value">{value}<span>{suffix}</span></div><div className="stat-detail">{detail}</div></div>;
}

function Gauge({ current, possible, detention }: { current: number; possible: number; detention: boolean }) {
  const toPoint = (percent: number) => {
    const angle = Math.PI + Math.min(Math.max(percent, 0), 100) / 100 * Math.PI;
    return { x: 150 + 118 * Math.cos(angle), y: 140 + 118 * Math.sin(angle) };
  };
  const currentPoint = toPoint(current);
  const possiblePoint = toPoint(possible);
  return <div className="gauge-wrap"><svg viewBox="0 0 300 165" className="gauge" role="img" aria-label={`Current attendance ${current.toFixed(1)} percent, maximum possible ${possible.toFixed(1)} percent`}><path d="M 32 140 A 118 118 0 0 1 268 140" className="gauge-track" /><path d="M 32 140 A 118 118 0 0 1 268 140" className={`gauge-progress ${detention ? 'danger' : ''}`} pathLength="100" style={{ strokeDasharray: `${Math.min(possible, 100)} 100` }} /><line x1="62" y1="140" x2="72" y2="140" className="gauge-marker" /><line x1="209" y1="140" x2="219" y2="140" className="gauge-marker target" /><circle cx={currentPoint.x} cy={currentPoint.y} r="5" className="gauge-dot current" /><circle cx={possiblePoint.x} cy={possiblePoint.y} r="5" className={`gauge-dot ${detention ? 'danger' : 'possible'}`} /><text x="37" y="158">0%</text><text x="54" y="128">75</text><text x="211" y="128">90</text><text x="251" y="158">100%</text></svg><div className="gauge-readout"><strong>{current.toFixed(1)}<small>%</small></strong><span>current signal</span></div><div className="gauge-legend"><span><i className="dot current-dot" /> Current</span><span><i className="dot possible-dot" /> Best possible</span></div></div>;
}

function CalendarStrip({ section, fromDate, safeAttend }: { section: Section; fromDate: string; safeAttend: number }) {
  const days = useMemo(() => Array.from({ length: 28 }, (_, index) => { const date = new Date(`${fromDate}T00:00:00`); date.setDate(date.getDate() + index); return date; }), [fromDate]);
  let classIndex = 0;
  return <div className="calendar-grid">{days.map((date) => { const key = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof Section['slots']; const slots = key in section.slots ? section.slots[key] : 0; const isClassDay = slots > 0; const mustAttend = isClassDay && classIndex < safeAttend; if (isClassDay) classIndex += slots; return <div className={`calendar-day ${mustAttend ? 'must-attend' : isClassDay ? 'safe-skip' : 'off-day'}`} key={date.toISOString()}><span>{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}</span><strong>{date.getDate()}</strong>{isClassDay && <small>{slots} slots</small>}</div>; })}</div>;
}

function App() {
  const { user, loading, signOut } = useAuth();
  const [sectionId, setSectionId] = useState(sections[7].id);
  const [today, setToday] = useState(defaultToday);
  const [targetDate, setTargetDate] = useState(defaultToday);
  const [attended, setAttended] = useState('42');
  const [conducted, setConducted] = useState('56');
  const [inputMode, setInputMode] = useState<'split' | 'percent'>('split');
  const [percentInput, setPercentInput] = useState('75');
  const [skips, setSkips] = useState(0);
  const [saved, setSaved] = useState(false);

  const section = sections.find((item) => item.id === sectionId) ?? sections[0];
  const effectiveToday = clampDate(today);
  const effectiveTarget = clampDate(targetDate < effectiveToday ? effectiveToday : targetDate);
  const parsedConducted = Math.max(0, Number(conducted) || 0);
  const parsedAttended = inputMode === 'percent' ? Math.round(parsedConducted * Math.min(Math.max(Number(percentInput) || 0, 0), 100) / 100) : Math.min(Math.max(Number(attended) || 0, 0), parsedConducted);
  const remaining = countRemainingSlots(section, effectiveTarget);
  const metrics = calculateMetrics(parsedAttended, parsedConducted, remaining, skips);
  const simStatus = statusFor(metrics.projectedPercent);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${SEMESTER_END}T00:00:00`).getTime() - new Date(`${effectiveTarget}T00:00:00`).getTime()) / 86400000));

  const handleSave = async () => {
    setSaved(true);
    if (supabase) {
      await supabase.from('attendance_runs').insert({ section_id: section.id, target_date: effectiveTarget, attended: parsedAttended, conducted: parsedConducted, remaining_classes: remaining, current_percent: metrics.currentPercent, final_possible_percent: metrics.possiblePercent });
    }
    window.setTimeout(() => setSaved(false), 2200);
  };

  if (loading) return <div className="auth-loading"><div className="scanlines" /><div className="loader-pulse" /></div>;
  if (!user) return <Login />;

  return <main className="app-shell">
    <div className="scanlines" />
    <header className="topbar"><div className="brand"><div className="brand-mark"><Crosshair size={19} /></div><div><div className="brand-kicker">ATTENDANCE TELEMETRY</div><div className="brand-name">THE ATTENDANCE <span>PREDICTOR</span></div></div></div><div className="topbar-status"><span className="live-dot" /> SYSTEM ONLINE <b>·</b> {formatDisplayDate(effectiveToday)}</div><div className="topbar-right"><button className={`save-button ${saved ? 'saved' : ''}`} onClick={handleSave}><Save size={15} /> {saved ? 'MISSION LOGGED' : 'LOG RUN'}</button><button className="logout-button" onClick={() => signOut()}><LogOut size={15} /> EXIT</button></div></header>

    <section className="hero"><div><div className="eyebrow"><Radio size={14} /> ATTENDANCE TELEMETRY / LIVE CALCULATION</div><h1>Know your <em>landing zone.</em></h1><p>Plot the semester ahead. Find the classes you can miss, the ones you cannot, and the hard limit before detention becomes irreversible.</p></div><div className="semester-chip"><span>ODD SEMESTER 2026–27</span><strong>29 AUG — 29 NOV</strong><small>{daysLeft} days in flight plan</small></div></section>

    <section className="control-deck panel"><div className="panel-heading"><div><span className="section-index">01</span><h2>Mission parameters</h2></div><span className="panel-note">INPUT TELEMETRY</span></div><div className="control-grid"><label className="field wide"><span>Class section</span><div className="select-wrap"><select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>{sections.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.room}</option>)}</select><ChevronDown size={16} /></div><small>{section.year} / {Object.values(section.slots).reduce((sum, value) => sum + value, 0)} scheduled slots per week</small></label><label className="field"><span>Tracking from</span><input type="date" min={SEMESTER_START} max={SEMESTER_END} value={today} onChange={(event) => { setToday(event.target.value); if (event.target.value > targetDate) setTargetDate(event.target.value); }} /><small>Today’s position in semester</small></label><label className="field"><span>Target date</span><input type="date" min={effectiveToday} max={SEMESTER_END} value={effectiveTarget} onChange={(event) => setTargetDate(event.target.value)} /><small>Scenario horizon / semester end</small></label><div className="field attendance-field"><span>Current attendance</span><div className="toggle"><button className={inputMode === 'split' ? 'active' : ''} onClick={() => setInputMode('split')}>Attended / held</button><button className={inputMode === 'percent' ? 'active' : ''} onClick={() => setInputMode('percent')}>Percentage</button></div>{inputMode === 'split' ? <div className="split-inputs"><input type="number" min="0" value={attended} onChange={(event) => setAttended(event.target.value)} aria-label="Classes attended" /><span>/</span><input type="number" min="0" value={conducted} onChange={(event) => setConducted(event.target.value)} aria-label="Classes conducted" /></div> : <div className="percent-input"><input type="number" min="0" max="100" value={percentInput} onChange={(event) => setPercentInput(event.target.value)} /><span>%</span></div>}<small>{parsedAttended} attended · {parsedConducted} conducted · {metrics.currentPercent.toFixed(1)}% signal</small></div></div></section>

    {metrics.detention && <section className="detention-alert"><div className="alert-icon"><AlertTriangle size={25} /></div><div><div className="alert-kicker">HIGH PRIORITY / IRREVERSIBLE DETENTION</div><h2>Trajectory cannot reach the safe zone.</h2><p>Even with 100% attendance from {formatDisplayDate(effectiveTarget)} onward, your maximum final attendance is <strong>{metrics.possiblePercent.toFixed(1)}%</strong> — below the 75% threshold.</p></div><div className="alert-code">ERR<br /><strong>075</strong></div></section>}

    <section className="telemetry-grid"><div className="panel gauge-panel"><div className="panel-heading"><div><span className="section-index">02</span><h2>Trajectory gauge</h2></div><span className={`signal-badge ${metrics.detention ? 'danger' : metrics.currentPercent >= 90 ? 'safe' : 'caution'}`}><span /> {metrics.detention ? 'DETENTION' : metrics.currentPercent >= 90 ? 'SAFE ZONE' : 'CAUTION'}</span></div><Gauge current={metrics.currentPercent} possible={metrics.possiblePercent} detention={metrics.detention} /><div className="threshold-row"><div><span className="threshold-line amber-line" /> <strong>75%</strong><small>SAFE MINIMUM</small></div><div><span className="threshold-line green-line" /> <strong>90%</strong><small>TARGET ZONE</small></div><div><span className="threshold-line pink-line" /> <strong>{metrics.possiblePercent.toFixed(0)}%</strong><small>MAX POSSIBLE</small></div></div></div><div className="panel metrics-panel"><div className="panel-heading"><div><span className="section-index">03</span><h2>Flight telemetry</h2></div><Activity size={17} className="muted-icon" /></div><div className="stats-grid"><StatCard label="Remaining classes" value={String(metrics.remaining)} detail={`from ${formatDisplayDate(effectiveTarget)}`} tone="neutral" /><StatCard label="Safe zone intake" value={String(Math.min(metrics.safeAttend, metrics.remaining))} suffix=" / " detail={metrics.safeAttend > metrics.remaining ? 'mathematically unreachable' : 'classes to attend · 75%'} tone="green" /><StatCard label="Target zone intake" value={String(Math.min(metrics.targetAttend, metrics.remaining))} suffix=" / " detail={metrics.targetAttend > metrics.remaining ? '90% cannot be reached' : 'classes to attend · 90%'} tone="amber" /><StatCard label="Bunk allowance" value={String(metrics.maxBunk)} detail="skips while holding 75%" tone={metrics.maxBunk > 0 ? 'green' : 'pink'} /></div></div></section>

    <section className="lower-grid"><div className="panel simulator-panel"><div className="panel-heading"><div><span className="section-index">04</span><h2>Bunk simulator</h2></div><span className="panel-note">NEXT WEEK / LIVE</span></div><div className="simulator-copy"><div><strong>How many classes are you planning to skip?</strong><p>Move the slider to stress-test your trajectory. The rest of the semester assumes perfect attendance.</p></div><div className={`sim-readout ${simStatus}`}><strong>{metrics.projectedPercent.toFixed(1)}<small>%</small></strong><span>projected final</span></div></div><input className="range" type="range" min="0" max={Math.max(1, Math.min(metrics.remaining, 20))} value={Math.min(skips, Math.max(1, Math.min(metrics.remaining, 20)))} onChange={(event) => setSkips(Number(event.target.value))} /><div className="range-labels"><span>0 skips</span><strong>{skips} {skips === 1 ? 'class' : 'classes'} skipped</strong><span>{Math.min(metrics.remaining, 20)} max</span></div><div className={`sim-status ${simStatus}`}><div>{simStatus === 'safe' ? <ShieldCheck size={18} /> : simStatus === 'caution' ? <TrendingUp size={18} /> : <AlertTriangle size={18} />}</div><span>{simStatus === 'safe' ? 'Green corridor. Your projected landing is above target.' : simStatus === 'caution' ? 'Amber corridor. You land above the minimum, but with no room for drift.' : 'Red corridor. This scenario crosses below the 75% detention threshold.'}</span></div></div><div className="panel calendar-panel"><div className="panel-heading"><div><span className="section-index">05</span><h2>Recovery calendar</h2></div><CalendarDays size={17} className="muted-icon" /></div><div className="calendar-meta"><span><i className="calendar-dot must" /> Must attend</span><span><i className="calendar-dot skip" /> Safe to skip</span><span><i className="calendar-dot off" /> No class</span></div><CalendarStrip section={section} fromDate={effectiveTarget} safeAttend={Math.min(metrics.safeAttend, metrics.remaining)} /><div className="calendar-footer"><Timer size={14} /> First 28 days of your recovery window</div></div></section>

    <footer><span><Zap size={13} /> ATTENDANCE PREDICTOR</span><span>MODEL: {section.label.toUpperCase()} / {Object.values(section.slots).reduce((sum, value) => sum + value, 0)} SLOTS · CALIBRATED 2026</span></footer>
  </main>;
}

export default App;
