import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Timer, Settings, TrendingDown, BarChart3, ChevronLeft, MapPin, Flag, Calendar, Clock, CloudRain, Sun, Database } from 'lucide-react';

// API Configuration
// In production, this should point to your Proxmox IP (e.g., http://192.168.1.100:8000)
// For local development, we use the relative path which Vite proxies, or fallback to localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `http://${window.location.hostname}:8000`;

const tracks = [
  { id: 'bahrain', country: 'Bahrain', name: 'Bahrain International Circuit', round: 1 },
  { id: 'saudi', country: 'Saudi Arabia', name: 'Jeddah Corniche Circuit', round: 2 },
  { id: 'australia', country: 'Australia', name: 'Albert Park Circuit', round: 3 },
  { id: 'japan', country: 'Japan', name: 'Suzuka International Racing Course', round: 4 },
  { id: 'china', country: 'China', name: 'Shanghai International Circuit', round: 5 },
  { id: 'miami', country: 'Miami', name: 'Miami International Autodrome', round: 6 },
  { id: 'imola', country: 'Emilia Romagna', name: 'Autodromo Enzo e Dino Ferrari', round: 7 },
  { id: 'monaco', country: 'Monaco', name: 'Circuit de Monaco', round: 8 },
  { id: 'canada', country: 'Canada', name: 'Circuit Gilles-Villeneuve', round: 9 },
  { id: 'spain', country: 'Spain', name: 'Circuit de Barcelona-Catalunya', round: 10 },
  { id: 'austria', country: 'Austria', name: 'Red Bull Ring', round: 11 },
  { id: 'uk', country: 'Great Britain', name: 'Silverstone Circuit', round: 12 },
  { id: 'hungary', country: 'Hungary', name: 'Hungaroring', round: 13 },
  { id: 'belgium', country: 'Belgium', name: 'Circuit de Spa-Francorchamps', round: 14 },
  { id: 'netherlands', country: 'Netherlands', name: 'Circuit Zandvoort', round: 15 },
  { id: 'italy', country: 'Italy', name: 'Autodromo Nazionale Monza', round: 16 },
  { id: 'azerbaijan', country: 'Azerbaijan', name: 'Baku City Circuit', round: 17 },
  { id: 'singapore', country: 'Singapore', name: 'Marina Bay Street Circuit', round: 18 },
  { id: 'usa', country: 'United States', name: 'Circuit of The Americas', round: 19 },
  { id: 'mexico', country: 'Mexico', name: 'Autódromo Hermanos Rodríguez', round: 20 },
  { id: 'brazil', country: 'Brazil', name: 'Autódromo José Carlos Pace', round: 21 },
  { id: 'vegas', country: 'Las Vegas', name: 'Las Vegas Strip Circuit', round: 22 },
  { id: 'qatar', country: 'Qatar', name: 'Lusail International Circuit', round: 23 },
  { id: 'abudhabi', country: 'Abu Dhabi', name: 'Yas Marina Circuit', round: 24 },
];

