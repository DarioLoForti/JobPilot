import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import JobStats from '../components/JobStats';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Benvenuto');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) { navigate('/'); return; }
    if (userData) setUser(JSON.parse(userData));

    // Determina il saluto
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buongiorno ☀️');
    else if (hour < 18) setGreeting('Buon pomeriggio 🌤️');
    else setGreeting('Buonasera 🌙');

    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setJobs(await res.json());
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchJobs();
  }, [navigate]);

  if (loading) return <div className="flex justify-center mt-20"><CircularProgress /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* HEADER BENVENUTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{user?.first_name}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Ecco il punto sulla tua carriera oggi.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigate('/jobs')} 
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 text-center"
          >
            Gestisci Candidature
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center"
          >
            Il mio CV
          </button>
        </div>
      </div>

      {/* STATISTICHE WIDGET */}
      <JobStats jobs={jobs} />

    </div>
  );
}