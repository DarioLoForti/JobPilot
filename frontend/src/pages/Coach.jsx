import { useState, useEffect } from 'react';
import { 
  Typography, Paper, Grid, Button, Box, TextField, 
  Avatar, Chip, CircularProgress, MobileStepper, 
  Stepper, Step, StepLabel, Divider, Fade,
  Radio, RadioGroup, FormControlLabel, FormControl 
} from '@mui/material';
import { 
  Psychology, RecordVoiceOver, KeyboardArrowLeft, 
  KeyboardArrowRight, AutoAwesome, CheckCircle, EmojiObjects,
  Engineering, Groups, Favorite, Assessment, Science, 
  HelpOutline
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown'; 
import toast from 'react-hot-toast';

// Configurazione STEP UCAF
const UCAF_STEPS = [
  { label: 'Core Technical', icon: <Engineering />, desc: 'Simulazione pratica' },
  { label: 'Cognitive', icon: <Psychology />, desc: 'Logica e Problem Solving' },
  { label: 'Behavioral', icon: <Groups />, desc: 'Intervista STAR' },
  { label: 'Values', icon: <Favorite />, desc: 'Fit Culturale' }
];

export default function Coach() {
  const [activeTab, setActiveTab] = useState('ucaf'); 
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  // --- STATES IDENTITY LAB ---
  const [profile, setProfile] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [activeStepIdentity, setActiveStepIdentity] = useState(0);
  const [answersIdentity, setAnswersIdentity] = useState({});
  const [isTestingIdentity, setIsTestingIdentity] = useState(false);

  // --- STATES QUICK SIMULATOR ---
  const [selectedJobSim, setSelectedJobSim] = useState(null);
  const [interviewQ, setInterviewQ] = useState('');
  const [userAnswerSim, setUserAnswerSim] = useState('');
  const [feedbackSim, setFeedbackSim] = useState(null);

  // --- STATES U.C.A.F. ---
  const [selectedJobUcaf, setSelectedJobUcaf] = useState(null);
  const [activeStepUcaf, setActiveStepUcaf] = useState(-1); 
  const [ucafQuestions, setUcafQuestions] = useState(null);
  const [ucafAnswers, setUcafAnswers] = useState({ s1: '', s2: '', s3: '', s4: '' });
  const [ucafResult, setUcafResult] = useState(null);

  // --- STATES SKILL AUDIT ---
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [activeStepQuiz, setActiveStepQuiz] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [isQuizzing, setIsQuizzing] = useState(false);

  useEffect(() => {
    fetchProfileHistory();
    fetchJobs();
  }, []);

  const fetchProfileHistory = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/coach/history', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            if (data) setProfile(data);
        }
    } catch (e) { console.error("Errore fetch history coach"); }
  };

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setJobs(await res.json());
    } catch (e) { console.error("Errore fetch jobs"); }
  };

  // --- LOGICHE IDENTITY ---
  const startIdentityTest = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/coach/test', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTestQuestions(data);
      setIsTestingIdentity(true);
    } catch (error) {
      toast.error("Errore avvio test");
    } finally {
      setLoading(false);
    }
  };

  const submitIdentityTest = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const formattedAnswers = testQuestions.map((q, i) => ({ question: q.text, answer: answersIdentity[i] }));
    
    try {
      const res = await fetch('/api/coach/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      
      if (res.ok) {
        setProfile(await res.json());
        setIsTestingIdentity(false);
        toast.success("Profilo generato!");
      }
    } catch (error) {
      toast.error("Errore analisi");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICHE SIMULATOR ---
  const startQuickSim = async () => {
    if (!selectedJobSim) return toast.error("Seleziona un lavoro!");
    setLoading(true);
    setFeedbackSim(null);
    setUserAnswerSim('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/coach/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          company: selectedJobSim.company, 
          position: selectedJobSim.position, 
          description: selectedJobSim.job_description 
        })
      });
      const data = await res.json();
      setInterviewQ(data.question);
    } finally {
      setLoading(false);
    }
  };

  const submitQuickSim = async () => {
    if (!userAnswerSim) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/coach/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: interviewQ, answer: userAnswerSim })
      });
      setFeedbackSim(await res.json());
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICHE UCAF ---
  const startUCAF = async () => {
    if (!selectedJobUcaf) return toast.error("Seleziona una candidatura!");
    setLoading(true);
    try {
      const res = await fetch('/api/coach/ucaf/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ jobId: selectedJobUcaf.id })
      });
      const data = await res.json();
      setUcafQuestions(data);
      setActiveStepUcaf(0);
    } catch (e) { toast.error("Errore avvio UCAF"); }
    finally { setLoading(false); }
  };

  const submitUCAF = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coach/ucaf/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ jobId: selectedJobUcaf.id, questions: ucafQuestions, answers: ucafAnswers })
      });
      const data = await res.json();
      setUcafResult(data);
      setActiveStepUcaf(4);
      toast.success("Scorecard Generata!");
    } catch (e) { toast.error("Errore valutazione"); }
    finally { setLoading(false); }
  };

  const currentUcafQuestion = () => {
    if (!ucafQuestions) return "";
    if (activeStepUcaf === 0) return ucafQuestions.section_1_task;
    if (activeStepUcaf === 1) return ucafQuestions.section_2_logic;
    if (activeStepUcaf === 2) return ucafQuestions.section_3_behavioral;
    if (activeStepUcaf === 3) return ucafQuestions.section_4_values;
  };
  const currentUcafKey = () => `s${activeStepUcaf + 1}`;

  // --- LOGICHE SKILL AUDIT ---
  const startQuiz = async () => {
    setLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    setActiveStepQuiz(0);
    try {
        const res = await fetch('/api/coach/quiz/start', { 
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        if (res.ok) {
            setQuizQuestions(await res.json());
            setIsQuizzing(true);
        } else {
            const err = await res.json();
            toast.error(err.error || "Errore avvio quiz");
        }
    } catch (e) { toast.error("Errore connessione"); }
    finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/coach/quiz/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ questions: quizQuestions, answers: quizAnswers })
        });
        if(res.ok) {
            setQuizResult(await res.json());
            setIsQuizzing(false);
            toast.success("Quiz completato!");
        }
    } catch (e) { toast.error("Errore valutazione quiz"); }
    finally { setLoading(false); }
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen animate-fade-in text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER */}
      <Box className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <Typography variant="h2" className="font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Coach</span>
        </Typography>
        <Typography className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          Preparazione mentale, strategica e tecnica.
        </Typography>
      </Box>

      {/* NAVIGATION TABS */}
      <div className="flex justify-center flex-wrap gap-3 mb-12 sticky top-20 z-40 py-2 backdrop-blur-md bg-white/50 dark:bg-slate-900/50 rounded-full w-fit mx-auto px-2 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
        {[
            { id: 'ucaf', label: 'U.C.A.F. Protocol', icon: <Science fontSize="small" /> },
            { id: 'quiz', label: 'Skill Audit', icon: <HelpOutline fontSize="small" /> },
            { id: 'identity', label: 'Identity Lab', icon: <Psychology fontSize="small" /> },
            { id: 'simulator', label: 'Quick Mock', icon: <RecordVoiceOver fontSize="small" /> }
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      <Fade in={true} key={activeTab} timeout={500}>
        <div>
            {/* --- TAB: SKILL AUDIT --- */}
            {activeTab === 'quiz' && (
                <Grid container spacing={4} justifyContent="center">
                    {!isQuizzing && !quizResult && (
                        <div className="text-center w-full max-w-3xl">
                            <Paper className="p-10 rounded-[2rem] bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
                                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <HelpOutline sx={{ fontSize: 50, color: '#2563eb' }} />
                                </div>
                                <Typography variant="h4" className="font-bold text-slate-900 dark:text-white mb-3">Deep Skill Audit</Typography>
                                <Typography className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                                    L'AI genererà un esame personalizzato di <strong>30 domande</strong> a risposta multipla basato sul tuo profilo. 
                                    <br/><em className="text-sm opacity-70">(Tempo stimato: 30-60 secondi)</em>
                                </Typography>
                                <Button 
                                    variant="contained" size="large" onClick={startQuiz} disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-10 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/30"
                                >
                                    {loading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CircularProgress size={24} color="inherit" />
                                            <span>Generazione Esame...</span>
                                        </Box>
                                    ) : "Genera Esame (30 Domande)"}
                                </Button>
                            </Paper>
                        </div>
                    )}

                    {isQuizzing && quizQuestions.length > 0 && (
                        <Grid item xs={12} md={8}>
                            <Paper className="p-8 rounded-[2rem] shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-700">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((activeStepQuiz + 1) / quizQuestions.length) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center mb-8 mt-2">
                                    <Typography variant="overline" className="font-bold text-slate-400 tracking-wider">DOMANDA {activeStepQuiz + 1} / {quizQuestions.length}</Typography>
                                    <Chip label={`${Math.round(((activeStepQuiz + 1) / quizQuestions.length) * 100)}%`} size="small" className="bg-slate-100 dark:bg-slate-700 dark:text-white font-bold" />
                                </div>
                                <Typography variant="h5" className="font-bold mb-8 text-slate-800 dark:text-white leading-relaxed">{quizQuestions[activeStepQuiz].question}</Typography>
                                <div className="grid gap-3 mb-8">
                                    {quizQuestions[activeStepQuiz].options.map((opt, idx) => {
                                        const isSelected = quizAnswers[quizQuestions[activeStepQuiz].id] === opt;
                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => setQuizAnswers({...quizAnswers, [quizQuestions[activeStepQuiz].id]: opt})}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                                                    {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                                                </div>
                                                <span className="text-lg text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <Button disabled={activeStepQuiz === 0} onClick={() => setActiveStepQuiz(p => p-1)} className="text-slate-500 dark:text-slate-400">Indietro</Button>
                                    <Button variant="contained" onClick={activeStepQuiz === quizQuestions.length - 1 ? submitQuiz : () => setActiveStepQuiz(p => p+1)} disabled={!quizAnswers[quizQuestions[activeStepQuiz].id] || loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-3 font-bold">{loading ? "Analisi..." : (activeStepQuiz === quizQuestions.length - 1 ? "Consegna" : "Prossima")}</Button>
                                </div>
                            </Paper>
                        </Grid>
                    )}

                    {quizResult && !isQuizzing && (
                        <Grid item xs={12} md={10}>
                            <Paper className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-2xl border-t-8 border-blue-600 text-center animate-fade-in relative overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-10">
                                    <div className="relative">
                                        <CircularProgress variant="determinate" value={quizResult.score} size={160} thickness={4} sx={{ color: quizResult.score > 70 ? '#10b981' : '#f59e0b' }} />
                                        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                            <span className="text-5xl font-black text-slate-800 dark:text-white">{quizResult.score}</span>
                                            <span className="text-sm font-bold text-slate-400 uppercase">Score</span>
                                        </Box>
                                    </div>
                                    <div className="text-center md:text-left max-w-lg">
                                        <Typography variant="h3" className="font-black text-slate-800 dark:text-white mb-2">{quizResult.level}</Typography>
                                        <Typography className="text-slate-500 dark:text-slate-400 text-lg mb-4">Livello Competenza</Typography>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 italic text-slate-700 dark:text-slate-300">"{quizResult.analysis}"</div>
                                    </div>
                                </div>
                                <Grid container spacing={4} className="text-left">
                                    <Grid item xs={12} md={6}>
                                        <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900 h-full">
                                            <Typography variant="h6" className="font-bold mb-4 text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><CheckCircle /> Punti di Forza</Typography>
                                            <ul className="space-y-2 text-slate-700 dark:text-slate-300">{quizResult.top_skills.map((s, i) => <li key={i} className="flex items-start gap-2">• {s}</li>)}</ul>
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 h-full">
                                            <Typography variant="h6" className="font-bold mb-4 text-amber-700 dark:text-amber-400 flex items-center gap-2"><AutoAwesome /> Aree di Crescita</Typography>
                                            <ul className="space-y-2 text-slate-700 dark:text-slate-300">{quizResult.areas_to_improve.map((s, i) => <li key={i} className="flex items-start gap-2">• {s}</li>)}</ul>
                                        </div>
                                    </Grid>
                                </Grid>
                                <Button onClick={startQuiz} size="large" variant="outlined" className="mt-12 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700">Avvia Nuovo Audit</Button>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* --- UCAF --- */}
            {activeTab === 'ucaf' && (
                <div className="max-w-5xl mx-auto">
                    {activeStepUcaf >= 0 && activeStepUcaf < 4 && (
                        <div className="mb-10 overflow-x-auto pb-4">
                            <Stepper activeStep={activeStepUcaf} alternativeLabel>
                                {UCAF_STEPS.map((step, index) => (
                                    <Step key={step.label}><StepLabel StepIconComponent={() => <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${activeStepUcaf === index ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{step.icon}</div>}><span className={`font-bold ${activeStepUcaf === index ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{step.label}</span></StepLabel></Step>
                                ))}
                            </Stepper>
                        </div>
                    )}

                    {activeStepUcaf === -1 && (
                        <Paper className="p-12 rounded-[2rem] text-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6"><Assessment sx={{ fontSize: 40, color: '#2563eb' }} /></div>
                            <Typography variant="h4" className="font-bold mb-4 text-slate-900 dark:text-white">Seleziona una candidatura</Typography>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10">
                                {jobs.map(job => (
                                    <div key={job.id} onClick={() => setSelectedJobUcaf(job)} className={`p-5 rounded-2xl cursor-pointer border-2 transition-all text-left hover:border-blue-400 dark:hover:border-blue-500 ${selectedJobUcaf?.id === job.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700'}`}>
                                        <Typography className="font-bold text-slate-800 dark:text-white line-clamp-1">{job.position}</Typography>
                                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400">{job.company}</Typography>
                                    </div>
                                ))}
                            </div>
                            <Button variant="contained" size="large" onClick={startUCAF} disabled={!selectedJobUcaf || loading} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-xl font-bold text-lg disabled:opacity-50">{loading ? <CircularProgress size={24} color="inherit" /> : "AVVIA PROTOCOLLO"}</Button>
                        </Paper>
                    )}

                    {activeStepUcaf >= 0 && activeStepUcaf < 4 && ucafQuestions && (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={4}>
                                <Paper className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 h-full sticky top-24">
                                    <Typography variant="overline" className="text-blue-600 dark:text-blue-400 font-bold tracking-widest">Modulo {activeStepUcaf + 1}/4</Typography>
                                    <Typography variant="h4" className="font-black mt-2 mb-4 text-slate-900 dark:text-white">{UCAF_STEPS[activeStepUcaf].label}</Typography>
                                    <Typography className="text-slate-600 dark:text-slate-300 mb-6 text-lg">{UCAF_STEPS[activeStepUcaf].desc}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Paper className="p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <Typography variant="h6" className="font-bold mb-6 text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap">{currentUcafQuestion()}</Typography>
                                    <TextField fullWidth multiline rows={12} variant="outlined" placeholder="Scrivi qui la tua soluzione dettagliata..." value={ucafAnswers[currentUcafKey()] || ''} onChange={(e) => setUcafAnswers({...ucafAnswers, [currentUcafKey()]: e.target.value})} className="bg-slate-50 dark:bg-slate-900 mb-8 rounded-xl" sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(0,0,0,0.1)' } }} />
                                    <div className="flex justify-end"><Button variant="contained" size="large" onClick={() => activeStepUcaf === 3 ? submitUCAF() : setActiveStepUcaf(p => p+1)} disabled={!ucafAnswers[currentUcafKey()] || loading} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-10 py-3 font-bold">{loading ? "Valutazione..." : (activeStepUcaf === 3 ? "Concludi" : "Prossimo")}</Button></div>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {activeStepUcaf === 4 && ucafResult && (
                        <Paper className="p-10 rounded-[2rem] border-t-8 border-blue-600 shadow-2xl mb-8 bg-white dark:bg-slate-800">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-8 gap-6">
                                <div className="text-center md:text-left"><Typography variant="h3" className="font-black text-slate-900 dark:text-white mb-2">Universal Hiring Scorecard</Typography></div>
                                <div className="text-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700"><Typography variant="h2" className={`font-black ${ucafResult.score_total >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{ucafResult.score_total}<span className="text-2xl text-slate-400">/100</span></Typography></div>
                            </div>
                            <div className="prose prose-lg prose-slate max-w-none dark:prose-invert bg-slate-50 dark:bg-slate-900/30 p-8 rounded-2xl border border-slate-100 dark:border-slate-700"><ReactMarkdown>{ucafResult.markdown_report}</ReactMarkdown></div>
                            <div className="text-center mt-12"><Button variant="outlined" size="large" onClick={() => setActiveStepUcaf(-1)} className="border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-8 py-3 rounded-xl font-bold">Nuova Valutazione</Button></div>
                        </Paper>
                    )}
                </div>
            )}

            {/* --- IDENTITY LAB --- */}
            {activeTab === 'identity' && (
                <Grid container spacing={4} justifyContent="center">
                    {!profile && !isTestingIdentity && (
                        <div className="text-center py-20 w-full max-w-3xl">
                            <Paper className="p-12 rounded-[2.5rem] bg-gradient-to-b from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
                                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6"><Psychology sx={{ fontSize: 50, color: '#2563eb' }} /></div>
                                <Typography variant="h4" className="font-bold mb-4 text-slate-900 dark:text-white">Identity Lab</Typography>
                                <Button 
                                    variant="contained" size="large" onClick={startIdentityTest} disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg"
                                >
                                    {loading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CircularProgress size={24} color="inherit" />
                                            <span>Generazione Domande...</span>
                                        </Box>
                                    ) : "Inizia Analisi"}
                                </Button>
                            </Paper>
                        </div>
                    )}
                    {isTestingIdentity && (
                        <Grid item xs={12} md={8}>
                            <Paper className="p-8 rounded-3xl shadow-xl relative overflow-hidden bg-white dark:bg-slate-800">
                                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-slate-700"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((activeStepIdentity + 1) / testQuestions.length) * 100}%` }}></div></div>
                                <Typography variant="overline" className="text-slate-400 font-bold">Domanda {activeStepIdentity + 1} / 5</Typography>
                                <Typography variant="h5" className="font-bold my-6 text-slate-800 dark:text-white">{testQuestions[activeStepIdentity]?.text}</Typography>
                                <TextField fullWidth multiline rows={4} value={answersIdentity[activeStepIdentity] || ''} onChange={(e) => setAnswersIdentity({...answersIdentity, [activeStepIdentity]: e.target.value})} className="bg-slate-50 dark:bg-slate-900 mb-6 rounded-xl" sx={{ '& .MuiOutlinedInput-root fieldset': { border: 'none' } }} placeholder="Scrivi qui..." />
                                <div className="flex justify-end"><Button variant="contained" onClick={activeStepIdentity === 4 ? submitIdentityTest : () => setActiveStepIdentity(p=>p+1)} disabled={!answersIdentity[activeStepIdentity]} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-2">{activeStepIdentity === 4 ? 'Analizza Profilo' : 'Avanti'}</Button></div>
                            </Paper>
                        </Grid>
                    )}
                    {profile && !isTestingIdentity && (
                        <Grid item xs={12} md={10}>
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[2.5rem] p-12 text-white shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-10">
                                <Avatar sx={{ width: 140, height: 140, bgcolor: 'white', color: '#2563eb', fontSize: 60, fontWeight: 'bold' }}>{profile.archetype[0]}</Avatar>
                                <div><Typography variant="overline" className="opacity-70 font-bold tracking-widest text-lg">ARCHETIPO RILEVATO</Typography><Typography variant="h2" className="font-black mb-4">{profile.archetype}</Typography><Typography className="text-blue-50 text-xl leading-relaxed max-w-2xl">{profile.description}</Typography></div>
                            </div>
                            <Button onClick={startIdentityTest} variant="outlined" size="large" className="mt-4 border-slate-400 text-slate-600 dark:text-slate-300">Rifai Analisi</Button>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* --- SIMULATOR --- */}
            {activeTab === 'simulator' && (
                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={4}>
                        <Paper className="p-6 rounded-3xl h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <Typography variant="h6" className="font-bold mb-6 text-slate-800 dark:text-white px-2">Seleziona Scenario</Typography>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {jobs.map(job => (
                                    <div key={job.id} onClick={() => { setSelectedJobSim(job); setInterviewQ(''); setFeedbackSim(null); }} className={`p-4 rounded-2xl cursor-pointer border-2 transition-all group ${selectedJobSim?.id === job.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-blue-400'}`}>
                                        <Typography className="font-bold text-slate-800 dark:text-white transition-colors">{job.position}</Typography>
                                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400">{job.company}</Typography>
                                    </div>
                                ))}
                            </div>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Paper className="p-10 rounded-[2.5rem] min-h-[500px] flex flex-col justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl relative">
                            {!selectedJobSim ? (
                                <div className="text-center text-slate-400"><RecordVoiceOver sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} /><Typography>Seleziona un lavoro dal menu laterale</Typography></div>
                            ) : (
                                <>
                                    {!interviewQ ? (
                                        <div className="text-center">
                                            <Typography variant="h4" className="font-bold mb-2 text-slate-900 dark:text-white">Simulazione Colloquio</Typography>
                                            <Button variant="contained" size="large" onClick={startQuickSim} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg">{loading ? <CircularProgress size={24} color="inherit"/> : "Genera Domanda AI"}</Button>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in w-full">
                                            <div className="flex gap-6 mb-8 items-start"><Avatar sx={{ bgcolor: '#1e293b', width: 56, height: 56 }}><RecordVoiceOver /></Avatar><div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-3xl rounded-tl-none border border-slate-200 dark:border-slate-600 flex-1"><Typography className="font-bold text-slate-800 dark:text-white text-xl leading-relaxed">{interviewQ}</Typography></div></div>
                                            {!feedbackSim ? (
                                                <div className="pl-20">
                                                    <TextField fullWidth multiline rows={6} placeholder="Scrivi la tua risposta..." value={userAnswerSim} onChange={(e) => setUserAnswerSim(e.target.value)} className="bg-white dark:bg-slate-900 mb-6 rounded-2xl shadow-sm" sx={{ '& .MuiOutlinedInput-root fieldset': { border: '1px solid #e2e8f0' } }} />
                                                    <div className="flex justify-end"><Button variant="contained" onClick={submitQuickSim} disabled={loading || !userAnswerSim} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-3 font-bold">{loading ? "Analisi..." : "Invia Risposta"}</Button></div>
                                                </div>
                                            ) : (
                                                <div className="animate-fade-in pl-20">
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-3xl border border-blue-100 dark:border-blue-800">
                                                        <div className="flex items-center justify-between mb-4"><Typography className="font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest text-sm">FEEDBACK COACH</Typography><Chip label={`${feedbackSim.score}/10`} color={feedbackSim.score >= 7 ? "success" : "warning"} className="font-bold" /></div>
                                                        <Typography className="text-slate-700 dark:text-slate-200 mb-6 text-lg leading-relaxed">{feedbackSim.feedback}</Typography>
                                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><Typography variant="caption" className="font-bold text-slate-400 block mb-2">SUGGERIMENTO DI RISPOSTA</Typography><Typography className="italic text-slate-600 dark:text-slate-400">"{feedbackSim.improved_version}"</Typography></div>
                                                        <Button className="mt-6 text-slate-600 dark:text-slate-400" onClick={() => { setInterviewQ(''); setFeedbackSim(null); }}>Nuova Domanda</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

        </div>
      </Fade>
    </div>
  );
}