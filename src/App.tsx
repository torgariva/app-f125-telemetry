import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Activity, MapPin, Flag, Calendar, Clock, CloudRain, Sun,
  Database, Trash2, ChevronLeft, AlertCircle
} from 'lucide-react';

// ─── API Base URL ──────────────────────────────────────────────────────────────
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `http://${window.location.hostname}:8000`;

// ─── Track List ───────────────────────────────────────────────────────────────
const tracks = [
  { id: 'bahrain',     country: 'Bahrain',         name: 'Bahrain International Circuit',        round: 1  },
  { id: 'saudi',       country: 'Saudi Arabia',     name: 'Jeddah Corniche Circuit',              round: 2  },
  { id: 'australia',   country: 'Australia',        name: 'Albert Park Circuit',                  round: 3  },
  { id: 'japan',       country: 'Japan',            name: 'Suzuka International Racing Course',   round: 4  },
  { id: 'china',       country: 'China',            name: 'Shanghai International Circuit',       round: 5  },
  { id: 'miami',       country: 'Miami',            name: 'Miami International Autodrome',        round: 6  },
  { id: 'imola',       country: 'Emilia Romagna',   name: 'Autodromo Enzo e Dino Ferrari',        round: 7  },
  { id: 'monaco',      country: 'Monaco',           name: 'Circuit de Monaco',                    round: 8  },
  { id: 'canada',      country: 'Canada',           name: 'Circuit Gilles-Villeneuve',            round: 9  },
  { id: 'spain',       country: 'Spain',            name: 'Circuit de Barcelona-Catalunya',       round: 10 },
  { id: 'austria',     country: 'Austria',          name: 'Red Bull Ring',                        round: 11 },
  { id: 'uk',          country: 'Great Britain',    name: 'Silverstone Circuit',                  round: 12 },
  { id: 'hungary',     country: 'Hungary',          name: 'Hungaroring',                          round: 13 },
  { id: 'belgium',     country: 'Belgium',          name: 'Circuit de Spa-Francorchamps',         round: 14 },
  { id: 'netherlands', country: 'Netherlands',      name: 'Circuit Zandvoort',                    round: 15 },
  { id: 'italy',       country: 'Italy',            name: 'Autodromo Nazionale Monza',            round: 16 },
  { id: 'azerbaijan',  country: 'Azerbaijan',       name: 'Baku City Circuit',                    round: 17 },
  { id: 'singapore',   country: 'Singapore',        name: 'Marina Bay Street Circuit',            round: 18 },
  { id: 'usa',         country: 'United States',    name: 'Circuit of The Americas',              round: 19 },
  { id: 'mexico',      country: 'Mexico',           name: 'Autódromo Hermanos Rodríguez',         round: 20 },
  { id: 'brazil',      country: 'Brazil',           name: 'Autódromo José Carlos Pace',           round: 21 },
  { id: 'vegas',       country: 'Las Vegas',        name: 'Las Vegas Strip Circuit',              round: 22 },
  { id: 'qatar',       country: 'Qatar',            name: 'Lusail International Circuit',         round: 23 },
  { id: 'abudhabi',    country: 'Abu Dhabi',        name: 'Yas Marina Circuit',                   round: 24 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(sec: number): string {
  if (!sec || sec <= 0 || !isFinite(sec)) return '---';
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, '0');
  return m > 0 ? `${m}:${s}` : s;
}

const COMPOUND_COLORS: Record<string, string> = {
  Soft:    'text-red-400',
  Medium:  'text-yellow-400',
  Hard:    'text-gray-300',
  Inter:   'text-green-400',
  Wet:     'text-blue-400',
  Unknown: 'text-gray-500',
};

const COMPOUND_BG: Record<string, string> = {
  Soft:    'bg-red-500',
  Medium:  'bg-yellow-400',
  Hard:    'bg-gray-200',
  Inter:   'bg-green-500',
  Wet:     'bg-blue-500',
  Unknown: 'bg-gray-600',
};

function TyreDot({ compound }: { compound: string }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${COMPOUND_BG[compound] ?? 'bg-gray-600'}`}
      title={compound}
    />
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate();
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sessions/summary`)
      .then(res => { if (!res.ok) throw new Error('Network error'); return res.json(); })
      .then(setSessionCounts)
      .catch(err => console.error('Error fetching summary:', err));
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <Activity className="text-[#FF1801]" size={36} />
          F1 25 Telemetry Analyzer
        </h1>
        <p className="text-gray-400 mt-2 font-mono text-sm tracking-wider">
          SELECT A GRAND PRIX TO VIEW TELEMETRY SESSIONS
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tracks.map((track) => {
          const count = sessionCounts[track.id] || 0;
          return (
            <div
              key={track.id}
              onClick={() => navigate(`/track/${track.id}`)}
              className="bg-[#242424] border border-[#333] hover:border-[#FF1801] hover:bg-[#2a2a2a] transition-all p-5 rounded-xl cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-gray-500 font-bold">R{track.round}</span>
                <Flag size={16} className="text-gray-600 group-hover:text-[#FF1801] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{track.country}</h3>
              <p className="text-xs text-gray-400 font-mono truncate" title={track.name}>{track.name}</p>
              <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase">Sessions</span>
                <span className={`text-sm font-mono font-bold ${count > 0 ? 'text-[#FF1801]' : 'text-gray-600'}`}>
                  {count > 0 ? count : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Track Sessions ───────────────────────────────────────────────────────────
function TrackSessions() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const track = tracks.find(t => t.id === trackId);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!track) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/sessions/${trackId}`)
      .then(res => { if (!res.ok) throw new Error('Network error'); return res.json(); })
      .then(data => { setSessions(data); setLoading(false); })
      .catch(err => {
        console.error('Error fetching sessions:', err);
        setError('Could not connect to the telemetry backend.');
        setLoading(false);
      });
  }, [trackId]);

  // Unknown track — show error
  if (!track) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-[#FF1801]" />
        <h2 className="text-2xl font-bold text-white">Track not found</h2>
        <Link to="/" className="text-[#FF1801] hover:underline">← Back to home</Link>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this session?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors bg-[#242424] p-2 rounded-lg border border-[#333] hover:border-[#FF1801]"
            >
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {track.country} Grand Prix
            </h1>
          </div>
          <p className="text-gray-400 mt-1 font-mono text-sm flex items-center gap-2">
            <MapPin size={14} className="text-[#FF1801]" />
            {track.name.toUpperCase()} | SESSIONS RECORDED: {sessions.length}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Activity className="text-[#FF1801] animate-pulse" size={48} />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          {error} Make sure your backend container is running.
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#242424] border border-[#333] rounded-xl border-dashed">
          <Database size={48} className="text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No sessions recorded yet</h2>
          <p className="text-gray-400 text-center max-w-md">
            Start playing F1 25 on this track with UDP telemetry enabled on port 20777.
            Sessions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => navigate(`/track/${track.id}/session/${session.id}`)}
              className="bg-[#242424] border border-[#333] hover:border-[#FF1801] hover:bg-[#2a2a2a] transition-all p-5 rounded-xl cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-sm font-bold px-2 py-1 rounded ${
                  session.type === 'Race' || session.type === 'Race 2' || session.type === 'Race 3'
                    ? 'bg-[#FF1801]/20 text-[#FF1801]'
                    : session.type?.includes('Qualifying')
                    ? 'bg-purple-500/20 text-purple-400'
                    : session.type?.includes('Practice')
                    ? 'bg-blue-500/20 text-blue-400'
                    : session.type === 'Time Trial'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {session.type || 'Unknown'}
                </span>
                <div className="flex items-center gap-3">
                  {session.condition === 'Wet'
                    ? <CloudRain size={18} className="text-blue-400" />
                    : <Sun size={18} className="text-yellow-500" />}
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors z-10"
                    title="Delete Session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
                  <Calendar size={14} /> {session.date?.split(' ')[0] ?? '—'}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
                  <Clock size={14} /> {session.date?.split(' ')[1] ?? '—'}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase">Best Lap</span>
                  <span className="text-sm font-mono font-bold text-[#FF1801]">{session.bestLap}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 uppercase">Total Laps</span>
                  <span className="text-sm font-mono font-bold text-white">{session.laps}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function LapTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 font-mono text-sm">
      <p className="text-yellow-500 mb-1">Lap {d.lap}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatTime(p.value)}
        </p>
      ))}
      {d.invalid ? <p className="text-red-400 mt-1">⚠ Invalid</p> : null}
      {d.pit     ? <p className="text-orange-400 mt-1">🔧 Pit lap</p> : null}
    </div>
  );
}

function SectorTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 font-mono text-sm">
      <p className="text-yellow-500 mb-1">Lap {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value > 0 ? p.value.toFixed(3) + 's' : '---'}
        </p>
      ))}
    </div>
  );
}

// ─── Session Dashboard ────────────────────────────────────────────────────────
function SessionDashboard() {
  const { trackId, sessionId } = useParams();
  const track = tracks.find(t => t.id === trackId);

  const [session, setSession]   = useState<any>(null);
  const [laps, setLaps]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE_URL}/api/sessions/detail/${sessionId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/api/laps/${sessionId}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([sessionData, lapsData]) => {
        setSession(sessionData);
        setLaps(lapsData ?? []);
      })
      .catch(err => console.error('Error fetching session data:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <Activity size={48} className="text-[#FF1801] animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white">Loading Telemetry...</h2>
      </div>
    );
  }

  if (!session && laps.length === 0) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <Activity size={48} className="text-[#FF1801] animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Waiting for Telemetry...</h2>
        <p className="text-gray-400">Listening on UDP Port 20777</p>
        <Link to={`/track/${trackId}`} className="mt-6 text-[#FF1801] hover:underline">
          ← Return to Track
        </Link>
      </div>
    );
  }

  // ── Stats calculation ──────────────────────────────────────────────────────
  let bestS1   = { val: Infinity, lap: '-' };
  let bestS2   = { val: Infinity, lap: '-' };
  let bestS3   = { val: Infinity, lap: '-' };
  let bestLap  = { val: Infinity, lap: '-' };
  let totalTime      = 0;
  let validLapsCount = 0;

  const validLaps = laps.filter(l => !l.invalid);

  validLaps.forEach(l => {
    if (l.s1 > 0 && l.s1 < bestS1.val) bestS1 = { val: l.s1, lap: l.lap };
    if (l.s2 > 0 && l.s2 < bestS2.val) bestS2 = { val: l.s2, lap: l.lap };
    if (l.s3 > 0 && l.s3 < bestS3.val) bestS3 = { val: l.s3, lap: l.lap };
    if (l.total > 0 && l.total < bestLap.val) bestLap = { val: l.total, lap: l.lap };
    if (l.total > 0) { totalTime += l.total; validLapsCount++; }
  });

  const idealLap = (bestS1.val !== Infinity ? bestS1.val : 0)
                 + (bestS2.val !== Infinity ? bestS2.val : 0)
                 + (bestS3.val !== Infinity ? bestS3.val : 0);
  const avgLap = validLapsCount > 0 ? totalTime / validLapsCount : 0;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const lapChartData = laps
    .filter(l => l.total > 0)
    .map(l => ({
      lap:     l.lap,
      Laptime: parseFloat(l.total.toFixed(3)),
      invalid: l.invalid,
      pit:     l.pit,
    }));

  const sectorChartData = laps
    .filter(l => l.s1 > 0 || l.s2 > 0 || l.s3 > 0)
    .map(l => ({
      lap: l.lap,
      S1:  l.s1 > 0 ? parseFloat(l.s1.toFixed(3)) : 0,
      S2:  l.s2 > 0 ? parseFloat(l.s2.toFixed(3)) : 0,
      S3:  l.s3 > 0 ? parseFloat(l.s3.toFixed(3)) : 0,
    }));

  const backLink = track ? `/track/${track.id}` : '/';

  // ── Lap time dot colour ────────────────────────────────────────────────────
  const lapDotColor = (entry: any) => {
    if (entry.invalid) return '#ef4444';
    if (entry.lap === bestLap.lap) return '#a855f7';
    return '#FF1801';
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to={backLink}
            className="text-gray-400 hover:text-white transition-colors bg-[#242424] p-2 rounded-lg border border-[#333] hover:border-[#FF1801]"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {session?.type ?? 'Session'} — {track?.country ?? trackId}
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-sm font-mono text-gray-400">
          {session?.date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#FF1801]" /> {session.date}
            </span>
          )}
          {session?.condition && (
            <span className="flex items-center gap-1.5">
              {session.condition === 'Wet'
                ? <CloudRain size={14} className="text-blue-400" />
                : <Sun size={14} className="text-yellow-500" />}
              {session.condition}
            </span>
          )}
          <span className="text-yellow-500">
            {track?.name} | UDP 20777
          </span>
        </div>
      </header>

      <div className="space-y-6">

        {/* ── Lap Time Chart ───────────────────────────────────────────── */}
        {lapChartData.length > 0 && (
          <div className="bg-[#111] border border-[#333] rounded-xl p-5">
            <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 font-mono">
              Lap Time Evolution
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lapChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis
                  dataKey="lap"
                  stroke="#555"
                  tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'Lap', position: 'insideBottomRight', offset: -5, fill: '#666', fontSize: 11 }}
                />
                <YAxis
                  stroke="#555"
                  tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(v) => formatTime(v)}
                  domain={['auto', 'auto']}
                  width={70}
                />
                <Tooltip content={<LapTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Laptime"
                  stroke="#FF1801"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`dot-${payload.lap}`}
                        cx={cx} cy={cy} r={4}
                        fill={lapDotColor(payload)}
                        stroke="none"
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#FF1801' }}
                  name="Laptime"
                />
                {/* Best lap reference line */}
                {bestLap.val !== Infinity && (
                  <Line
                    type="monotone"
                    dataKey={() => bestLap.val}
                    stroke="#a855f7"
                    strokeWidth={1}
                    strokeDasharray="6 4"
                    dot={false}
                    name="Best Lap"
                    legendType="line"
                  />
                )}
                <Legend
                  wrapperStyle={{ fontSize: 12, fontFamily: 'monospace', color: '#888' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Sector Times Chart ───────────────────────────────────────── */}
        {sectorChartData.length > 0 && (
          <div className="bg-[#111] border border-[#333] rounded-xl p-5">
            <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 font-mono">
              Sector Breakdown per Lap
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis
                  dataKey="lap"
                  stroke="#555"
                  tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#555"
                  tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(v) => v.toFixed(1) + 's'}
                  width={55}
                />
                <Tooltip content={<SectorTooltip />} />
                <Bar dataKey="S1" stackId="a" fill="#3b82f6" name="S1" radius={[0,0,0,0]} />
                <Bar dataKey="S2" stackId="a" fill="#f59e0b" name="S2" radius={[0,0,0,0]} />
                <Bar dataKey="S3" stackId="a" fill="#22c55e" name="S3" radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'monospace', color: '#888' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Lap Table ────────────────────────────────────────────────── */}
        <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-sm">
              <thead>
                <tr className="text-yellow-500 border-b border-[#333] bg-[#1a1a1a]">
                  <th className="py-3 px-4 font-normal">LAP</th>
                  <th className="py-3 px-4 font-normal">LAPTIME</th>
                  <th className="py-3 px-4 font-normal">S1</th>
                  <th className="py-3 px-4 font-normal">S2</th>
                  <th className="py-3 px-4 font-normal">S3</th>
                  <th className="py-3 px-4 font-normal">TYRE</th>
                  <th className="py-3 px-4 font-normal">PIT</th>
                  <th className="py-3 px-4 font-normal">FLAG</th>
                </tr>
              </thead>
              <tbody>
                {laps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No laps recorded yet.
                    </td>
                  </tr>
                ) : laps.map((lap) => {
                  const isBestLap = !lap.invalid && lap.total === bestLap.val;
                  const isBestS1  = !lap.invalid && lap.s1 === bestS1.val;
                  const isBestS2  = !lap.invalid && lap.s2 === bestS2.val;
                  const isBestS3  = !lap.invalid && lap.s3 === bestS3.val;
                  return (
                    <tr
                      key={lap.lap}
                      className={`border-b border-[#222] hover:bg-[#1e1e1e] transition-colors ${lap.invalid ? 'opacity-50' : ''}`}
                    >
                      <td className="py-2 px-4 text-gray-400">L{lap.lap}</td>
                      <td className={`py-2 px-4 font-bold ${isBestLap ? 'text-purple-400' : lap.invalid ? 'text-gray-600 line-through' : 'text-white'}`}>
                        {formatTime(lap.total)}
                      </td>
                      <td className={`py-2 px-4 ${isBestS1 ? 'text-purple-400' : lap.s1 > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                        {lap.s1 > 0 ? lap.s1.toFixed(3) : '---'}
                      </td>
                      <td className={`py-2 px-4 ${isBestS2 ? 'text-purple-400' : lap.s2 > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                        {lap.s2 > 0 ? lap.s2.toFixed(3) : '---'}
                      </td>
                      <td className={`py-2 px-4 ${isBestS3 ? 'text-purple-400' : lap.s3 > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                        {lap.s3 > 0 ? lap.s3.toFixed(3) : '---'}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`flex items-center text-xs uppercase ${COMPOUND_COLORS[lap.compound] ?? 'text-gray-500'}`}>
                          <TyreDot compound={lap.compound} />
                          {lap.compound || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {lap.pit ? (
                          <span className="text-orange-400 text-xs font-bold uppercase tracking-wide bg-orange-400/10 px-1.5 py-0.5 rounded">
                            IN
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {lap.invalid ? (
                          <span className="text-red-500 text-xs uppercase tracking-wide">✕ INV</span>
                        ) : (
                          <span className="text-green-700 text-xs">✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Summary Block ─────────────────────────────────────────────── */}
        {validLaps.length > 0 && (
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 font-mono text-sm space-y-6">

            {/* Averages */}
            <div className="text-gray-300 border-b border-[#333] pb-4">
              <span className="text-yellow-500">All laps avg:</span>{' '}
              {formatTime(avgLap)}{' '}
              <span className="text-gray-600 mx-4">|</span>
              <span className="text-yellow-500">Total time on track:</span>{' '}
              {formatTime(totalTime)}
            </div>

            {/* Best Sectors */}
            <div className="border-b border-[#333] pb-4">
              <div className="text-yellow-500 mb-3">Driver best sectors:</div>
              <div className="grid grid-cols-3 gap-4 text-gray-300 max-w-md">
                <div>
                  <span className="text-blue-400 mr-2">S1</span>
                  <span className="text-gray-500 mr-2">L{bestS1.lap}</span>
                  <span className="text-white font-bold">{bestS1.val !== Infinity ? bestS1.val.toFixed(3) : '---'}</span>
                </div>
                <div>
                  <span className="text-yellow-400 mr-2">S2</span>
                  <span className="text-gray-500 mr-2">L{bestS2.lap}</span>
                  <span className="text-white font-bold">{bestS2.val !== Infinity ? bestS2.val.toFixed(3) : '---'}</span>
                </div>
                <div>
                  <span className="text-green-400 mr-2">S3</span>
                  <span className="text-gray-500 mr-2">L{bestS3.lap}</span>
                  <span className="text-white font-bold">{bestS3.val !== Infinity ? bestS3.val.toFixed(3) : '---'}</span>
                </div>
              </div>
            </div>

            {/* Session Best Times */}
            <div>
              <div className="text-yellow-500 mb-3">Session best times</div>
              <div className="flex flex-wrap gap-12 text-gray-300">
                <div>
                  <span className="text-gray-500 block mb-1 text-xs uppercase">Best Laptime</span>
                  <span className="text-white font-bold text-lg">{formatTime(bestLap.val)}</span>
                  <span className="text-yellow-600 ml-2">L{bestLap.lap}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1 text-xs uppercase">Ideal Lap</span>
                  <span className="text-purple-400 font-bold text-lg">{formatTime(idealLap)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1 text-xs uppercase">Gap to Ideal</span>
                  <span className="text-white font-bold text-lg">
                    {bestLap.val !== Infinity && idealLap > 0
                      ? `+${(bestLap.val - idealLap).toFixed(3)}`
                      : '---'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track/:trackId" element={<TrackSessions />} />
        <Route path="/track/:trackId/session/:sessionId" element={<SessionDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
