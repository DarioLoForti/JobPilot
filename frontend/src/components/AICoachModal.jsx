import { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, CircularProgress, Chip, Divider, Stack 
} from '@mui/material';
import { 
  AutoAwesome as AutoAwesomeIcon, 
  CheckCircleOutline as CheckIcon, 
  HighlightOff as CrossIcon, 
  TipsAndUpdates as AdviceIcon 
} from '@mui/icons-material';

export default function AICoachModal({ open, onClose, jobId, jobTitle, company }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && jobId) {
      fetchMatchData();
    }
  }, [open, jobId]);

  const fetchMatchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`/api/ai/match/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Errore durante l\'analisi');
      }
      
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Smeraldo
    if (score >= 60) return '#f59e0b'; // Ambra
    return '#ef4444'; // Rosso
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}>
      <DialogTitle className="flex items-center gap-2 font-black text-indigo-600">
        <AutoAwesomeIcon /> AI Coach Match Analysis
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box className="flex flex-col items-center justify-center py-12">
            <CircularProgress size={60} sx={{ color: '#6366f1', mb: 2 }} />
            <Typography className="text-slate-500 animate-pulse">L'AI sta analizzando il tuo CV contro l'annuncio...</Typography>
          </Box>
        ) : error ? (
          <Box className="text-center py-8">
            <Typography color="error" className="mb-4">{error}</Typography>
            <Button onClick={fetchMatchData} variant="outlined">Riprova</Button>
          </Box>
        ) : (
          <Box className="animate-fade-in">
            {/* HEADER MATCH */}
            <Box className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl">
              <div>
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-white leading-tight">
                  {jobTitle}
                </Typography>
                <Typography className="text-indigo-600 font-medium">{company}</Typography>
              </div>
              <Box className="relative flex items-center justify-center">
                <CircularProgress 
                  variant="determinate" 
                  value={data.match_percentage} 
                  size={80} 
                  thickness={5} 
                  sx={{ color: getScoreColor(data.match_percentage) }}
                />
                <Typography className="absolute font-black text-lg" sx={{ color: getScoreColor(data.match_percentage) }}>
                  {data.match_percentage}%
                </Typography>
              </Box>
            </Box>

            <Typography variant="subtitle1" className="font-bold mb-4 flex items-center gap-2">
              <CheckIcon className="text-emerald-500" /> Verdetto: {data.verdict}
            </Typography>

            {/* STRENGTHS */}
            <Typography variant="overline" className="text-slate-400 font-bold">Punti di Forza</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="mb-6 mt-1">
              {data.strengths.map((s, i) => (
                <Chip key={i} label={s} size="small" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-medium" />
              ))}
            </Stack>

            {/* MISSING SKILLS */}
            <Typography variant="overline" className="text-slate-400 font-bold">Gap Rilevati</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="mb-6 mt-1">
              {data.missing_skills.length > 0 ? (
                data.missing_skills.map((s, i) => (
                  <Chip key={i} label={s} size="small" className="bg-rose-50 text-rose-700 border-rose-100 font-medium" />
                ))
              ) : (
                <Typography variant="caption" className="text-emerald-600 font-medium italic">Nessun gap tecnico rilevato!</Typography>
              )}
            </Stack>

            <Divider className="my-4" />

            {/* AI ADVICE */}
            <Box className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <Typography variant="subtitle2" className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold mb-2">
                <AdviceIcon fontSize="small" /> Consiglio Strategico
              </Typography>
              <Typography variant="body2" className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "{data.cv_advice}"
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions className="p-4">
        <Button onClick={onClose} variant="contained" className="bg-slate-800 hover:bg-slate-900 rounded-xl px-8 normal-case">
          Ricevuto, Coach!
        </Button>
      </DialogActions>
    </Dialog>
  );
}