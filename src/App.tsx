import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Timer, Settings, TrendingDown, BarChart3, ChevronLeft, MapPin, Flag, Calendar, Clock, CloudRain, Sun, Database, Trash2 } from 'lucide-react';

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
    fetch(`${API_BASE_URL}/api/sessions/summary`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setSessionCounts(data);
      })
      .catch(err => {
        console.error("Error fetching session summary:", err);
      });
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

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

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
              className="bg-[#242424] border border-[#333] hover:border-[#FF1801] hover:bg-[#2a2a2a] transition-all p-5 rounded-xl cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-sm font-bold text-white px-2 py-1 rounded ${
                  session.type === 'Race' ? 'bg-[#FF1801]/20 text-[#FF1801]' : 
                  session.type === 'Qualifying' ? 'bg-purple-500/20 text-purple-400' : 
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {session.type}
                </span>
                <div className="flex items-center gap-3">
                  {session.condition === 'Dry' ? (
                    <Sun size={18} className="text-yellow-500" />
                  ) : (
                    <CloudRain size={18} className="text-blue-400" />
                  )}
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

const TyreBadge = ({ compound }: { compound: string }) => {
  let borderColor = 'border-gray-500';
  let textColor = 'text-gray-500';
  let letter = '?';
  
  if (!compound) return <span className="text-gray-500">-</span>;

  const comp = compound.toLowerCase();
  if (comp.includes('soft')) { borderColor = 'border-[#FF2800]'; textColor = 'text-[#FF2800]'; letter = 'S'; }
  else if (comp.includes('medium')) { borderColor = 'border-[#FCD700]'; textColor = 'text-[#FCD700]'; letter = 'M'; }
  else if (comp.includes('hard')) { borderColor = 'border-[#FFFFFF]'; textColor = 'text-[#FFFFFF]'; letter = 'H'; }
  else if (comp.includes('inter')) { borderColor = 'border-[#00D200]'; textColor = 'text-[#00D200]'; letter = 'I'; }
  else if (comp.includes('wet')) { borderColor = 'border-[#0066FF]'; textColor = 'text-[#0066FF]'; letter = 'W'; }

  return (
    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full border-[3px] ${borderColor} bg-[#1e1e1e] shadow-sm`}>
      <span className={`font-black text-[14px] leading-none ${textColor}`}>
        {letter}
      </span>
    </div>
  );
};

function SessionDashboard() {
  const { trackId, sessionId } = useParams();
  const track = tracks.find(t => t.id === trackId) || tracks[15];
  
  const [session, setSession] = useState<any>(null);
  const [laps, setLaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const fetchData = () => {
      // Fetch session details
      fetch(`${API_BASE_URL}/api/sessions/single/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setSession(data);
        })
        .catch(err => console.error("Error fetching session:", err));

      // Fetch laps
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
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading && !session && laps.length === 0) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <Activity size={48} className="text-[#FF1801] animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Loading Telemetry...</h2>
      </div>
    );
  }

  if (!session && !loading) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <Activity size={48} className="text-[#FF1801] animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Waiting for Telemetry...</h2>
        <p className="text-gray-400">Listening on UDP Port 20777</p>
        <Link to={`/track/${track.id}`} className="mt-6 text-[#FF1801] hover:underline">Back to Track</Link>
      </div>
    );
  }

  // Calculate Stats
  let bestS1 = { val: Infinity, lap: '-' };
  let bestS2 = { val: Infinity, lap: '-' };
  let bestS3 = { val: Infinity, lap: '-' };
  let bestLap = { val: Infinity, lap: '-' };

  laps.forEach(l => {
    if (l.s1 > 0 && l.s1 < bestS1.val) bestS1 = { val: l.s1, lap: l.lap };
    if (l.s2 > 0 && l.s2 < bestS2.val) bestS2 = { val: l.s2, lap: l.lap };
    if (l.s3 > 0 && l.s3 < bestS3.val) bestS3 = { val: l.s3, lap: l.lap };
    if (l.total > 0 && l.total < bestLap.val) bestLap = { val: l.total, lap: l.lap };
  });

  const formatTime = (sec: number) => {
    if (!sec || sec <= 0 || sec === Infinity) return '--:--.---';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3).padStart(6, '0');
    return m > 0 ? `${m}:${s}` : s;
  };

  const formatSector = (sec: number) => {
    if (!sec || sec <= 0 || sec === Infinity) return '--.---';
    return sec.toFixed(3);
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto font-f1">
      <header className="mb-6 flex items-center justify-between">
        <Link to={`/track/${track.id}`} className="text-gray-400 hover:text-white transition-colors bg-[#242424] p-2 rounded-lg border border-[#333] hover:border-[#FF1801]">
          <ChevronLeft size={20} />
        </Link>
      </header>

      <div className="relative bg-[#1a1a1a]/90 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Red Tab */}
        <div className="absolute top-0 left-0 bg-[#FF1801] text-white text-xs font-bold px-4 py-1.5 rounded-br-lg z-10 uppercase tracking-wider">
          LAP TIMES
        </div>

        {/* Header Section */}
        <div className="pt-12 pb-6 px-8 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">FORMULA 1</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-400 text-sm"><Activity size={16} /></span>
              <span className="text-white font-bold tracking-widest uppercase text-sm">{track.name}</span>
            </div>
          </div>
          {session && (
            <div className="flex flex-col md:items-end text-gray-400 text-sm font-mono bg-black/30 px-4 py-2 rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#FF1801]" />
                <span>{session.date.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={14} className="text-[#FF1801]" />
                <span>{session.date.split(' ')[1]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-white text-xs tracking-widest border-b border-white/10">
                <th className="py-4 px-4 font-bold uppercase w-24">LAP</th>
                <th className="py-4 px-4 font-bold uppercase">SECTOR 1</th>
                <th className="py-4 px-4 font-bold uppercase">SECTOR 2</th>
                <th className="py-4 px-4 font-bold uppercase">SECTOR 3</th>
                <th className="py-4 px-4 font-bold uppercase">LAP TIME</th>
                <th className="py-4 px-4 font-bold uppercase text-center">TYRE</th>
                <th className="py-4 px-4 font-bold uppercase text-right">WEAR</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {laps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-normal">No laps recorded.</td>
                </tr>
              ) : (
                laps.map((lap, i) => {
                  const isBestLap = lap.total === bestLap.val;
                  const isBestS1 = lap.s1 === bestS1.val;
                  const isBestS2 = lap.s2 === bestS2.val;
                  const isBestS3 = lap.s3 === bestS3.val;

                  return (
                    <tr key={lap.lap} className="border-b border-white/5 hover:bg-white/10 hover:outline hover:outline-1 hover:outline-white transition-all cursor-default group">
                      <td className="py-3 px-4 text-white">{lap.lap}</td>
                      <td className={`py-3 px-4 ${isBestS1 ? 'text-[#00ff00]' : 'text-white'}`}>
                        {formatSector(lap.s1)}
                      </td>
                      <td className={`py-3 px-4 ${isBestS2 ? 'text-[#00ff00]' : 'text-white'}`}>
                        {formatSector(lap.s2)}
                      </td>
                      <td className={`py-3 px-4 ${isBestS3 ? 'text-[#00ff00]' : 'text-white'}`}>
                        {formatSector(lap.s3)}
                      </td>
                      <td className={`py-3 px-4 ${isBestLap ? 'text-[#00ff00]' : 'text-white'}`}>
                        {formatTime(lap.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TyreBadge compound={lap.compound} />
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-xs text-right">
                        {lap.wear ? `${lap.wear}%` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
