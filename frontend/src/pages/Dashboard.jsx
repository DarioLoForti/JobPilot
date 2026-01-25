import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircularProgress, Grid, Paper, Typography, Button, Box, 
  Avatar, Chip 
} from '@mui/material'; // ✅ Import standard per stabilità
import { 
  Add, Psychology, CalendarToday, TrendingUp, 
  ArrowForward, WorkOutline 
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

        // 2. Fetch AI Coach History (Gestito con try/catch separato per non bloccare tutto)
        try {
            const coachRes = await fetch('/api/coach/history', { headers: { 'Authorization': `Bearer ${token}` } });
            if (coachRes.ok) {
              const coachData = await coachRes.json();
              setCoachProfile(coachData);
            }
        } catch (e) { console.warn("Coach history non disponibile", e); }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-slate-900 dark:text-slate-100 pb-24"> {/* Added pb-24 per mobile scroll */}
      
      {/* HEADER & WELCOME */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <Typography variant="caption" className="uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
            Dashboard
          </Typography>
          <h1 className="text-3xl md:text-4xl font-black mt-1 leading-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{user?.first_name}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">
            Hai <span className="font-bold text-slate-800 dark:text-white">{interviewsCount} colloqui</span> attivi e <span className="font-bold text-slate-800 dark:text-white">{appliedCount} candidature</span> in attesa.
          </p>
        </div>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<Add />}
          onClick={() => navigate('/jobs')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-1 w-full md:w-auto"
        >
          Nuova Candidatura
        </Button>
      </div>

      <Grid container spacing={3}> {/* Spacing 3 è più equilibrato su mobile */}
        
        {/* COLONNA SINISTRA (MAIN CONTENT) */}
        <Grid item xs={12} lg={8}>
          
          {/* 1. NEXT INTERVIEW CARD (Visibile solo se c'è un colloquio) */}
          {nextInterview && (
            <Paper className="p-6 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                    <CalendarToday fontSize="small" /> Prossimo Colloquio
                  </div>
                  <Typography variant="h5" className="font-bold mb-1 line-clamp-1">
                    {nextInterview.position}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium line-clamp-1">
                    presso {nextInterview.company}
                  </Typography>
                </div>
                <div className="text-left sm:text-right bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20 w-full sm:w-auto">
                  <Typography variant="h6" className="font-bold">
                    {new Date(nextInterview.interview_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </Typography>
                  <Typography variant="body2" className="opacity-90">
                    {new Date(nextInterview.interview_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </div>
              </div>
              {/* Decorazione Sfondo */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </Paper>
          )}

          {/* 2. STATISTICHE GENERALI (Il componente grafico) */}
          <JobStats jobs={jobs} />

          {/* 3. LISTA RECENTI */}
          <Paper className="mt-6 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">Attività Recente</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/jobs')} className="text-blue-600 dark:text-blue-400 font-bold">Vedi tutti</Button>
            </div>
            <div className="space-y-3">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-900 transition-colors gap-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 font-bold rounded-xl">
                        {job.company[0]}
                      </Avatar>
                      <div className="min-w-0"> {/* min-w-0 per far funzionare il truncate */}
                        <Typography className="font-bold text-slate-800 dark:text-slate-200 truncate">{job.position}</Typography>
                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400 truncate block">{job.company}</Typography>
                      </div>
                    </div>
                    <Chip 
                      label={job.status.toUpperCase()} 
                      size="small" 
                      className={`font-bold rounded-lg w-fit ${
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
          <Paper className="p-6 rounded-3xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-slate-800 relative overflow-hidden mb-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="bg-blue-600 text-white rounded-xl">
                  <Psychology />
                </Avatar>
                <Typography variant="h6" className="font-bold text-blue-900 dark:text-blue-100">AI Coach</Typography>
              </div>
              
              {coachProfile ? (
                <>
                  <Typography variant="caption" className="uppercase font-bold text-blue-400 tracking-wider">Il tuo Archetipo</Typography>
                  <Typography variant="h5" className="font-black text-slate-800 dark:text-white mb-3 mt-1 leading-tight">
                    {coachProfile.archetype || "Analisi non completata"}
                  </Typography>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {coachProfile.strengths?.slice(0, 2).map((s, i) => (
                      <Chip key={i} label={s} size="small" className="bg-white dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600" />
                    ))}
                  </div>
                  <Button variant="outlined" fullWidth onClick={() => navigate('/coach')} className="border-2 border-blue-600 text-blue-600 dark:text-blue-300 dark:border-blue-500 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-slate-700">
                    Vai al Coach
                  </Button>
                </>
              ) : (
                <>
                  <Typography className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                    Non hai ancora scoperto il tuo archetipo professionale? Fai il test ora.
                  </Typography>
                  <Button variant="contained" fullWidth onClick={() => navigate('/coach')} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">
                    Inizia Test
                  </Button>
                </>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </Paper>

          {/* WIDGET QUICK ACTIONS */}
          <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Typography variant="h6" className="font-bold text-slate-800 dark:text-white mb-4">Azioni Rapide</Typography>
            <div className="space-y-3">
              <Button 
                fullWidth 
                startIcon={<Add />} 
                onClick={() => navigate('/jobs')} 
                className="justify-start py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-semibold"
              >
                Aggiungi Candidatura
              </Button>
              <Button 
                fullWidth 
                startIcon={<TrendingUp />} 
                onClick={() => navigate('/profile')} 
                className="justify-start py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-semibold"
              >
                Aggiorna CV
              </Button>
              <Button 
                fullWidth 
                startIcon={<Psychology />} 
                onClick={() => navigate('/coach')} 
                className="justify-start py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-semibold"
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