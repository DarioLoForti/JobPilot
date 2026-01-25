import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircularProgress, Grid, Paper, Typography, Button, Box, 
  Avatar, Divider, Chip, IconButton 
} from '@mui/material';
import { 
  Add, Psychology, CalendarToday, TrendingUp, 
  ArrowForward, WorkOutline, CheckCircle 
} from '@mui/icons-material';
import JobStats from '../components/JobStats';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Benvenuto');
  
  // Nuovi stati per i Widget
  const [nextInterview, setNextInterview] = useState(null);
  const [coachProfile, setCoachProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) { navigate('/'); return; }

    if (userData && userData !== "undefined") {
      try { setUser(JSON.parse(userData)); } 
      catch (error) { localStorage.removeItem('user'); }
    }

    // Saluto dinamico
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buongiorno ☀️');
    else if (hour < 18) setGreeting('Buon pomeriggio 🌤️');
    else setGreeting('Buonasera 🌙');

    const fetchData = async () => {
      try {
        // 1. Fetch Jobs
        const jobsRes = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData);
          
          // Trova il prossimo colloquio
          const upcoming = jobsData
            .filter(j => j.status === 'interview' && j.interview_date && new Date(j.interview_date) > new Date())
            .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));
          
          if (upcoming.length > 0) setNextInterview(upcoming[0]);
        }

        // 2. Fetch AI Coach History (per il widget laterale)
        const coachRes = await fetch('/api/coach/history', { headers: { 'Authorization': `Bearer ${token}` } });
        if (coachRes.ok) {
          const coachData = await coachRes.json();
          setCoachProfile(coachData);
        }

      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchData();
  }, [navigate]);

  if (loading) return <div className="flex justify-center mt-20"><CircularProgress /></div>;

  // Calcolo statistiche rapide
  const recentJobs = jobs.slice(0, 5); // Ultimi 5 lavori aggiunti
  const interviewsCount = jobs.filter(j => j.status === 'interview').length;
  const appliedCount = jobs.filter(j => j.status === 'applied').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* HEADER & WELCOME */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <Typography variant="caption" className="uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
            Dashboard
          </Typography>
          <h1 className="text-4xl font-black mt-1">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{user?.first_name}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Hai <span className="font-bold text-slate-800 dark:text-white">{interviewsCount} colloqui</span> attivi e <span className="font-bold text-slate-800 dark:text-white">{appliedCount} candidature</span> in attesa.
          </p>
        </div>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<Add />}
          onClick={() => navigate('/jobs')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-1"
        >
          Nuova Candidatura
        </Button>
      </div>

      <Grid container spacing={4}>
        
        {/* COLONNA SINISTRA (MAIN CONTENT) */}
        <Grid item xs={12} lg={8}>
          
          {/* 1. NEXT INTERVIEW CARD (Visibile solo se c'è un colloquio) */}
          {nextInterview && (
            <Paper className="p-6 mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                    <CalendarToday fontSize="small" /> Prossimo Colloquio
                  </div>
                  <Typography variant="h4" className="font-black mb-1">
                    {nextInterview.position}
                  </Typography>
                  <Typography variant="h6" className="opacity-90 font-medium">
                    presso {nextInterview.company}
                  </Typography>
                </div>
                <div className="text-right bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                  <Typography variant="h5" className="font-bold">
                    {new Date(nextInterview.interview_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </Typography>
                  <Typography variant="h6">
                    {new Date(nextInterview.interview_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </div>
              </div>
              {/* Decorazione Sfondo */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            </Paper>
          )}

          {/* 2. STATISTICHE GENERALI */}
          <JobStats jobs={jobs} />

          {/* 3. LISTA RECENTI */}
          <Paper className="mt-8 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">Attività Recente</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/jobs')} className="text-blue-600">Vedi tutti</Button>
            </div>
            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 font-bold rounded-xl">
                        {job.company[0]}
                      </Avatar>
                      <div>
                        <Typography className="font-bold text-slate-800 dark:text-slate-200">{job.position}</Typography>
                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400">{job.company}</Typography>
                      </div>
                    </div>
                    <Chip 
                      label={job.status.toUpperCase()} 
                      size="small" 
                      className={`font-bold rounded-lg ${
                        job.status === 'interview' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        job.status === 'offer' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`} 
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <WorkOutline sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography>Nessuna attività recente</Typography>
                </div>
              )}
            </div>
          </Paper>

        </Grid>

        {/* COLONNA DESTRA (WIDGETS) */}
        <Grid item xs={12} lg={4}>
          
          {/* WIDGET AI COACH */}
          <Paper className="p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-slate-800 relative overflow-hidden mb-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="bg-indigo-600 text-white">
                  <Psychology />
                </Avatar>
                <Typography variant="h6" className="font-bold text-indigo-900 dark:text-indigo-100">AI Coach</Typography>
              </div>
              
              {coachProfile ? (
                <>
                  <Typography variant="caption" className="uppercase font-bold text-indigo-400">Il tuo Archetipo</Typography>
                  <Typography variant="h5" className="font-black text-slate-800 dark:text-white mb-2">
                    {coachProfile.archetype || "Analisi non completata"}
                  </Typography>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {coachProfile.strengths?.slice(0, 2).map((s, i) => (
                      <Chip key={i} label={s} size="small" className="bg-white dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300" />
                    ))}
                  </div>
                  <Button variant="outlined" fullWidth onClick={() => navigate('/coach')} className="border-indigo-600 text-indigo-600 dark:text-indigo-300 dark:border-indigo-500 rounded-xl">
                    Vai al Coach
                  </Button>
                </>
              ) : (
                <>
                  <Typography className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                    Non hai ancora scoperto il tuo archetipo professionale? Fai il test ora.
                  </Typography>
                  <Button variant="contained" fullWidth onClick={() => navigate('/coach')} className="bg-indigo-600 rounded-xl">
                    Inizia Test
                  </Button>
                </>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 dark:bg-indigo-900/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </Paper>

          {/* WIDGET QUICK ACTIONS */}
          <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Typography variant="h6" className="font-bold text-slate-800 dark:text-white mb-4">Azioni Rapide</Typography>
            <div className="space-y-3">
              <Button 
                fullWidth 
                startIcon={<Add />} 
                onClick={() => navigate('/jobs')} 
                className="justify-start py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors"
              >
                Aggiungi Candidatura
              </Button>
              <Button 
                fullWidth 
                startIcon={<TrendingUp />} 
                onClick={() => navigate('/profile')} 
                className="justify-start py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors"
              >
                Aggiorna CV
              </Button>
              <Button 
                fullWidth 
                startIcon={<Psychology />} 
                onClick={() => navigate('/coach')} 
                className="justify-start py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors"
              >
                Simula Colloquio
              </Button>
            </div>
          </Paper>

        </Grid>
      </Grid>
    </div>
  );
}