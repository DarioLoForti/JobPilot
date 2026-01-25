import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircularProgress, Paper, Typography, Button, 
  Avatar, Chip, LinearProgress, IconButton 
} from '@mui/material'; 
import { 
  Add, Psychology, CalendarToday, TrendingUp, 
  ArrowForward, WorkOutline, AccessTime, 
  EmojiEvents, Lightbulb, CheckCircle, 
  HighlightOff, Send, AutoAwesome
} from '@mui/icons-material';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Ciao');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextInterview, setNextInterview] = useState(null);
  const [coachProfile, setCoachProfile] = useState(null);

  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const WEEKLY_TARGET = 5; 

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) { navigate('/'); return; }

    if (userData && userData !== "undefined") {
      try { setUser(JSON.parse(userData)); } 
      catch (error) { localStorage.removeItem('user'); }
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buongiorno');
    else if (hour < 18) setGreeting('Buon pomeriggio');
    else setGreeting('Buonasera');

    const fetchData = async () => {
      try {
        const jobsRes = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData);
          
          const upcoming = jobsData
            .filter(j => j.status === 'interview' && j.interview_date && new Date(j.interview_date) > new Date())
            .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));
          if (upcoming.length > 0) setNextInterview(upcoming[0]);

          const now = new Date();
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); 
          startOfWeek.setHours(0,0,0,0);
          const thisWeekJobs = jobsData.filter(j => new Date(j.created_at) >= startOfWeek);
          setWeeklyCount(thisWeekJobs.length);
          setWeeklyProgress(Math.min((thisWeekJobs.length / WEEKLY_TARGET) * 100, 100));
        }

        try {
            const coachRes = await fetch('/api/coach/history', { headers: { 'Authorization': `Bearer ${token}` } });
            if (coachRes.ok) setCoachProfile(await coachRes.json());
        } catch (e) {}

      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    
    fetchData();
    return () => clearInterval(timer);
  }, [navigate]);

  if (loading) return <div className="flex justify-center mt-20"><CircularProgress /></div>;

  const recentJobs = jobs.slice(0, 5);
  
  const stats = [
    { title: 'Totali', count: jobs.length, icon: <WorkOutline fontSize="small" />, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20' },
    { title: 'Inviate', count: jobs.filter(j => j.status === 'applied').length, icon: <Send fontSize="small" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
    { title: 'Colloqui', count: jobs.filter(j => j.status === 'interview').length, icon: <CheckCircle fontSize="small" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
    { title: 'Rifiutate', count: jobs.filter(j => j.status === 'rejected').length, icon: <HighlightOff fontSize="small" />, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20' },
  ];

  const dateOptions = { weekday: 'short', day: 'numeric', month: 'long' };
  const formattedDate = currentTime.toLocaleDateString('it-IT', dateOptions);
  const formattedTime = currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const getSmartTip = () => {
    if (nextInterview) return { text: "Colloquio in arrivo! Ripassa.", icon: <CalendarToday />, style: "from-indigo-100 to-purple-100 border-indigo-200 text-indigo-700 dark:from-indigo-500/20 dark:to-purple-500/20 dark:border-indigo-500/50 dark:text-indigo-200" };
    if (weeklyCount === 0) return { text: "Invia una candidatura!", icon: <TrendingUp />, style: "from-amber-100 to-orange-100 border-amber-200 text-amber-700 dark:from-amber-500/20 dark:to-orange-500/20 dark:border-amber-500/50 dark:text-amber-200" };
    return { text: "Ottimizza il tuo profilo.", icon: <Lightbulb />, style: "from-cyan-100 to-blue-100 border-cyan-200 text-cyan-700 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-500/50 dark:text-cyan-200" };
  };
  const smartTip = getSmartTip();

  return (
    // FIX QUI: bg-slate-100 (Grigio) invece di slate-900 o 50
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6 pb-24 md:pb-12 text-slate-900 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-[#0f172a]">
      
      {/* 1. HEADER */}
      <div className="glass-panel p-5 rounded-3xl mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
        
        <div className="flex items-center gap-4 w-full">
            <div className="hidden md:block">
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'transparent', border: '2px solid rgba(148, 163, 184, 0.2)' }}>
                    {user?.first_name?.[0]}
                </Avatar>
            </div>
            
            <div className="flex-1">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <span>{formattedDate}</span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-blue-600 dark:text-cyan-400">{formattedTime}</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400">{user?.first_name}</span>
                </h1>
            </div>

            {/* Smart Tip */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${smartTip.style} border backdrop-blur-md`}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(255,255,255,0.5)' }} className="text-slate-700">{smartTip.icon}</Avatar>
                <Typography variant="caption" className="font-bold hidden sm:block">{smartTip.text}</Typography>
            </div>
        </div>

        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/jobs')} className="btn-neon w-full lg:w-auto px-6 py-3 rounded-xl font-bold">
          Nuova Candidatura
        </Button>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, idx) => (
            <div key={idx} className={`glass-panel p-4 rounded-2xl flex flex-col justify-between gap-1 border-t-2 bg-white dark:bg-transparent shadow-md dark:shadow-none ${stat.bg.split(' ')[2]}`}> 
                <div className="flex justify-between items-center w-full">
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} backdrop-blur-sm`}>{stat.icon}</div>
                    <span className={`text-2xl font-black ${stat.color} drop-shadow-sm`}>{stat.count}</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{stat.title}</span>
            </div>
        ))}
      </div>

      {/* 3. LAYOUT PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* COLONNA SINISTRA */}
        <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* Next Interview */}
            <Paper className={`card-3d p-6 rounded-3xl relative overflow-hidden border-none! w-full ${!nextInterview ? 'min-h-[100px] flex items-center justify-center bg-slate-100 dark:bg-slate-800/50' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                {!nextInterview ? (
                    <div className="flex items-center gap-3 opacity-50">
                        <CalendarToday fontSize="medium" className="text-slate-400" />
                        <Typography variant="body2" className="text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">Nessun colloquio</Typography>
                    </div>
                ) : (
                    <div className="relative z-10 text-white">
                        <div className="flex justify-between items-start mb-3">
                            <Chip label="Next Up" size="small" className="bg-white/20 text-white font-bold backdrop-blur-md h-6 border border-white/10" />
                            <div className="text-right">
                                <Typography variant="h5" className="font-black leading-none">
                                    {new Date(nextInterview.interview_date).getDate()}
                                </Typography>
                                <Typography variant="caption" className="uppercase text-blue-200 font-bold tracking-widest text-[10px]">
                                    {new Date(nextInterview.interview_date).toLocaleString('it-IT', { month: 'short' })}
                                </Typography>
                            </div>
                        </div>
                        <Typography variant="h6" className="font-bold truncate">{nextInterview.position}</Typography>
                        <Typography className="text-blue-100 text-xs font-medium opacity-80 mb-3">{nextInterview.company}</Typography>
                        <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-cyan-300 font-bold text-sm">
                            <AccessTime fontSize="small" /> {new Date(nextInterview.interview_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                )}
            </Paper>

            {/* FEED ATTIVITÀ */}
            <Paper className="glass-panel p-5 rounded-3xl flex-1 flex flex-col min-h-[300px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                <div className="flex justify-between items-center mb-4 px-1">
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">Attività</Typography>
                    <IconButton size="small" onClick={() => navigate('/jobs')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg"><ArrowForward fontSize="small" /></IconButton>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {recentJobs.length > 0 ? (
                        recentJobs.map((job) => (
                            <div key={job.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3 w-full" onClick={() => navigate('/jobs')}>
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <Avatar className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold rounded-xl w-10 h-10 border border-slate-300 dark:border-white/10 text-xs shrink-0">
                                        {job.company[0]}
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <Typography className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{job.position}</Typography>
                                        <Typography variant="caption" className="text-slate-500 truncate block text-xs font-medium uppercase tracking-wide">{job.company}</Typography>
                                    </div>
                                </div>
                                <Chip 
                                    label={job.status} 
                                    size="small" 
                                    className={`h-6 px-1 text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                        job.status === 'interview' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20' :
                                        job.status === 'offer' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' :
                                        'bg-slate-200 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600/30'
                                    }`} 
                                />
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 opacity-50">
                            <WorkOutline fontSize="large" className="mb-2"/>
                            <Typography variant="caption">Nessuna attività</Typography>
                        </div>
                    )}
                </div>
            </Paper>
        </div>

        {/* COLONNA DESTRA */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* Weekly Goal */}
            <Paper className="glass-panel p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0"><EmojiEvents fontSize="small" /></div>
                        <div>
                            <Typography className="font-bold text-slate-800 dark:text-white text-sm">Obiettivo Week</Typography>
                            <Typography variant="caption" className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Target: {WEEKLY_TARGET}</Typography>
                        </div>
                    </div>
                    <span className="text-xl font-black text-amber-500 dark:text-amber-400">{weeklyCount}</span>
                </div>
                <LinearProgress variant="determinate" value={weeklyProgress} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-full" sx={{ '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: 10 } }} />
            </Paper>

            {/* AI Coach Mini */}
            <Paper className="glass-panel p-5 rounded-3xl bg-gradient-to-br from-indigo-100 to-white dark:from-indigo-900/40 dark:to-slate-900/40 border border-indigo-200 dark:border-indigo-500/30 relative overflow-hidden group shadow-xl dark:shadow-none cursor-pointer" onClick={() => navigate('/coach')}>
                <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                        <Typography className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 text-[10px] uppercase tracking-widest mb-1"><AutoAwesome style={{fontSize:12}}/> AI Coach</Typography>
                        <Typography variant="h6" className="font-black text-slate-900 dark:text-white leading-none">{coachProfile?.archetype || "Fai il test"}</Typography>
                    </div>
                    <IconButton className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white rounded-xl w-10 h-10 shadow-lg shadow-indigo-500/30 shrink-0">
                        <ArrowForward fontSize="small" />
                    </IconButton>
                </div>
            </Paper>

            {/* Quick Tools */}
            <Paper className="glass-panel p-5 rounded-3xl flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-white mb-4 px-1">Strumenti</Typography>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {[
                        { icon: <Add />, label: "Candidatura", action: () => navigate('/jobs'), color: "group-hover:text-cyan-500" },
                        { icon: <TrendingUp />, label: "Gestione CV", action: () => navigate('/profile'), color: "group-hover:text-emerald-500" },
                        { icon: <Psychology />, label: "Simulatore", action: () => navigate('/coach'), color: "group-hover:text-purple-500" }
                    ].map((item, idx) => (
                        <Button 
                            key={idx}
                            fullWidth 
                            startIcon={<span className={`text-slate-400 ${item.color} transition-colors`}>{item.icon}</span>}
                            onClick={item.action} 
                            className="group justify-start py-3 px-4 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 rounded-2xl font-semibold transition-all text-xs sm:text-sm shadow-sm"
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
            </Paper>

        </div>

      </div>
    </div>
  );
}