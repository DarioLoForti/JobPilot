import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircularProgress, Paper, Typography, Button, 
  Avatar, Chip, LinearProgress, IconButton, Tooltip, Box, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material'; 
import { 
  Add, Psychology, TrendingUp, ArrowForward, WorkOutline, 
  EmojiEvents, Lightbulb, CheckCircle, HighlightOff, Send, 
  AutoAwesome, PieChart, ChevronLeft, ChevronRight, AccessTime,
  CalendarToday, MarkEmailUnread, CloudUpload, AutoFixHigh
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// --- CHART.JS IMPORTS ---
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// --- DATE-FNS IMPORTS ---
import { 
  format, startOfWeek, addDays, startOfMonth, endOfMonth, 
  endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { it } from 'date-fns/locale';

// Registrazione componenti Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Filler);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Ciao');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [coachProfile, setCoachProfile] = useState(null);

  // KPIs
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // CV Upload State
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const WEEKLY_TARGET = 5; 

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // 1. Caricamento iniziale veloce da LocalStorage (per evitare flash vuoti)
    const localData = localStorage.getItem('user');
    if (localData && localData !== "undefined") {
      try { setUser(JSON.parse(localData)); } catch (e) {}
    }

    if (!token) { navigate('/'); return; }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buongiorno');
    else if (hour < 18) setGreeting('Buon pomeriggio');
    else setGreeting('Buonasera');

    const fetchData = async () => {
      try {
        // A. RECUPERA PROFILO UTENTE AGGIORNATO
        const userRes = await fetch('/api/users/profile', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData); // Aggiorna lo stato con i dati freschi dal DB
            localStorage.setItem('user', JSON.stringify(userData)); // Aggiorna anche il localStorage per il futuro
        }

        // B. RECUPERA JOBS
        const jobsRes = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData);
          
          // Stats Calculation
          const now = new Date();
          const startOfWk = new Date(now.setDate(now.getDate() - now.getDay() + 1)); 
          startOfWk.setHours(0,0,0,0);
          const thisWeekJobs = jobsData.filter(j => new Date(j.created_at) >= startOfWk);
          setWeeklyCount(thisWeekJobs.length);
          setWeeklyProgress(Math.min((thisWeekJobs.length / WEEKLY_TARGET) * 100, 100));

          const totalApplied = jobsData.filter(j => j.status !== 'wishlist').length;
          const totalInterviews = jobsData.filter(j => j.status === 'interview' || j.status === 'offer').length;
          setConversionRate(totalApplied > 0 ? Math.round((totalInterviews / totalApplied) * 100) : 0);

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          setFollowUpCount(jobsData.filter(j => j.status === 'applied' && new Date(j.created_at) < sevenDaysAgo).length);
        }

        // C. RECUPERA COACH
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

  // --- CHART DATA PREPARATION ---
  const chartData = useMemo(() => {
    const labels = [];
    const dataPoints = [];
    const today = new Date();
    
    // Ultimi 14 giorni
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        labels.push(format(d, 'dd MMM', { locale: it }));
        
        const count = jobs.filter(j => {
            const jobDate = new Date(j.created_at).toISOString().split('T')[0];
            return jobDate === dateStr;
        }).length;
        dataPoints.push(count);
    }

    return {
        labels,
        datasets: [{
            fill: true,
            label: 'Candidature',
            data: dataPoints,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4, // Linea curva
            pointRadius: 4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1',
        }]
    };
  }, [jobs]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8 } },
    scales: { 
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } }, 
        y: { display: false, min: 0 } 
    }
  };

  // --- CALENDAR LOGIC ---
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;
            
            // Trova colloqui in questo giorno
            const interviewsToday = jobs.filter(j => 
                j.status === 'interview' && 
                j.interview_date && 
                isSameDay(new Date(j.interview_date), cloneDay)
            );
            const hasInterview = interviewsToday.length > 0;
            const isSelected = isSameDay(day, selectedDate);

            days.push(
                <div
                    key={day}
                    className={`flex flex-col items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-all relative
                        ${!isSameMonth(day, monthStart) ? "text-slate-300 dark:text-slate-600" : isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"}
                        ${isToday(day) && !isSelected ? "border border-indigo-500 text-indigo-600 dark:text-indigo-400" : ""}
                    `}
                    onClick={() => setSelectedDate(cloneDay)}
                >
                    <span className="text-sm font-bold z-10">{formattedDate}</span>
                    {hasInterview && !isSelected && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(<div className="flex justify-between w-full mb-2" key={day}>{days}</div>);
        days = [];
    }
    return <div className="w-full">{rows}</div>;
  };

  // Interviews for Selected Date
  const selectedInterviews = jobs.filter(j => 
    j.status === 'interview' && 
    j.interview_date && 
    isSameDay(new Date(j.interview_date), selectedDate)
  );

  // --- CV Upload Handlers ---
  const handleCvFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        setCvFile(file);
    } else {
        toast.error("Per favore carica un file PDF valido.");
    }
  };

  const handleCvUploadAndExtract = async () => {
    if (!cvFile) return;
    
    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('cv', cvFile);

    try {
        // 1. Upload
        const uploadRes = await fetch('/api/ai/upload-cv', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!uploadRes.ok) throw new Error("Errore upload");
        
        // 2. Extract Data
        setExtracting(true);
        const extractRes = await fetch('/api/ai/extract-profile', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (extractRes.ok) {
            const data = await extractRes.json();
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success("CV Caricato e Profilo Aggiornato! 🚀");
            setCvModalOpen(false);
        } else {
            throw new Error("Errore estrazione dati");
        }

    } catch (error) {
        toast.error("Si è verificato un errore.");
        console.error(error);
    } finally {
        setUploading(false);
        setExtracting(false);
    }
  };


  if (loading) return <div className="flex justify-center mt-20"><CircularProgress /></div>;

  const recentJobs = jobs.slice(0, 5);
  
  const stats = [
    { title: 'Candidature', count: jobs.length, icon: <WorkOutline fontSize="small" />, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20' },
    { title: 'In Attesa', count: jobs.filter(j => j.status === 'applied').length, icon: <Send fontSize="small" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', badge: followUpCount > 0 ? followUpCount : null },
    { title: 'Colloqui', count: jobs.filter(j => j.status === 'interview').length, icon: <CheckCircle fontSize="small" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
    { title: 'Success Rate', count: `${conversionRate}%`, icon: <PieChart fontSize="small" />, color: conversionRate > 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500', bg: conversionRate > 10 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  ];

  const dateOptions = { weekday: 'short', day: 'numeric', month: 'long' };
  const formattedDate = currentTime.toLocaleDateString('it-IT', dateOptions);
  const formattedTime = currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const getSmartTip = () => {
    if (selectedInterviews.length > 0) return { text: "Focus sul colloquio di oggi!", icon: <CalendarToday />, style: "from-indigo-100 to-purple-100 border-indigo-200 text-indigo-700 dark:from-indigo-500/20 dark:to-purple-500/20 dark:border-indigo-500/50 dark:text-indigo-200" };
    if (followUpCount > 0) return { text: `${followUpCount} Follow-up da fare`, icon: <HighlightOff />, style: "from-orange-100 to-red-100 border-orange-200 text-orange-700 dark:from-orange-500/20 dark:to-red-500/20 dark:border-orange-500/50 dark:text-orange-200" };
    return { text: "Ottimizza il tuo profilo.", icon: <Lightbulb />, style: "from-cyan-100 to-blue-100 border-cyan-200 text-cyan-700 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-500/50 dark:text-cyan-200" };
  };
  const smartTip = getSmartTip();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6 pb-24 md:pb-12 text-slate-900 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-[#0f172a]">
      
      {/* 1. HEADER */}
      <div className="glass-panel p-5 rounded-3xl mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
        <div className="flex items-center gap-4 w-full">
            <div className="hidden md:block">
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'transparent', border: '2px solid rgba(148, 163, 184, 0.2)' }}>{user?.first_name?.[0] || <WorkOutline />}</Avatar>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <span>{formattedDate}</span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-blue-600 dark:text-cyan-400">{formattedTime}</span>
                </div>
                {/* SALUTO CON NOME UTENTE AGGIORNATO */}
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400">{user?.first_name || 'JobPilot'}</span>
                </h1>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${smartTip.style} border backdrop-blur-md cursor-pointer hover:scale-105 transition-transform`} onClick={() => navigate('/jobs')}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(255,255,255,0.5)' }} className="text-slate-700">{smartTip.icon}</Avatar>
                <Typography variant="caption" className="font-bold hidden sm:block">{smartTip.text}</Typography>
            </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
            <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setCvModalOpen(true)} className="border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:border-slate-500 dark:hover:border-white hover:text-slate-800 dark:hover:text-white w-full lg:w-auto px-4 py-3 rounded-xl font-bold">
                Carica CV
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/jobs')} className="btn-neon w-full lg:w-auto px-6 py-3 rounded-xl font-bold">
                Nuova Candidatura
            </Button>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, idx) => (
            <div key={idx} className={`glass-panel p-4 rounded-2xl flex flex-col justify-between gap-1 border-t-2 bg-white dark:bg-transparent shadow-md dark:shadow-none ${stat.bg.split(' ')[2]}`}> 
                <div className="flex justify-between items-center w-full relative">
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} backdrop-blur-sm`}>{stat.icon}</div>
                    <span className={`text-2xl font-black ${stat.color} drop-shadow-sm`}>{stat.count}</span>
                    {stat.badge && (<div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-red-500/50 shadow-lg">{stat.badge} ALERT</div>)}
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{stat.title}</span>
            </div>
        ))}
      </div>

      {/* 3. LAYOUT PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNA SINISTRA (Chart + Attività) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* GRAFICO CHART.JS */}
            <Paper className="glass-panel p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp className="text-indigo-500"/> Andamento Candidature</Typography>
                    <Chip label="Ultimi 14 giorni" size="small" className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold" />
                </div>
                <div className="flex-1 w-full relative h-[220px]">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </Paper>

            {/* FEED ATTIVITÀ */}
            <Paper className="glass-panel p-5 rounded-3xl flex-1 flex flex-col min-h-[300px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                <div className="flex justify-between items-center mb-4 px-1">
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">Attività Recente</Typography>
                    <IconButton size="small" onClick={() => navigate('/jobs')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg"><ArrowForward fontSize="small" /></IconButton>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {recentJobs.map((job) => (
                        <div key={job.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3 w-full group cursor-pointer" onClick={() => navigate('/jobs')}>
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <Avatar className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold rounded-xl w-10 h-10 border border-slate-300 dark:border-white/10 text-xs shrink-0">{job.company[0]}</Avatar>
                                <div className="min-w-0 flex-1">
                                    <Typography className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{job.position}</Typography>
                                    <Typography variant="caption" className="text-slate-500 truncate block text-xs font-medium uppercase tracking-wide">{job.company}</Typography>
                                </div>
                            </div>
                            <Chip label={job.status} size="small" className={`h-6 px-1 text-[9px] font-black uppercase tracking-wider border shrink-0 ${job.status === 'interview' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`} />
                        </div>
                    ))}
                </div>
            </Paper>
        </div>

        {/* COLONNA DESTRA (Calendario + Widget) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* CALENDARIO SMART */}
            <Paper className="glass-panel p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                <div className="flex justify-between items-center mb-6">
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white capitalize">{format(currentMonth, 'MMMM yyyy', { locale: it })}</Typography>
                    <div className="flex gap-1">
                        <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft /></IconButton>
                        <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></IconButton>
                    </div>
                </div>
                
                {/* Griglia Calendario */}
                <div className="grid grid-cols-7 mb-2">
                    {/* FIX: Uso l'indice (i) come key perché 'M' appare due volte */}
                    {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
                        <span key={i} className="text-center text-xs font-bold text-slate-400 py-2">{d}</span>
                    ))}
                </div>
                {renderCalendar()}

                {/* Dettagli Giorno Selezionato */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <Typography variant="caption" className="uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                        {isToday(selectedDate) ? "Oggi" : format(selectedDate, 'd MMMM', { locale: it })}
                    </Typography>
                    
                    {selectedInterviews.length > 0 ? (
                        <div className="space-y-2">
                            {selectedInterviews.map(int => (
                                <div key={int.id} className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex gap-3 items-center">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-300"><AccessTime fontSize="small"/></div>
                                    <div className="min-w-0">
                                        <Typography variant="subtitle2" className="font-bold text-indigo-900 dark:text-white truncate">{int.company}</Typography>
                                        <Typography variant="caption" className="text-indigo-600 dark:text-indigo-300 block">{new Date(int.interview_date).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})} - Colloquio</Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Typography variant="body2" className="text-slate-400 italic text-sm">Nessun colloquio programmato.</Typography>
                    )}
                </div>
            </Paper>

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
                    <IconButton className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white rounded-xl w-10 h-10 shadow-lg shadow-indigo-500/30 shrink-0"><ArrowForward fontSize="small" /></IconButton>
                </div>
            </Paper>

        </div>
      </div>

      {/* CV UPLOAD MODAL */}
      <Dialog 
        open={cvModalOpen} 
        onClose={() => setCvModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: "rounded-3xl glass-panel bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white" }}
      >
          <DialogTitle className="flex items-center gap-2 font-black border-b border-slate-200 dark:border-white/10 pb-4">
              <CloudUpload className="text-indigo-500"/> Carica il tuo CV
          </DialogTitle>
          <DialogContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-6">
                  <input
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      id="raised-button-file"
                      type="file"
                      onChange={handleCvFileChange}
                  />
                  <label htmlFor="raised-button-file" className="w-full">
                      <div className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${cvFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          {cvFile ? (
                              <>
                                  <CheckCircle fontSize="large" className="text-emerald-500 mb-2" />
                                  <Typography className="font-bold text-emerald-700 dark:text-emerald-400">{cvFile.name}</Typography>
                                  <Typography variant="caption" className="text-emerald-600 dark:text-emerald-500">Pronto per l'upload</Typography>
                              </>
                          ) : (
                              <>
                                  <CloudUpload fontSize="large" className="text-slate-400 mb-2" />
                                  <Typography className="font-bold text-slate-600 dark:text-slate-300">Clicca per selezionare il PDF</Typography>
                                  <Typography variant="caption" className="text-slate-400">Solo file .pdf</Typography>
                              </>
                          )}
                      </div>
                  </label>
                  
                  {cvFile && (
                      <Typography variant="caption" className="text-slate-500 text-center max-w-xs">
                          L'AI analizzerà il tuo CV per estrarre automaticamente skills ed esperienze.
                      </Typography>
                  )}
              </div>
          </DialogContent>
          <DialogActions className="p-6 border-t border-slate-200 dark:border-white/10">
              <Button onClick={() => setCvModalOpen(false)} className="text-slate-500">Annulla</Button>
              <Button 
                  variant="contained" 
                  onClick={handleCvUploadAndExtract}
                  disabled={!cvFile || uploading || extracting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-6"
                  startIcon={uploading || extracting ? <CircularProgress size={20} color="inherit"/> : <AutoFixHigh />}
              >
                  {uploading ? "Caricamento..." : extracting ? "Analisi AI..." : "Carica e Analizza"}
              </Button>
          </DialogActions>
      </Dialog>

    </div>
  );
}