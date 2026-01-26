import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Divider, Switch, FormControlLabel, 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  ExpandMore, Security, Gavel, DeleteForever, 
  Logout, Save, Policy, Warning // <--- HO AGGIUNTO 'Warning' QUI
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    toast.success("Logout effettuato.");
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.clear();
        toast.success("Account eliminato correttamente.");
        navigate('/');
      } else {
        toast.error("Errore durante l'eliminazione.");
      }
    } catch (e) {
      toast.error("Errore di connessione.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-12 text-slate-900 dark:text-slate-100">
      
      <Typography variant="h4" className="font-black mb-8 text-slate-800 dark:text-white">
        Impostazioni & Privacy
      </Typography>

      <div className="grid gap-6">
        
        {/* 1. PREFERENZE GENERALI */}
        <Paper className="p-6 rounded-2xl glass-panel bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10">
            <Typography variant="h6" className="font-bold flex items-center gap-2 mb-4">
                <Security className="text-indigo-500"/> Sicurezza & Sessione
            </Typography>
            
            <div className="flex justify-between items-center">
                <div>
                    <Typography className="font-bold text-sm">Disconnetti Account</Typography>
                    <Typography variant="caption" className="text-slate-500">Termina la sessione corrente su questo dispositivo.</Typography>
                </div>
                <Button variant="outlined" color="primary" onClick={handleLogout} startIcon={<Logout />} className="rounded-xl font-bold border-2">
                    Logout
                </Button>
            </div>
        </Paper>

        {/* 2. NOTE LEGALI & GDPR */}
        <Paper className="p-6 rounded-2xl glass-panel bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10">
            <Typography variant="h6" className="font-bold flex items-center gap-2 mb-4">
                <Gavel className="text-emerald-500"/> Privacy & Termini (GDPR)
            </Typography>

            <Accordion className="bg-transparent shadow-none border border-slate-200 dark:border-white/10 rounded-xl mb-2 before:hidden">
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography className="font-bold text-sm flex items-center gap-2"><Policy fontSize="small"/> Informativa Privacy</Typography>
                </AccordionSummary>
                <AccordionDetails className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-black/20 rounded-b-xl">
                    <p className="mb-2"><strong>Titolare del Trattamento:</strong> JobPilot AI Team.</p>
                    <p className="mb-2"><strong>Dati Trattati:</strong> Nome, Email, CV (PDF), Cronologia Candidature.</p>
                    <p className="mb-2"><strong>Scopo:</strong> I dati vengono utilizzati esclusivamente per fornire i servizi di analisi CV, generazione lettere e tracking candidature.</p>
                    <p><strong>Terze Parti:</strong> Il testo del tuo CV viene inviato in forma anonimizzata alle API di Google Gemini per l'elaborazione AI. Non conserviamo i tuoi dati sui server di Google per il training dei modelli.</p>
                </AccordionDetails>
            </Accordion>

            <Accordion className="bg-transparent shadow-none border border-slate-200 dark:border-white/10 rounded-xl before:hidden">
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography className="font-bold text-sm">Termini di Utilizzo</Typography>
                </AccordionSummary>
                <AccordionDetails className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-black/20 rounded-b-xl">
                    L'applicazione è fornita "così com'è". L'utente è responsabile della veridicità dei dati inseriti nel proprio CV. L'AI fornisce suggerimenti e non garantisce l'assunzione.
                </AccordionDetails>
            </Accordion>
        </Paper>

        {/* 3. DANGER ZONE (Delete Account) */}
        <Paper className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20">
            <Typography variant="h6" className="font-bold flex items-center gap-2 mb-2 text-red-700 dark:text-red-400">
                <DeleteForever/> Zona Pericolosa
            </Typography>
            <Typography variant="body2" className="text-red-600/80 dark:text-red-300/80 mb-6">
                L'eliminazione dell'account è irreversibile (Diritto all'Oblio). Tutti i tuoi dati, candidature, CV e analisi verranno rimossi permanentemente dai nostri database.
            </Typography>
            
            <Button 
                variant="contained" 
                color="error" 
                onClick={() => setDeleteOpen(true)}
                className="bg-red-600 hover:bg-red-700 font-bold rounded-xl shadow-lg shadow-red-500/30"
            >
                Elimina il mio Account
            </Button>
        </Paper>

      </div>

      {/* DIALOG CONFERMA ELIMINAZIONE */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{ className: "glass-panel bg-white dark:bg-[#1e293b] rounded-2xl" }}
      >
        <DialogTitle className="font-bold text-red-600 flex items-center gap-2">
            <Warning className="text-red-500"/> Sei assolutamente sicuro?
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="text-slate-600 dark:text-slate-300">
            Questa azione non può essere annullata. Stai per cancellare:
            <ul className="list-disc pl-5 mt-2 space-y-1 font-bold">
                <li>Il tuo profilo utente</li>
                <li>Tutte le tue candidature salvate</li>
                <li>Tutti i report dell'AI Coach</li>
                <li>Il tuo storico CV</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setDeleteOpen(false)} className="text-slate-500 font-bold">Annulla</Button>
          <Button onClick={handleDeleteAccount} variant="contained" color="error" className="bg-red-600 font-bold rounded-xl">
            Sì, Elimina Tutto
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}