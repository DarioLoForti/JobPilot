import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, CircularProgress, IconButton, 
  Accordion, AccordionSummary, AccordionDetails, Chip, Box 
} from '@mui/material';
import { 
  Mic, ExpandMore, Lightbulb, CheckCircle, 
  Psychology, Code, RecordVoiceOver, Close
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function InterviewModal({ open, onClose, job }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  // Effetto: Appena il modale si apre, genera le domande
  useEffect(() => {
    if (open && job) {
      generateQuestions();
    } else {
      setQuestions([]); // Reset quando chiude
    }
  }, [open, job]);

  const generateQuestions = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          company: job.company, 
          position: job.position, 
          jobDescription: job.job_description 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      } else {
        toast.error("Errore simulazione.");
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error("Errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    if (type.includes("Tecnica")) return <Code className="text-blue-500"/>;
    if (type.includes("Comportamentale")) return <Psychology className="text-purple-500"/>;
    return <RecordVoiceOver className="text-orange-500"/>;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth maxWidth="md" 
      PaperProps={{ 
        className: 'glass-panel bg-white dark:!bg-[#0f172a] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10',
        sx: { borderRadius: '24px', minHeight: '60vh' }
      }}
    >
      <DialogTitle className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
            <Mic fontSize="large" />
          </div>
          <div>
            <Typography variant="h5" className="font-bold">Interview Simulator</Typography>
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
              Training per: <b>{job?.position}</b> @ {job?.company}
            </Typography>
          </div>
        </div>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent className="p-6 bg-slate-50/50 dark:bg-black/20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <CircularProgress size={60} className="text-red-500 mb-6" />
            <Typography variant="h6" className="animate-pulse font-medium">
              L'AI si sta immedesimando nel Recruiter di {job?.company}...
            </Typography>
            <Typography variant="body2" className="text-slate-500 mt-2">
              Analisi Job Description e cultura aziendale in corso.
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 rounded-xl flex gap-3 items-start">
               <Lightbulb className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
               <Typography variant="body2" className="text-slate-700 dark:text-blue-100">
                 <b>Consiglio:</b> Leggi la domanda ad alta voce e prova a rispondere senza guardare subito i suggerimenti. Usa il metodo STAR (Situation, Task, Action, Result).
               </Typography>
            </div>

            {questions.map((q, index) => (
              <Accordion key={index} className="before:hidden shadow-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl mb-3 overflow-hidden !rounded-2xl">
                <AccordionSummary expandIcon={<ExpandMore className="text-slate-400"/>} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <div className="flex items-center gap-4 w-full">
                    <Chip 
                      icon={getIcon(q.type)} 
                      label={q.type} 
                      size="small" 
                      className="bg-transparent font-bold border border-slate-200 dark:border-white/10 dark:text-white"
                    />
                    <Typography className="font-bold text-slate-800 dark:text-white flex-1">
                      {q.question}
                    </Typography>
                  </div>
                </AccordionSummary>
                <AccordionDetails className="bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 p-6">
                  
                  <div className="mb-4">
                    <Typography variant="subtitle2" className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1 flex items-center gap-1">
                      <Psychology fontSize="inherit"/> Cosa cerca il recruiter
                    </Typography>
                    <Typography className="text-slate-600 dark:text-slate-300 text-sm italic">
                      {q.recruiter_intent}
                    </Typography>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                    <Typography variant="subtitle2" className="text-emerald-700 dark:text-emerald-400 font-bold mb-2 flex items-center gap-1">
                      <CheckCircle fontSize="small"/> Esempio di Risposta Vincente
                    </Typography>
                    <Typography className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      "{q.sample_answer}"
                    </Typography>
                  </div>

                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        )}
      </DialogContent>

      <DialogActions className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a]">
        <Button onClick={onClose} variant="contained" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8 py-2 font-bold">
          Termina Sessione
        </Button>
      </DialogActions>
    </Dialog>
  );
}