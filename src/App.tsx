import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Timer, Settings, TrendingDown, BarChart3, ChevronLeft, MapPin, Flag, Calendar, Clock, CloudRain, Sun, Database, Trash2, Search } from 'lucide-react';

// API Configuration
// In production, this should point to your Proxmox IP (e.g., http://192.168.1.100:8000)
// For local development, we use the relative path which Vite proxies, or fallback to localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `http://${window.location.hostname}:8000`;

const formatSessionType = (type: string) => {
  if (!type) return '';
  const upperType = type.toUpperCase();
  
  // Format all race sessions (Race, Race 2, Race 3, and Sprint Shootout which the game uses for 5-lap races) as RACE
  if (upperType.includes('RACE') || upperType.includes('SPRINT SHOOTOUT')) {
    return 'RACE';
  }

  // Format all qualifying and shootout sessions as QUALIFYING
  if (
    upperType.includes('QUALIFYING') || 
    upperType.includes('OSQ') || 
    upperType.includes('SHORT Q') ||
    upperType === 'QUALI'
  ) {
    return 'QUALIFYING';
  }
  
  // Format practice sessions
  if (upperType.includes('PRACTICE')) {
    return 'PRACTICE';
  }
  
  // If the game specifically sends Time Trial, we leave it as TIME TRIAL
  return upperType;
};

const tracks = [
  { id: 'australia', country: 'Australia', name: 'Albert Park Circuit', round: 1, image: 'Australia', countryCode: 'au' },
  { id: 'china', country: 'China', name: 'Shanghai International Circuit', round: 2, image: 'China', countryCode: 'cn' },
  { id: 'japan', country: 'Japan', name: 'Suzuka International Racing Course', round: 3, image: 'Japan', countryCode: 'jp' },
  { id: 'bahrain', country: 'Bahrain', name: 'Bahrain International Circuit', round: 4, image: 'Bahrain', countryCode: 'bh' },
  { id: 'saudi', country: 'Saudi Arabia', name: 'Jeddah Corniche Circuit', round: 5, image: 'Saudi%20Arabia', countryCode: 'sa' },
  { id: 'miami', country: 'Miami', name: 'Miami International Autodrome', round: 6, image: 'Miami', countryCode: 'us' },
  { id: 'imola', country: 'Emilia Romagna', name: 'Autodromo Enzo e Dino Ferrari', round: 7, image: 'Emilia%20Romagna', countryCode: 'it' },
  { id: 'monaco', country: 'Monaco', name: 'Circuit de Monaco', round: 8, image: 'Monaco', countryCode: 'mc' },
  { id: 'spain', country: 'Spain', name: 'Circuit de Barcelona-Catalunya', round: 9, image: 'Spain', countryCode: 'es' },
  { id: 'canada', country: 'Canada', name: 'Circuit Gilles-Villeneuve', round: 10, image: 'Canada', countryCode: 'ca' },
  { id: 'austria', country: 'Austria', name: 'Red Bull Ring', round: 11, image: 'Austria', countryCode: 'at' },
  { id: 'uk', country: 'Great Britain', name: 'Silverstone Circuit', round: 12, image: 'Great%20Britain', countryCode: 'gb' },
  { id: 'belgium', country: 'Belgium', name: 'Circuit de Spa-Francorchamps', round: 13, image: 'Belgium', countryCode: 'be' },
  { id: 'hungary', country: 'Hungary', name: 'Hungaroring', round: 14, image: 'Hungary', countryCode: 'hu' },
  { id: 'netherlands', country: 'Netherlands', name: 'Circuit Zandvoort', round: 15, image: 'Netherlands', countryCode: 'nl' },
  { id: 'italy', country: 'Italy', name: 'Autodromo Nazionale Monza', round: 16, image: 'Italy', countryCode: 'it' },
  { id: 'azerbaijan', country: 'Azerbaijan', name: 'Baku City Circuit', round: 17, image: 'Azerbaijan', countryCode: 'az' },
  { id: 'singapore', country: 'Singapore', name: 'Marina Bay Street Circuit', round: 18, image: 'Singapore', countryCode: 'sg' },
  { id: 'usa', country: 'United States', name: 'Circuit of The Americas', round: 19, image: 'United%20States', countryCode: 'us' },
  { id: 'mexico', country: 'Mexico', name: 'Autódromo Hermanos Rodríguez', round: 20, image: 'Mexico', countryCode: 'mx' },
  { id: 'brazil', country: 'Brazil', name: 'Autódromo José Carlos Pace', round: 21, image: 'Brazil', countryCode: 'br' },
  { id: 'vegas', country: 'Las Vegas', name: 'Las Vegas Strip Circuit', round: 22, image: 'Las%20Vegas', countryCode: 'us' },
  { id: 'qatar', country: 'Qatar', name: 'Lusail International Circuit', round: 23, image: 'Qatar', countryCode: 'qa' },
  { id: 'abudhabi', country: 'Abu Dhabi', name: 'Yas Marina Circuit', round: 24, image: 'Abu%20Dhabi', countryCode: 'ae' },
];