function Home() {
  const navigate = useNavigate();
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // In a real app, you might have an endpoint like /api/sessions/summary
    // For now, we'll just show 0 until the backend is fully implemented
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <Activity className="text-[#FF1801]" size={36} />
          F1 25 Telemetry Analyzer
        </h1>
        <p className="text-gray-400 mt-2 font-mono text-sm tracking-wider">SELECT A GRAND PRIX TO VIEW TELEMETRY SESSIONS</p>
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
                <span className={`text-sm font-mono font-bold ${count > 0 ? 'text-white' : 'text-gray-600'}`}>
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackSessions() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const track = tracks.find(t => t.id === trackId) || tracks[15];
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/sessions/${trackId}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching sessions:", err);
        setError("Could not connect to the telemetry backend.");
        setLoading(false);
      });
  }, [trackId]);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors bg-[#242424] p-2 rounded-lg border border-[#333] hover:border-[#FF1801]">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
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
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
          {error} Make sure your backend container is running.
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#242424] border border-[#333] rounded-xl border-dashed">
          <Database size={48} className="text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No sessions recorded yet</h2>
          <p className="text-gray-400 text-center max-w-md">
            Start playing F1 25 on this track with UDP telemetry enabled. Your sessions will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => navigate(`/track/${track.id}/session/${session.id}`)}
              className="bg-[#242424] border border-[#333] hover:border-[#FF1801] hover:bg-[#2a2a2a] transition-all p-5 rounded-xl cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-sm font-bold text-white px-2 py-1 rounded ${
                  session.type === 'Race' ? 'bg-[#FF1801]/20 text-[#FF1801]' : 
                  session.type === 'Qualifying' ? 'bg-purple-500/20 text-purple-400' : 
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {session.type}
                </span>
                {session.condition === 'Dry' ? (
                  <Sun size={18} className="text-yellow-500" />
                ) : (
                  <CloudRain size={18} className="text-blue-400" />
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
                  <Calendar size={14} /> {session.date.split(' ')[0]}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
                  <Clock size={14} /> {session.date.split(' ')[1]}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase">Best Lap</span>
                  <span className="text-sm font-mono font-bold text-white">{session.bestLap}</span>
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

function SessionDashboard() {
  const { trackId, sessionId } = useParams();
  const track = tracks.find(t => t.id === trackId) || tracks[15];
  
  const [session, setSession] = useState<any>(null);
  const [laps, setLaps] = useState<any[]>([]);
  const [setup, setSetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the specific session details, laps, and setup
    // For now, we'll try to fetch laps and handle the empty response
    setLoading(true);
    fetch(`${API_BASE_URL}/api/laps/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setLaps(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching laps:", err);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <Activity size={48} className="text-[#FF1801] animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Loading Telemetry...</h2>
      </div>
    );
  }

  if (!session && laps.length === 0) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <Activity size={48} className="text-[#FF1801] animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Waiting for Telemetry...</h2>
        <p className="text-gray-400">Listening on UDP Port 20777</p>
        <Link to={`/track/${track.id}`} className="mt-6 text-[#FF1801] hover:underline">Return to Track</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to={`/track/${track.id}`} className="text-gray-400 hover:text-white transition-colors bg-[#242424] p-2 rounded-lg border border-[#333] hover:border-[#FF1801]">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {track.country} - {session?.type || 'Session'}
            </h1>
          </div>
          <p className="text-gray-400 mt-1 font-mono text-sm flex items-center gap-2">
            <Calendar size={14} className="text-[#FF1801]" />
            {session?.date || 'Unknown Date'} | PORT: 20777 | STATUS: OFFLINE (SAVED)
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#242424] border border-[#333] rounded-lg px-4 py-2 flex flex-col items-end">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Ideal Lap</span>
            <span className="font-mono text-xl font-bold text-[#FF1801]">--:--.---</span>
          </div>
          <div className="bg-[#242424] border border-[#333] rounded-lg px-4 py-2 flex flex-col items-end">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Best Lap</span>
            <span className="font-mono text-xl font-bold text-white">{session?.bestLap || '--:--.---'}</span>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Laps & Sectors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="widget-container">
            <div className="widget-header">
              <Timer size={18} className="text-[#FF1801]" />
              <h2 className="widget-title">Lap Times & Sectors</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="col-header">
                  <span>Lap</span>
                  <span>Sector 1</span>
                  <span>Sector 2</span>
                  <span>Sector 3</span>
                  <span>Total</span>
                  <span>Tyre</span>
                  <span>Wear</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {laps.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-mono text-sm">No laps recorded in this session yet.</div>
                  ) : (
                    laps.map((lap) => (
                      <div key={lap.lap} className="data-row">
                        <span className="data-value text-gray-400">{lap.lap}</span>
                        <span className={`data-value ${lap.s1 === 26.8 ? 'text-purple-400' : lap.s1 < 27.0 ? 'text-green-400' : ''}`}>{lap.s1.toFixed(3)}</span>
                        <span className={`data-value ${lap.s2 === 26.2 ? 'text-purple-400' : lap.s2 < 26.4 ? 'text-green-400' : ''}`}>{lap.s2.toFixed(3)}</span>
                        <span className={`data-value ${lap.s3 === 26.4 ? 'text-purple-400' : lap.s3 < 26.6 ? 'text-green-400' : ''}`}>{lap.s3.toFixed(3)}</span>
                        <span className={`data-value font-bold ${lap.total === 79.4 ? 'text-purple-400' : lap.total < 80.0 ? 'text-green-400' : ''}`}>
                          {lap.lap === 8 ? 'PIT' : `1:${(lap.total - 60).toFixed(3)}`}
                        </span>
                        <span className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${lap.compound === 'Soft' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                          <span className="text-xs uppercase">{lap.compound}</span>
                        </span>
                        <span className="data-value">{lap.wear}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="widget-container">
            <div className="widget-header">
              <TrendingDown size={18} className="text-[#FF1801]" />
              <h2 className="widget-title">Tyre Degradation & Pace</h2>
            </div>
            <div className="p-4 h-[300px] flex items-center justify-center">
              {laps.length === 0 ? (
                <span className="text-gray-500 font-mono text-sm">Not enough data for chart</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={laps.filter(l => l.lap !== 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="wear" stroke="#888" label={{ value: 'Tyre Wear (%)', position: 'insideBottom', offset: -5, fill: '#888' }} />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#888" label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft', fill: '#888' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', fontFamily: 'JetBrains Mono' }}
                      formatter={(value: number) => [value.toFixed(3) + 's', 'Lap Time']}
                      labelFormatter={(label) => `Wear: ${label}%`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#FF1801" strokeWidth={2} dot={{ r: 4, fill: '#1A1A1A', strokeWidth: 2 }} name="Pace vs Wear" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Setup & Consistency */}
        <div className="space-y-6">
          <div className="widget-container">
            <div className="widget-header">
              <Settings size={18} className="text-[#FF1801]" />
              <h2 className="widget-title">Active Setup ({track.country})</h2>
            </div>
            <div className="p-4 space-y-4">
              {!setup ? (
                <div className="text-center text-gray-500 font-mono text-sm py-8">Setup data not available</div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xs text-gray-400 uppercase mb-2 font-semibold">Aerodynamics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">Front Wing</span>
                        <span className="font-mono font-bold">{setup.aerodynamics.frontWing}</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">Rear Wing</span>
                        <span className="font-mono font-bold">{setup.aerodynamics.rearWing}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs text-gray-400 uppercase mb-2 font-semibold">Transmission</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">Diff On</span>
                        <span className="font-mono font-bold">{setup.transmission.diffOn}%</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">Diff Off</span>
                        <span className="font-mono font-bold">{setup.transmission.diffOff}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs text-gray-400 uppercase mb-2 font-semibold">Suspension</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">F. Susp</span>
                        <span className="font-mono font-bold">{setup.suspension.frontSusp}</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">R. Susp</span>
                        <span className="font-mono font-bold">{setup.suspension.rearSusp}</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">F. Ride</span>
                        <span className="font-mono font-bold">{setup.suspension.frontRide}</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded border border-[#333] flex justify-between items-center">
                        <span className="text-xs text-gray-400">R. Ride</span>
                        <span className="font-mono font-bold">{setup.suspension.rearRide}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="widget-container">
            <div className="widget-header">
              <BarChart3 size={18} className="text-[#FF1801]" />
              <h2 className="widget-title">Pace Consistency</h2>
            </div>
            <div className="p-4">
              {laps.length === 0 ? (
                <div className="text-center text-gray-500 font-mono text-sm py-8">Not enough data</div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Std Deviation (Softs)</span>
                    <span className="font-mono font-bold text-green-400">±0.42s</span>
                  </div>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={laps.filter(l => l.compound === 'Soft')}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="lap" stroke="#888" tick={{fontSize: 10}} />
                        <YAxis domain={[79, 82]} stroke="#888" tick={{fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', fontFamily: 'JetBrains Mono' }}
                          formatter={(value: number) => [value.toFixed(3) + 's', 'Lap Time']}
                        />
                        <Bar dataKey="total" fill="#FF1801" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

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
