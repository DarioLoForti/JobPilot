import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Paper, Typography, Box, 
  InputAdornment, IconButton, CircularProgress 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; 
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({ 
    first_name: '', last_name: '', email: '', password: '' 
  });
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Registrazione completata!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        toast.error(data.error || 'Errore nella registrazione');
      }
    } catch (error) {
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4 transition-colors duration-300">
      <Paper className="p-8 md:p-10 w-full max-w-md rounded-3xl shadow-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 animate-fade-in">
        <Box className="text-center mb-8">
          <Typography variant="h4" className="font-black text-slate-800 dark:text-white mb-2">
            Crea Account 🚀
          </Typography>
          <Typography className="text-slate-500 dark:text-slate-400">
            Inizia il tuo viaggio professionale.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <TextField
                fullWidth label="Nome" name="first_name" variant="outlined"
                value={formData.first_name} onChange={handleChange} required
                className="bg-slate-5 dark:bg-slate-900 rounded-lg"
                sx={{ '& .MuiInputBase-input': { color: 'inherit' }, '& .MuiInputLabel-root': { color: 'gray' } }}
            />
            <TextField
                fullWidth label="Cognome" name="last_name" variant="outlined"
                value={formData.last_name} onChange={handleChange} required
                className="bg-slate-5 dark:bg-slate-900 rounded-lg"
                sx={{ '& .MuiInputBase-input': { color: 'inherit' }, '& .MuiInputLabel-root': { color: 'gray' } }}
            />
          </div>

          <TextField
            fullWidth label="Email" name="email" type="email" variant="outlined"
            value={formData.email} onChange={handleChange} required
            className="bg-slate-5 dark:bg-slate-900 rounded-lg"
            sx={{ '& .MuiInputBase-input': { color: 'inherit' }, '& .MuiInputLabel-root': { color: 'gray' } }}
          />
          
          <TextField
            fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'} 
            variant="outlined" value={formData.password} onChange={handleChange} required
            className="bg-slate-5 dark:bg-slate-900 rounded-lg"
            InputProps={{ 
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" className="text-slate-500 dark:text-slate-400">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiInputBase-input': { color: 'inherit' }, '& .MuiInputLabel-root': { color: 'gray' } }}
          />

          <Button
            type="submit" fullWidth variant="contained" size="large" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg mt-4"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Registrati"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
            Hai già un account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Accedi qui
            </Link>
          </Typography>
        </div>
      </Paper>
    </div>
  );
}