import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '@mui/material';

export default function Register() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
        window.location.reload();
      } else {
        setError(data.error);
      }
    } catch (err) { setError('Errore di connessione'); }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Crea Account 🚀</h1>
            <p className="text-slate-500 dark:text-slate-400">Uniscini a JobPilot e decolla verso il successo</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <TextField label="Nome" fullWidth value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                <TextField label="Cognome" fullWidth value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <TextField label="Email" fullWidth type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <TextField label="Password" fullWidth type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />

            <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Registrati
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
            Hai già un account? <span onClick={() => navigate('/login')} className="font-semibold text-blue-600 cursor-pointer hover:underline">Accedi</span>
        </div>
      </div>
    </div>
  );
}