function Home() {
  const navigate = useNavigate();
  const [sessionCounts, setSessionCounts] = useState<Record<string, { count: number, best_lap: string | null }>>({});

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => {
          const trackData = sessionCounts[track.id] || { count: 0, best_lap: null };
          const count = trackData.count;
          const bestLap = trackData.best_lap;
          
          return (
            <div 
              key={track.id}
              onClick={() => navigate(`/track/${track.id}`)}
              className="bg-[#050505] border border-[#151515] hover:border-[#333] hover:bg-[#0a0a0a] transition-all p-5 rounded-xl cursor-pointer group relative overflow-hidden flex flex-col min-h-[220px]"
            >
              <div className="mb-3 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Round {track.round}</span>
              </div>
              
              <div className="relative z-10 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={`https://flagcdn.com/w40/${track.countryCode}.png`}
                    alt={`${track.country} flag`}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/10"
                  />
                  <h3 className="text-3xl font-black text-white tracking-tight inline-block">{track.country}</h3>
                </div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide leading-relaxed max-w-[85%]">
                  {track.name}
                </p>
              </div>
              
              <div className="mt-auto relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${count > 0 ? 'text-white' : 'text-gray-600'}`}>
                    {count}
                  </span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Sessions
                  </span>
                </div>
                {bestLap && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Timer size={12} className="text-[#FF1801]" />
                    <span className="text-xs font-mono font-bold text-gray-300">{bestLap}</span>
                  </div>
                )}
              </div>

              {/* Track Silhouette */}
              <div className="absolute bottom-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity w-28 h-28 flex items-end justify-end pointer-events-none">
                <img 
                  src={`https://media.formula1.com/image/upload/f_auto,c_limit,w_1440,q_auto/f_auto/q_auto/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/${track.image}.png`}
                  alt={`${track.country} Track Layout`}
                  className="max-w-full max-h-full object-contain drop-shadow-lg"
                  referrerPolicy="no-referrer"
                />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionToDelete));
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const search = searchTerm.toLowerCase();
    const displayType = formatSessionType(session.type).toLowerCase();
    return session.date.toLowerCase().includes(search) || 
           session.type.toLowerCase().includes(search) ||
           displayType.includes(search);
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { day: '--', month: '---' };
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const bestLap = useMemo(() => {
    const validLaps = sessions
      .filter(s => s.best_lap && s.best_lap !== '--:--.---')
      .map(s => {
        const [min, sec] = s.best_lap.split(':');
        return {
          str: s.best_lap,
          time: parseInt(min) * 60 + parseFloat(sec)
        };
      })
      .sort((a, b) => a.time - b.time);
      
    return validLaps.length > 0 ? validLaps[0].str : null;
  }, [sessions]);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors bg-[#050505] p-2 rounded-lg border border-[#151515] hover:border-[#333]">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <img 
                src={`https://flagcdn.com/w40/${track.countryCode}.png`}
                alt={`${track.country} flag`}
                className="w-8 h-8 rounded-full object-cover border-2 border-white/10"
              />
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                {track.country} Grand Prix
              </h1>
            </div>
          </div>
          <p className="text-gray-400 mt-1 font-mono text-sm flex items-center gap-2">
            <MapPin size={14} className="text-[#FF1801]" />
            {track.name.toUpperCase()} | SESSIONS RECORDED: {sessions.length}
          </p>
          {bestLap && (
            <p className="text-gray-400 mt-1 font-mono text-sm flex items-center gap-2">
              <Timer size={14} className="text-[#FF1801]" />
              ALL-TIME BEST: <span className="text-white font-bold">{bestLap}</span>
            </p>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-auto mt-4 md:mt-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Filter by date or session..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#050505] border border-[#151515] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#333] transition-colors w-full md:w-64 font-mono text-sm"
          />
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
        <div className="flex flex-col items-center justify-center py-20 bg-[#050505] border border-[#151515] rounded-xl border-dashed">
          <Database size={48} className="text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No sessions recorded yet</h2>
          <p className="text-gray-400 text-center max-w-md">
            Start playing F1 25 on this track with UDP telemetry enabled. Your sessions will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col bg-[#050505] border border-[#151515] rounded-xl overflow-hidden">
          {filteredSessions.map((session, index) => {
            const { day, month } = formatDate(session.date);
            const time = session.date.split(' ')[1]?.substring(0, 5) || '--:--';
            
            return (
              <div
                key={session.id}
                onClick={() => navigate(`/track/${track.id}/session/${session.id}`)}
                className={`flex items-center justify-between p-6 cursor-pointer hover:bg-[#0a0a0a] transition-colors group ${
                  index !== filteredSessions.length - 1 ? 'border-b border-[#151515]' : ''
                }`}
              >
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center justify-center min-w-[40px]">
                    <span className="text-2xl font-black text-white leading-none">{day}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{month}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-gray-300 transition-colors">
                      {formatSessionType(session.type)}
                    </h3>
                    <div className="flex items-center gap-2">
                      {session.condition === 'Dry' ? (
                        <Sun size={16} className="text-yellow-500" />
                      ) : (
                        <CloudRain size={16} className="text-blue-400" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Best Lap</span>
                    <span className="text-sm font-mono font-bold text-gray-300">{session.bestLap}</span>
                  </div>
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Laps</span>
                    <span className="text-sm font-mono font-bold text-gray-300">{session.laps}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-mono font-bold text-white">{time}</span>
                    <button 
                      onClick={(e) => handleDeleteClick(e, session.id)} 
                      className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Session"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-mono text-sm">
              No sessions match your search.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !isDeleting && setSessionToDelete(null)}>
          <div 
            className="bg-[#151515] border border-[#333] rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={24} className="text-[#FF1801]" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Delete Session</h3>
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Are you sure you want to delete this session? This action cannot be undone and all telemetry data will be permanently lost.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-[#242424] hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-[#FF1801] hover:bg-[#D11401] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Activity size={18} className="animate-spin" /> : null}
                {isDeleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
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
  if (comp.includes('soft') || comp === 'c16') { borderColor = 'border-[#FF2800]'; textColor = 'text-[#FF2800]'; letter = 'S'; }
  else if (comp.includes('medium') || comp === 'c17') { borderColor = 'border-[#FCD700]'; textColor = 'text-[#FCD700]'; letter = 'M'; }
  else if (comp.includes('hard') || comp === 'c18') { borderColor = 'border-[#FFFFFF]'; textColor = 'text-[#FFFFFF]'; letter = 'H'; }
  else if (comp.includes('inter') || comp === 'c7') { borderColor = 'border-[#309f46]'; textColor = 'text-[#309f46]'; letter = 'I'; }
  else if (comp.includes('wet') || comp === 'c8') { borderColor = 'border-[#0a5b86]'; textColor = 'text-[#0a5b86]'; letter = 'W'; }

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
    <div className="min-h-screen p-6 max-w-7xl mx-auto font-f1">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <Link to={`/track/${track.id}`} className="text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] p-2 rounded-lg border border-white/5 hover:border-[#FF1801]">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-5xl font-black text-white uppercase tracking-tight">
            {session ? formatSessionType(session.type) : 'SESSION DETAILS'}
          </h1>
        </div>
        <div className="flex items-center gap-6 text-gray-400 font-medium">
          <span className="flex items-center gap-2"><MapPin size={18} className="text-[#FF1801]" /> {track.name}</span>
          {session && (
            <>
              <span className="flex items-center gap-2"><Calendar size={18} className="text-[#FF1801]" /> {session.date.split(' ')[0]}</span>
              <span className="flex items-center gap-2"><Clock size={18} className="text-[#FF1801]" /> {session.date.split(' ')[1]}</span>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-col bg-[#050505] border border-[#151515] rounded-xl overflow-hidden shadow-2xl">
        {/* Header Row for columns */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-[#151515] text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#0a0a0a]">
          <div className="col-span-1 text-center">Lap</div>
          <div className="col-span-2">Sector 1</div>
          <div className="col-span-2">Sector 2</div>
          <div className="col-span-2">Sector 3</div>
          <div className="col-span-2">Lap Time</div>
          <div className="col-span-2 text-center">Tyre</div>
          <div className="col-span-1 text-right">Wear</div>
        </div>

        {laps.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-sm">
            No laps recorded.
          </div>
        ) : (
          laps.map((lap, index) => {
            const isPersonalBestLap = lap.total === bestLap.val;
            const isPersonalBestS1 = lap.s1 === bestS1.val;
            const isPersonalBestS2 = lap.s2 === bestS2.val;
            const isPersonalBestS3 = lap.s3 === bestS3.val;

            // Check against overall session bests (from all drivers)
            const isOverallBestLap = session?.best_lap_overall && Math.abs(lap.total - session.best_lap_overall) < 0.002;
            const isOverallBestS1 = session?.best_s1 && Math.abs(lap.s1 - session.best_s1) < 0.002;
            const isOverallBestS2 = session?.best_s2 && Math.abs(lap.s2 - session.best_s2) < 0.002;
            const isOverallBestS3 = session?.best_s3 && Math.abs(lap.s3 - session.best_s3) < 0.002;

            return (
              <div
                key={lap.lap}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-6 hover:bg-[#0a0a0a] transition-colors group ${
                  index !== laps.length - 1 ? 'border-b border-[#151515]' : ''
                }`}
              >
                {/* LAP NUMBER */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-black/50 rounded-lg border border-white/5 group-hover:border-[#FF1801]/30 transition-colors">
                    <span className="text-xl font-black text-white">{lap.lap}</span>
                  </div>
                </div>

                {/* SECTORS */}
                <div className="col-span-2 flex flex-col">
                  <span className="md:hidden text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Sector 1</span>
                  <span className={`text-lg font-mono font-bold ${isOverallBestS1 ? 'text-[#b82ee6]' : isPersonalBestS1 ? 'text-[#4db721]' : 'text-gray-300'}`}>
                    {formatSector(lap.s1)}
                  </span>
                </div>
                <div className="col-span-2 flex flex-col">
                  <span className="md:hidden text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Sector 2</span>
                  <span className={`text-lg font-mono font-bold ${isOverallBestS2 ? 'text-[#b82ee6]' : isPersonalBestS2 ? 'text-[#4db721]' : 'text-gray-300'}`}>
                    {formatSector(lap.s2)}
                  </span>
                </div>
                <div className="col-span-2 flex flex-col">
                  <span className="md:hidden text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Sector 3</span>
                  <span className={`text-lg font-mono font-bold ${isOverallBestS3 ? 'text-[#b82ee6]' : isPersonalBestS3 ? 'text-[#4db721]' : 'text-gray-300'}`}>
                    {formatSector(lap.s3)}
                  </span>
                </div>

                {/* TOTAL TIME */}
                <div className="col-span-2 flex flex-col">
                  <span className="md:hidden text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Lap Time</span>
                  <span className={`text-xl font-mono font-black ${isOverallBestLap ? 'text-[#b82ee6]' : isPersonalBestLap ? 'text-[#4db721]' : 'text-white'}`}>
                    {formatTime(lap.total)}
                  </span>
                </div>

                {/* TYRE */}
                <div className="col-span-2 flex justify-start md:justify-center items-center">
                  <span className="md:hidden text-[10px] text-gray-500 uppercase font-bold tracking-wider mr-4">Tyre</span>
                  <TyreBadge compound={lap.compound} />
                </div>

                {/* WEAR */}
                <div className="col-span-1 flex justify-start md:justify-end items-center">
                  <span className="md:hidden text-[10px] text-gray-500 uppercase font-bold tracking-wider mr-4">Wear</span>
                  <span className="text-sm font-mono font-bold text-gray-500">
                    {lap.wear ? `${lap.wear}%` : '-'}
                  </span>
                </div>
              </div>
            );
          })
        )}
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
