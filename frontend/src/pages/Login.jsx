import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, InputAdornment } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
        window.location.reload(); // Per aggiornare la navbar
      } else {
        setError(data.error);
      }
    } catch (err) { setError('Errore di connessione'); }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      
      {/* CARD PRINCIPALE */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 transition-all">
        
        {/* Intestazione */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bentornato 👋</h1>
            <p className="text-slate-500 dark:text-slate-400">Inserisci le tue credenziali per accedere</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input Email con stile MUI ma colori Tailwind friendly */}
            <TextField 
                fullWidth 
                label="Email" 
                variant="outlined"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><EmailIcon className="text-slate-400" /></InputAdornment>,
                }}
            />

            <TextField 
                fullWidth 
                label="Password" 
                type="password"
                variant="outlined"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon className="text-slate-400" /></InputAdornment>,
                }}
            />

            <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
            >
                Accedi
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Non hai ancora un account?{' '}
            <span 
                onClick={() => navigate('/register')} 
                className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer hover:underline"
            >
                Registrati gratis
            </span>
        </div>

      </div>
    </div>
  );
}