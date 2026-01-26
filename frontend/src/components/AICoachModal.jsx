import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, CircularProgress, IconButton, 
  LinearProgress, Card, CardContent, Chip, Box, Stepper, Step, StepLabel
} from '@mui/material';
import { 
  Close, Psychology, AutoAwesome, CheckCircle, 
  RadioButtonUnchecked, RadioButtonChecked, 
  Warning, EmojiEvents, School, Work, Extension
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const MODES = {
  MENU: 'menu',
  PERSONALITY: 'personality',
  INTERVIEW: 'interview', // Simulatore Colloquio
  UCAF: 'ucaf',           // Protocollo UCAF
  QUIZ: 'quiz'            // Skill Audit
};

export default function AICoachModal({ open, onClose, jobId, jobTitle, company }) {
  const [mode, setMode] = useState(MODES.MENU);
  const [loading, setLoading] = useState(false);
  
  // Stati per la gestione del flusso interattivo
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Reset dello stato quando si apre/chiude il modale
  useEffect(() => {
    if (open && mode === MODES.MENU) {
      setResult(null);
      setAnswers({});
      setCurrentStep(0);
    }
  }, [open, mode]);

  const handleStart = async (selectedMode) => {
    setMode(selectedMode);
    setLoading(true);
    setResult(null);
    setAnswers({});
    setCurrentStep(0);

    const token = localStorage.getItem('token');
    let endpoint = '';
    let body = {};

    // Configurazione Endpoint in base alla modalità
    switch (selectedMode) {
      case MODES.PERSONALITY: endpoint = '/api/coach/personality'; break;
      case MODES.QUIZ: endpoint = '/api/coach/quiz'; break;
      case MODES.INTERVIEW: 
        endpoint = '/api/coach/interview/start'; 
        body = { company, position: jobTitle, description: "Simulazione standard basata sul ruolo." }; 
        break;
      case MODES.UCAF: 
        endpoint = '/api/coach/ucaf/start'; 
        body = { jobId }; 
        break;
      default: break;
    }

    try {
      const res = await fetch(endpoint, {
        method: body.company || body.jobId ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body.company || body.jobId ? JSON.stringify(body) : undefined
      });

      if (res.ok) {
        const data = await res.json();
        
        if (selectedMode === MODES.INTERVIEW) {
            // Normalizziamo la domanda singola in un array per uniformità
            setQuestions([{ id: 1, text: data.question }]); 
        } else if (selectedMode === MODES.UCAF) {
            // Trasformiamo l'oggetto UCAF in un array ordinato per lo stepper
            setQuestions([
                { id: 's1', type: 'CORE TECHNICAL', text: data.section_1_task, icon: <Work/> },
                { id: 's2', type: 'COGNITIVE', text: data.section_2_logic, icon: <Extension/> },
                { id: 's3', type: 'BEHAVIORAL', text: data.section_3_behavioral, icon: <Psychology/> },
                { id: 's4', type: 'VALUES', text: data.section_4_values, icon: <Warning/> }
            ]);
        } else {
            // Quiz e Personality restituiscono già un array
            setQuestions(data); 
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore avvio sessione.");
        setMode(MODES.MENU);
      }
    } catch (e) {
      console.error(e);
      toast.error("Errore di connessione.");
      setMode(MODES.MENU);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    // Navigazione tra le domande
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Invio finale
    setLoading(true);
    const token = localStorage.getItem('token');
    let endpoint = '';
    let body = {};

    switch (mode) {
      case MODES.PERSONALITY:
        endpoint = '/api/coach/personality/submit';
        body = { answers };
        break;
      case MODES.QUIZ:
        endpoint = '/api/coach/quiz/submit';
        body = { questions, answers };
        break;
      case MODES.INTERVIEW:
        endpoint = '/api/coach/interview/evaluate';
        body = { question: questions[0].text, answer: answers[0] };
        break;
      case MODES.UCAF:
        endpoint = '/api/coach/ucaf/evaluate';
        // Mappatura delle risposte array -> oggetto backend
        body = { 
            jobId, 
            questions: {
                section_1_task: questions[0].text,
                section_2_logic: questions[1].text,
                section_3_behavioral: questions[2].text,
                section_4_values: questions[3].text
            }, 
            answers: { s1: answers[0], s2: answers[1], s3: answers[2], s4: answers[3] }
        };
        break;
      default: break;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        toast.error("Errore durante la valutazione.");
      }
    } catch (e) {
      toast.error("Errore invio risposte.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER CONTENT SWITCHER ---
  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CircularProgress size={60} className="text-indigo-500 mb-6" />
        <Typography variant="h6" className="animate-pulse font-medium text-slate-700 dark:text-white">
          L'AI Coach sta elaborando...
        </Typography>
        <Typography variant="body2" className="text-slate-500 mt-2">
          Analisi psicometrica e tecnica in corso.
        </Typography>
      </div>
    );

    // 1. MENU PRINCIPALE
    if (mode === MODES.MENU) return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <Card className="cursor-pointer hover:border-indigo-500 border-2 border-transparent transition-all bg-slate-50 dark:bg-white/5 shadow-none" onClick={() => handleStart(MODES.PERSONALITY)}>
          <CardContent className="flex flex-col items-center text-center p-6">
            <Psychology fontSize="large" className="text-purple-500 mb-3" />
            <Typography variant="h6" className="font-bold">Identity Lab</Typography>
            <Typography variant="body2" className="text-slate-500">Scopri il tuo archetipo professionale.</Typography>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-indigo-500 border-2 border-transparent transition-all bg-slate-50 dark:bg-white/5 shadow-none" onClick={() => handleStart(MODES.QUIZ)}>
          <CardContent className="flex flex-col items-center text-center p-6">
            <School fontSize="large" className="text-blue-500 mb-3" />
            <Typography variant="h6" className="font-bold">Skill Audit</Typography>
            <Typography variant="body2" className="text-slate-500">Test intensivo di 30 domande.</Typography>
          </CardContent>
        </Card>

        {jobId && (
            <>
                <Card className="cursor-pointer hover:border-indigo-500 border-2 border-transparent transition-all bg-slate-50 dark:bg-white/5 shadow-none" onClick={() => handleStart(MODES.INTERVIEW)}>
                <CardContent className="flex flex-col items-center text-center p-6">
                    <Box className="relative mb-3">
                        <AutoAwesome fontSize="large" className="text-emerald-500" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                    </Box>
                    <Typography variant="h6" className="font-bold">Simulatore</Typography>
                    <Typography variant="body2" className="text-slate-500">Mock interview specifica per {jobTitle}.</Typography>
                </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-indigo-500 border-2 border-transparent transition-all bg-slate-50 dark:bg-white/5 shadow-none" onClick={() => handleStart(MODES.UCAF)}>
                <CardContent className="flex flex-col items-center text-center p-6">
                    <Warning fontSize="large" className="text-orange-500 mb-3" />
                    <Typography variant="h6" className="font-bold">Protocollo U.C.A.F.</Typography>
                    <Typography variant="body2" className="text-slate-500">Assessment Tecnico, Logico e Comportamentale.</Typography>
                </CardContent>
                </Card>
            </>
        )}
      </div>
    );

    // 2. VISUALIZZAZIONE RISULTATI
    if (result) {
        if (mode === MODES.PERSONALITY) return (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <Chip label="ARCHETIPO IDENTIFICATO" color="primary" size="small" className="mb-2 font-bold tracking-widest" />
                    <Typography variant="h4" className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600 mb-2">{result.archetype}</Typography>
                    <Typography className="text-slate-600 dark:text-slate-300 italic">"{result.description}"</Typography>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <Typography variant="subtitle2" className="font-bold text-emerald-700 dark:text-emerald-400 mb-2">Punti di Forza</Typography>
                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">{result.strengths?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                        <Typography variant="subtitle2" className="font-bold text-blue-700 dark:text-blue-400 mb-2">Ambiente Ideale</Typography>
                        <Typography variant="body2" className="text-slate-700 dark:text-slate-300">{result.ideal_environment}</Typography>
                    </div>
                </div>
            </div>
        );

        if (mode === MODES.INTERVIEW) return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <Typography variant="h5" className="font-bold">Esito Simulazione</Typography>
                    <div className={`flex items-center gap-2 px-4 py-1 rounded-full font-black text-white ${result.score >= 8 ? 'bg-emerald-500' : result.score >= 6 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <EmojiEvents fontSize="small"/> {result.score}/10
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <Typography variant="subtitle2" className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-2">Feedback AI</Typography>
                    <Typography className="text-slate-800 dark:text-slate-200">{result.feedback}</Typography>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                    <Typography variant="subtitle2" className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-xs mb-2">Risposta Migliorata</Typography>
                    <Typography className="text-slate-700 dark:text-slate-300 italic">"{result.improved_version}"</Typography>
                </div>
            </div>
        );

        if (mode === MODES.UCAF) return (
            <div className="space-y-4 animate-fade-in h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                    <Typography variant="h5" className="font-bold">Report U.C.A.F.</Typography>
                    <Chip label={`Score: ${result.score_total}/100`} color={result.score_total >= 70 ? "success" : "warning"} className="font-bold" />
                </div>
                <div className="prose dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{result.markdown_report}</ReactMarkdown>
                </div>
            </div>
        );

        if (mode === MODES.QUIZ) return (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <Typography variant="h6" className="text-slate-500 font-bold uppercase tracking-widest text-xs">Livello Rilevato</Typography>
                    <Typography variant="h3" className="font-black text-indigo-600 dark:text-indigo-400 my-2">{result.level}</Typography>
                    <Typography variant="body2" className="font-bold bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-full inline-block">Score: {result.score}/100</Typography>
                </div>
                <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10">
                    <Typography className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{result.analysis}</Typography>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Typography className="font-bold text-emerald-600 mb-2 text-sm">✅ Top Skills</Typography>
                        {result.top_skills?.map(s => <Chip key={s} label={s} size="small" className="mr-1 mb-1 bg-emerald-100 text-emerald-800 font-bold" />)}
                    </div>
                    <div>
                        <Typography className="font-bold text-amber-600 mb-2 text-sm">⚠️ Da Migliorare</Typography>
                        {result.areas_to_improve?.map(s => <Chip key={s} label={s} size="small" className="mr-1 mb-1 bg-amber-100 text-amber-800 font-bold" />)}
                    </div>
                </div>
            </div>
        );
    }

    // 3. DOMANDE ATTIVE (WIZARD)
    const q = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
      <div className="flex flex-col h-full">
        {/* STEPPER SOLO PER UCAF */}
        {mode === MODES.UCAF && (
            <Stepper activeStep={currentStep} alternativeLabel className="mb-6">
                {questions.map((step) => (
                    <Step key={step.id}>
                        <StepLabel StepIconComponent={() => <div className={`p-2 rounded-full ${currentStep >= questions.indexOf(step) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{step.icon}</div>}></StepLabel>
                    </Step>
                ))}
            </Stepper>
        )}

        {/* BARRA PROGRESSO PER GLI ALTRI */}
        {mode !== MODES.UCAF && mode !== MODES.INTERVIEW && (
            <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Domanda {currentStep + 1}/{questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <LinearProgress variant="determinate" value={progress} className="rounded-full h-2 bg-slate-100 dark:bg-slate-700" sx={{ '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: '#4f46e5' } }} />
            </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
            {mode === MODES.UCAF && (
                <Typography variant="overline" className="font-bold text-indigo-500 block mb-2">
                    FASE {currentStep + 1}: {q.type}
                </Typography>
            )}
            
            <Typography variant="h6" className="font-bold text-slate-800 dark:text-white mb-6 leading-relaxed">
                {q.text || q.question}
            </Typography>

            {/* RENDER OPZIONI (Quiz) O TEXTAREA (Open Ended) */}
            {q.options ? (
                <div className="space-y-3">
                    {q.options.map((opt, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setAnswers({...answers, [currentStep]: opt})}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${answers[currentStep] === opt ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-white/10 hover:border-indigo-300'}`}
                        >
                            {answers[currentStep] === opt ? <RadioButtonChecked className="text-indigo-600"/> : <RadioButtonUnchecked className="text-slate-400"/>}
                            <Typography className="text-sm font-medium text-slate-700 dark:text-slate-200">{opt}</Typography>
                        </div>
                    ))}
                </div>
            ) : (
                <textarea 
                    className="w-full h-40 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none font-sans text-sm leading-relaxed"
                    placeholder="Scrivi la tua risposta qui..."
                    value={answers[currentStep] || ''}
                    onChange={(e) => setAnswers({...answers, [currentStep]: e.target.value})}
                />
            )}
        </div>

        <DialogActions className="p-0 pt-4 border-t border-slate-200 dark:border-white/10">
            {currentStep > 0 && <Button onClick={() => setCurrentStep(p => p - 1)} className="text-slate-500">Indietro</Button>}
            <Button 
                variant="contained" 
                onClick={handleSubmitAnswer}
                disabled={!answers[currentStep] || answers[currentStep].length < 2}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-bold"
            >
                {currentStep === questions.length - 1 ? "Termina e Valuta" : "Avanti"}
            </Button>
        </DialogActions>
      </div>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth maxWidth="md" 
      PaperProps={{ className: 'glass-panel bg-white dark:!bg-[#0f172a] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10', sx: { borderRadius: '24px', minHeight: '60vh' } }}
    >
      <DialogTitle className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            {mode === MODES.MENU ? <AutoAwesome /> : mode === MODES.UCAF ? <Warning/> : <Psychology />}
          </div>
          <div>
            <Typography variant="h6" className="font-bold leading-none">
                {mode === MODES.MENU ? "AI Career Coach" : 
                 mode === MODES.UCAF ? "Protocollo U.C.A.F." :
                 mode === MODES.QUIZ ? "Skill Audit" : "Sessione"}
            </Typography>
            {jobTitle && mode !== MODES.MENU && <Typography variant="caption" className="text-slate-500">Target: {jobTitle}</Typography>}
          </div>
        </div>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent className="p-6 bg-slate-50/50 dark:bg-black/20">
        {renderContent()}
      </DialogContent>
      
      {result && (
          <DialogActions className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10">
              <Button onClick={() => setMode(MODES.MENU)} className="text-slate-500">Torna al Menu</Button>
              <Button onClick={onClose} variant="contained" className="bg-slate-800 text-white rounded-xl">Chiudi</Button>
          </DialogActions>
      )}
    </Dialog>
  );
}