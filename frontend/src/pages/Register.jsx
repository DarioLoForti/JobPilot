import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Paper, Typography, Box, 
  InputAdornment, IconButton, List, ListItem, ListItemIcon, ListItemText, Fade 
} from '@mui/material';
import { 
  Visibility, VisibilityOff, CheckCircle, Cancel 
} from '@mui/icons-material'; 
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false); 
  
  // Validazione Password
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [validity, setValidity] = useState({
    length: false, upper: false, lower: false, number: false, special: false
  });

  // Validazione Email
  const [emailValid, setEmailValid] = useState(true);

  const navigate = useNavigate();

  // Regex Sicurezza
  const rules = {
    email: (v) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(v),
    length: (v) => v.length >= 8,
    upper: (v) => /[A-Z]/.test(v),
    lower: (v) => /[a-z]/.test(v),
    number: (v) => /\d/.test(v),
    special: (v) => /[@$!%*?&.\-_#]/.test(v),
  };

  useEffect(() => {
    const v = formData.password;
    setValidity({
        length: rules.length(v),
        upper: rules.upper(v),
        lower: rules.lower(v),
        number: rules.number(v),
        special: rules.special(v)
    });
  }, [formData.password]);

  // Check Email Real-time (solo se l'utente ha iniziato a scrivere)
  useEffect(() => {
    if (formData.email.length > 0) {
        setEmailValid(rules.email(formData.email));
    } else {
        setEmailValid(true); // Reset visuale se vuoto
    }
  }, [formData.email]);

  const isFormValid = Object.values(validity).every(Boolean) && 
                      emailValid && 
                      formData.email.length > 0 &&
                      formData.first_name && 
                      formData.last_name;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return toast.error("Controlla i dati inseriti.");

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`Benvenuto a bordo, ${formData.first_name}! 🚀`);
        navigate('/dashboard'); 
      } else {
        toast.error(data.error || 'Errore nella registrazione');
      }
    } catch (error) {
      toast.error('Errore di connessione al server');
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.4)' },
        '&:hover fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputBase-input': { color: 'inherit' },
    '& .MuiInputLabel-root': { color: 'gray' },
  };

  const PasswordRequirement = ({ met, label }) => (
    <ListItem dense sx={{ py: 0, minHeight: 24 }}>
      <ListItemIcon sx={{ minWidth: 28 }}>
        {met ? <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} /> : <Cancel sx={{ fontSize: 16, color: '#94a3b8' }} />}
      </ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 12, fontWeight: met ? 'bold' : 'normal', color: met ? '#10b981' : 'gray' }} />
    </ListItem>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4 transition-colors duration-300 py-10">
      <Paper className="p-8 md:p-10 w-full max-w-lg rounded-3xl shadow-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 animate-fade-in">
        <Box className="text-center mb-8">
          <Typography variant="h4" className="font-black text-slate-800 dark:text-white mb-2">Crea Account 🚀</Typography>
          <Typography className="text-slate-500 dark:text-slate-400">Inizia subito a potenziare la tua carriera.</Typography>
        </Box>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField fullWidth label="Nome" name="first_name" variant="outlined" value={formData.first_name} onChange={handleChange} required className="bg-slate-50 dark:bg-slate-900 rounded-lg" sx={textFieldStyle} />
            <TextField fullWidth label="Cognome" name="last_name" variant="outlined" value={formData.last_name} onChange={handleChange} required className="bg-slate-50 dark:bg-slate-900 rounded-lg" sx={textFieldStyle} />
          </div>

          <TextField
            fullWidth label="Email" name="email" type="email" variant="outlined"
            value={formData.email} onChange={handleChange} required
            error={!emailValid && formData.email.length > 0} // Diventa rosso se invalido
            helperText={!emailValid && formData.email.length > 0 ? "Inserisci un indirizzo email valido" : ""}
            className="bg-slate-50 dark:bg-slate-900 rounded-lg"
            sx={textFieldStyle}
          />

          <Box>
            <TextField
                fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'} variant="outlined"
                value={formData.password} onChange={handleChange} onFocus={() => setPasswordFocus(true)} required
                className="bg-slate-50 dark:bg-slate-900 rounded-lg"
                InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" className="text-slate-500 dark:text-slate-400">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }}
                sx={textFieldStyle}
            />
            <Fade in={passwordFocus || formData.password.length > 0}>
                <Paper elevation={0} className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <Typography variant="caption" className="px-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Sicurezza Password</Typography>
                    <List dense disablePadding>
                        <PasswordRequirement met={validity.length} label="Almeno 8 caratteri" />
                        <PasswordRequirement met={validity.upper} label="Almeno una Maiuscola (A-Z)" />
                        <PasswordRequirement met={validity.lower} label="Almeno una Minuscola (a-z)" />
                        <PasswordRequirement met={validity.number} label="Almeno un Numero (0-9)" />
                        <PasswordRequirement met={validity.special} label="Carattere speciale (@$!%*?&...)" />
                    </List>
                </Paper>
            </Fade>
          </Box>

          <Button type="submit" fullWidth variant="contained" size="large" disabled={!isFormValid} className={`py-3 rounded-xl font-bold shadow-lg transition-all mt-4 ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:-translate-y-1' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            Registrati e Accedi
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Typography variant="body2" className="text-slate-500 dark:text-slate-400">Hai già un account? <Link to="/" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">Accedi ora</Link></Typography>
        </div>
      </Paper>
    </div>
  );
}