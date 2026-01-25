import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, InputAdornment, IconButton, Alert } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  
  // Dati del form
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });

  // Stato per gli errori specifici dei campi (per evidenziare in rosso)
  const [formErrors, setFormErrors] = useState({});
  
  // Stato per mostrare/nascondere la password
  const [showPassword, setShowPassword] = useState(false);

  // Funzione di Validazione
  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name.trim()) errors.first_name = "Il nome è obbligatorio";
    if (!formData.last_name.trim()) errors.last_name = "Il cognome è obbligatorio";
    
    if (!formData.email) {
        errors.email = "L'email è obbligatoria";
    } else if (!emailRegex.test(formData.email)) {
        errors.email = "Inserisci un'email valida (es. nome@mail.com)";
    }

    if (!formData.password) {
        errors.password = "La password è obbligatoria";
    } else if (formData.password.length < 6) {
        errors.password = "La password è troppo corta (minimo 6 caratteri)";
    }

    setFormErrors(errors);
    // Restituisce true se non ci sono errori (l'oggetto errors è vuoto)
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Eseguiamo la validazione locale prima di chiamare il server
    if (!validate()) {
        toast.error("Controlla i campi evidenziati in rosso 🔴");
        return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Registrazione completata! Benvenuto 🎉");
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        // Gestione errori dal server (es. email già esistente)
        toast.error(data.error || "Errore durante la registrazione");
        
        // Se l'errore riguarda l'email duplicata, evidenziamo il campo email
        if (data.error && data.error.includes("email")) {
            setFormErrors(prev => ({ ...prev, email: "Email già in uso" }));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Errore di connessione al server ❌");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Crea Account</h1>
            <p className="text-slate-500 dark:text-slate-400">Inizia a gestire la tua carriera con JobPilot</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <TextField 
                label="Nome" 
                variant="outlined" 
                fullWidth 
                value={formData.first_name}
                onChange={(e) => {
                    setFormData({...formData, first_name: e.target.value});
                    // Rimuove l'errore appena l'utente inizia a scrivere
                    if(formErrors.first_name) setFormErrors({...formErrors, first_name: ''});
                }}
                error={!!formErrors.first_name} // Bordo Rosso se true
                helperText={formErrors.first_name} // Messaggio di errore sotto
            />
            <TextField 
                label="Cognome" 
                variant="outlined" 
                fullWidth 
                value={formData.last_name}
                onChange={(e) => {
                    setFormData({...formData, last_name: e.target.value});
                    if(formErrors.last_name) setFormErrors({...formErrors, last_name: ''});
                }}
                error={!!formErrors.last_name}
                helperText={formErrors.last_name}
            />
          </div>

          <TextField 
            label="Email" 
            type="email" 
            fullWidth 
            value={formData.email}
            onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if(formErrors.email) setFormErrors({...formErrors, email: ''});
            }}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />

          <div>
            <TextField 
                label="Password" 
                type={showPassword ? "text" : "password"} 
                fullWidth 
                value={formData.password}
                onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if(formErrors.password) setFormErrors({...formErrors, password: ''});
                }}
                error={!!formErrors.password}
                helperText={formErrors.password} // Mostra l'errore se c'è
                InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    </InputAdornment>
                ),
                }}
            />
            {/* SUGGERIMENTI PASSWORD (Visibili solo se non c'è un errore specifico per non affollare la UI) */}
            {!formErrors.password && (
                <p className="text-xs text-slate-500 mt-2 ml-1">
                    ℹ️ La password deve contenere almeno <strong>6 caratteri</strong>.
                </p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30"
          >
            Registrati 🚀
          </Button>
        </form>

        <p className="text-center mt-6 text-slate-600 dark:text-slate-400">
          Hai già un account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">Accedi qui</Link>
        </p>
      </div>
    </div>
  );
}