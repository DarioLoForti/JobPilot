import { useState, useEffect } from 'react';
import { Paper, Typography, Button, Slide } from '@mui/material';
import { Cookie } from '@mui/icons-material';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper 
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-5 z-50 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md"
        elevation={6}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
            <Cookie />
          </div>
          <div>
            <Typography variant="subtitle2" className="font-bold text-slate-900 dark:text-white mb-1">
              Usiamo i Cookie 🍪
            </Typography>
            <Typography variant="caption" className="text-slate-500 dark:text-slate-400 leading-tight block mb-3">
              Utilizziamo cookie tecnici e localStorage per salvare la tua sessione e le tue preferenze. Nessun dato viene venduto a terzi.
            </Typography>
            <div className="flex gap-2">
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleAccept}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Accetto
              </Button>
              <Button 
                size="small" 
                onClick={() => setVisible(false)} // Chiude solo temporaneamente
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      </Paper>
    </Slide>
  );
}