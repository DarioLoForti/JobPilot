import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Paper, Typography, Box, 
  InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; 
import toast from 'react-hot-toast';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login effettuato!');
        navigate('/dashboard');
      } else {
        toast.error(data.error || 'Errore nel login');
      }
    } catch (error) {
      toast.error('Errore di connessione al server');
    }
  };

  return (
    // FIX: Sfondo Slate-100 (Grigio Chiaro)
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4 transition-colors duration-300">
      <Paper className="p-8 md:p-10 w-full max-w-md rounded-3xl shadow-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 animate-fade-in">
        <Box className="text-center mb-8">
          <Typography variant="h4" className="font-black text-slate-800 dark:text-white mb-2">
            Bentornato 👋
          </Typography>
          <Typography className="text-slate-500 dark:text-slate-400">
            Inserisci le tue credenziali per accedere.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-slate-50 dark:bg-slate-900 rounded-lg"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.4)' },
                '&:hover fieldset': { borderColor: '#6366f1' },
              },
              '& .MuiInputBase-input': { color: 'inherit' },
              '& .MuiInputLabel-root': { color: 'gray' },
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'} 
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            required
            className="bg-slate-50 dark:bg-slate-900 rounded-lg"
            InputProps={{ 
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.4)' },
                '&:hover fieldset': { borderColor: '#6366f1' },
              },
              '& .MuiInputBase-input': { color: 'inherit' },
              '& .MuiInputLabel-root': { color: 'gray' },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-transform hover:-translate-y-1"
          >
            Accedi
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
            Non hai un account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
              Registrati qui
            </Link>
          </Typography>
        </div>
      </Paper>
    </div>
  );
}