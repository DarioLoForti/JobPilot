import { useState, useEffect } from 'react';
import { 
  Typography, Paper, Grid, Button, Box, TextField, 
  Avatar, Chip, CircularProgress, MobileStepper, 
  Stepper, Step, StepLabel, Divider
} from '@mui/material';
import { 
  Psychology, RecordVoiceOver, KeyboardArrowLeft, 
  KeyboardArrowRight, AutoAwesome, CheckCircle, EmojiObjects,
  Engineering, Groups, Favorite, Assessment, Science
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown'; 
import toast from 'react-hot-toast';

// Configurazione STEP UCAF
const UCAF_STEPS = [
  { label: 'Core Technical', icon: <Engineering />, desc: 'Simulazione pratica (Work Sample)' },
  { label: 'Cognitive', icon: <Psychology />, desc: 'Logica e Problem Solving' },
  { label: 'Behavioral', icon: <Groups />, desc: 'Intervista Comportamentale (STAR)' },
  { label: 'Values', icon: <Favorite />, desc: 'Fit Culturale e Motivazione' }
];

export default function Coach() {
  const [activeTab, setActiveTab] = useState('ucaf'); // 'identity', 'simulator', 'ucaf'
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
  const [activeStepUcaf, setActiveStepUcaf] = useState(-1); // -1: Selezione, 0-3: Test, 4: Report
  const [ucafQuestions, setUcafQuestions] = useState(null);
  const [ucafAnswers, setUcafAnswers] = useState({ s1: '', s2: '', s3: '', s4: '' });
  const [ucafResult, setUcafResult] = useState(null);

  useEffect(() => {
    fetchProfileHistory();
    fetchJobs();
  }, []);

  const fetchProfileHistory = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/coach/history', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      if (data) setProfile(data);
    }
  };

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setJobs(await res.json());
  };

  // =========================================================
  // LOGICA IDENTITY LAB
  // =========================================================
  const startIdentityTest = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch('/api/coach/test', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTestQuestions(data);
    setIsTestingIdentity(true);
    setLoading(false);
  };

  const submitIdentityTest = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const formattedAnswers = testQuestions.map((q, i) => ({ question: q.text, answer: answersIdentity[i] }));
    
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
    setLoading(false);
  };

  // =========================================================
  // LOGICA QUICK SIMULATOR
  // =========================================================
  const startQuickSim = async () => {
    if (!selectedJobSim) return toast.error("Seleziona un lavoro!");
    setLoading(true);
    setFeedbackSim(null);
    setUserAnswerSim('');
    const token = localStorage.getItem('token');
    
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
    setLoading(false);
  };

  const submitQuickSim = async () => {
    if (!userAnswerSim) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const res = await fetch('/api/coach/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question: interviewQ, answer: userAnswerSim })
    });
    
    setFeedbackSim(await res.json());
    setLoading(false);
  };

  // =========================================================
  // LOGICA U.C.A.F. PROTOCOL
  // =========================================================
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

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER */}
      <Box className="mb-8 text-center">
        <Typography variant="h3" className="font-black text-indigo-900 dark:text-white mb-2">
          AI Career Coach
        </Typography>
        <Typography className="text-slate-500 dark:text-slate-400">
          Preparazione mentale, strategica e tecnica.
        </Typography>
      </Box>

      {/* NAVIGATION TABS */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        {[
            { id: 'ucaf', label: 'U.C.A.F. Protocol', icon: <Science /> },
            { id: 'identity', label: 'Identity Lab', icon: <Psychology /> },
            { id: 'simulator', label: 'Quick Mock', icon: <RecordVoiceOver /> }
        ].map((tab) => (
            <Button 
                key={tab.id}
                startIcon={tab.icon} 
                variant={activeTab === tab.id ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-6 py-2 border-2 ${
                    activeTab === tab.id 
                    ? 'bg-indigo-600 border-indigo-600 font-bold' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
            >
                {tab.label}
            </Button>
        ))}
      </div>

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB: U.C.A.F. PROTOCOL */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'ucaf' && (
        <div className="max-w-5xl mx-auto">
          {activeStepUcaf >= 0 && activeStepUcaf < 4 && (
            <Stepper activeStep={activeStepUcaf} alternativeLabel className="mb-10">
              {UCAF_STEPS.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel StepIconComponent={() => (
                    <div className={`p-2 rounded-full ${activeStepUcaf === index ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {step.icon}
                    </div>
                  )}>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{step.label}</span>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {/* FASE SELEZIONE */}
          {activeStepUcaf === -1 && (
             <Paper className="p-8 rounded-3xl text-center border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-slate-800/50">
               <Assessment sx={{ fontSize: 60, color: '#6366f1', mb: 2 }} />
               <Typography variant="h5" className="font-bold mb-4 text-slate-800 dark:text-white">Seleziona una candidatura</Typography>
               <Typography className="mb-8 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                 L'AI genererà 4 prove specifiche (Work Sample, Logica, STAR, Values) basate sull'annuncio reale per valutare il tuo Total Fit Score.
               </Typography>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                 {jobs.map(job => (
                   <div 
                     key={job.id} 
                     onClick={() => setSelectedJobUcaf(job)}
                     className={`p-4 rounded-xl cursor-pointer border-2 transition-all text-left ${
                         selectedJobUcaf?.id === job.id 
                         ? 'border-indigo-600 bg-white dark:bg-slate-700 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-900' 
                         : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500'
                     }`}
                   >
                     <Typography className="font-bold text-slate-800 dark:text-white line-clamp-1">{job.position}</Typography>
                     <Typography variant="caption" className="text-slate-500 dark:text-slate-400 line-clamp-1">{job.company}</Typography>
                   </div>
                 ))}
               </div>
               <Button 
                 variant="contained" size="large" onClick={startUCAF} disabled={!selectedJobUcaf || loading}
                 className="bg-indigo-600 hover:bg-indigo-700 px-12 py-3 rounded-xl font-bold text-lg disabled:opacity-50"
               >
                 {loading ? <CircularProgress size={24} color="inherit" /> : "AVVIA PROTOCOLLO"}
               </Button>
             </Paper>
          )}

          {/* FASE TEST (0-3) */}
          {activeStepUcaf >= 0 && activeStepUcaf < 4 && ucafQuestions && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Paper className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-full">
                  <Typography variant="overline" className="text-indigo-600 dark:text-indigo-400 font-bold">Modulo {activeStepUcaf + 1}/4</Typography>
                  <Typography variant="h5" className="font-black mt-2 mb-4 text-slate-900 dark:text-white">{UCAF_STEPS[activeStepUcaf].label}</Typography>
                  <Typography className="text-slate-600 dark:text-slate-300 mb-4">{UCAF_STEPS[activeStepUcaf].desc}</Typography>
                  <Divider className="dark:border-slate-600" />
                  <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Sii specifico. L'AI valuterà la qualità del tuo ragionamento, non solo la risposta finale.
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper className="p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <Typography variant="h6" className="font-bold mb-6 text-slate-800 dark:text-white leading-relaxed">
                    {currentUcafQuestion()}
                  </Typography>
                  <TextField 
                    fullWidth multiline rows={8} variant="outlined" placeholder="Scrivi la tua soluzione..." 
                    value={ucafAnswers[currentUcafKey()]}
                    onChange={(e) => setUcafAnswers({...ucafAnswers, [currentUcafKey()]: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-900 mb-6 rounded-lg"
                    sx={{ 
                        '& .MuiOutlinedInput-root': { 
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }, // Bordo più sottile in dark
                            color: 'inherit'
                        }
                    }}
                  />
                  <Box className="flex justify-end mt-6">
                    <Button 
                      variant="contained" size="large" 
                      onClick={() => activeStepUcaf === 3 ? submitUCAF() : setActiveStepUcaf(p => p+1)}
                      disabled={!ucafAnswers[currentUcafKey()] || loading}
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8"
                    >
                      {loading ? "Valutazione..." : (activeStepUcaf === 3 ? "Termina & Valuta" : "Prossimo Modulo")}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* FASE REPORT (4) */}
          {activeStepUcaf === 4 && ucafResult && (
            <div className="animate-fade-in">
              <Paper className="p-8 rounded-3xl border-t-8 border-indigo-600 shadow-2xl mb-8 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-6">
                  <div>
                    <Typography variant="h4" className="font-black text-slate-900 dark:text-white">Universal Hiring Scorecard</Typography>
                    <Typography className="text-slate-500 dark:text-slate-400">Report generato dall'IA basato su standard U.C.A.F.</Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h2" className={`font-black ${ucafResult.score_total >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {ucafResult.score_total}
                    </Typography>
                    <Typography variant="caption" className="font-bold text-slate-400 uppercase">Total Fit Score</Typography>
                  </div>
                </div>
                {/* PROSE DARK MODE SUPPORT */}
                <div className="prose prose-indigo max-w-none dark:prose-invert bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <ReactMarkdown>{ucafResult.markdown_report}</ReactMarkdown>
                </div>
                <div className="text-center mt-10">
                  <Button variant="outlined" onClick={() => setActiveStepUcaf(-1)} className="dark:text-white dark:border-slate-600">Nuova Valutazione</Button>
                </div>
              </Paper>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB: IDENTITY LAB */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'identity' && (
        <Grid container spacing={4} justifyContent="center">
          {!profile && !isTestingIdentity && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-3xl w-full border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Psychology sx={{ fontSize: 80, color: '#cbd5e1' }} />
              <Typography variant="h6" className="mt-4 mb-6 text-slate-600 dark:text-slate-300">Non conosci ancora il tuo archetipo professionale?</Typography>
              <Button variant="contained" size="large" onClick={startIdentityTest} className="bg-indigo-600 px-10 py-3 rounded-xl">Inizia Test Personalità</Button>
            </div>
          )}

          {isTestingIdentity && (
            <Grid item xs={12} md={8}>
              <Paper className="p-8 rounded-3xl shadow-xl relative overflow-hidden bg-white dark:bg-slate-800">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-slate-700">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((activeStepIdentity + 1) / testQuestions.length) * 100}%` }}></div>
                </div>
                <Typography variant="overline" className="text-slate-400 font-bold">Domanda {activeStepIdentity + 1} di {testQuestions.length}</Typography>
                <Typography variant="h5" className="font-bold my-6 text-slate-800 dark:text-white">{testQuestions[activeStepIdentity]?.text}</Typography>
                <TextField 
                  fullWidth multiline rows={4} placeholder="Rispondi sinceramente..." 
                  value={answersIdentity[activeStepIdentity] || ''}
                  onChange={(e) => setAnswersIdentity({...answersIdentity, [activeStepIdentity]: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-900 mb-6"
                  sx={{ '& .MuiInputBase-input': { color: 'inherit' } }}
                />
                <MobileStepper
                  variant="text" steps={testQuestions.length} position="static" activeStep={activeStepIdentity}
                  className="dark:bg-transparent dark:text-white"
                  nextButton={
                    <Button size="small" onClick={activeStepIdentity === testQuestions.length - 1 ? submitIdentityTest : () => setActiveStepIdentity(p=>p+1)} disabled={!answersIdentity[activeStepIdentity]}>
                      {activeStepIdentity === testQuestions.length - 1 ? 'Analizza' : 'Avanti'} <KeyboardArrowRight />
                    </Button>
                  }
                  backButton={<Button size="small" onClick={() => setActiveStepIdentity(p=>p-1)} disabled={activeStepIdentity === 0}><KeyboardArrowLeft /> Indietro</Button>}
                />
              </Paper>
            </Grid>
          )}

          {profile && !isTestingIdentity && (
            <Grid item xs={12} md={10}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-10 text-white shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-8 animate-fade-in">
                <Avatar sx={{ width: 120, height: 120, bgcolor: 'white', color: '#4f46e5', fontSize: 50, fontWeight: 'bold' }}>{profile.archetype[0]}</Avatar>
                <div>
                  <Typography variant="overline" className="opacity-80 font-bold tracking-widest">Il tuo Archetipo</Typography>
                  <Typography variant="h3" className="font-black mb-2">{profile.archetype}</Typography>
                  <Typography className="text-indigo-100 text-lg leading-relaxed">{profile.description}</Typography>
                </div>
              </div>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper className="p-6 rounded-2xl h-full border-t-4 border-emerald-400 bg-white dark:bg-slate-800">
                    <Typography variant="h6" className="font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><CheckCircle className="text-emerald-500"/> Punti di Forza</Typography>
                    <div className="flex flex-wrap gap-2">{profile.strengths.map((s, i) => <Chip key={i} label={s} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold" />)}</div>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper className="p-6 rounded-2xl h-full border-t-4 border-amber-400 bg-white dark:bg-slate-800">
                    <Typography variant="h6" className="font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><EmojiObjects className="text-amber-500"/> Soft Skills</Typography>
                    <div className="flex flex-wrap gap-2">{profile.soft_skills.map((s, i) => <Chip key={i} label={s} className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold" />)}</div>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper className="p-6 rounded-2xl h-full border-t-4 border-blue-400 bg-white dark:bg-slate-800">
                    <Typography variant="h6" className="font-bold mb-4 text-slate-800 dark:text-white">Ambiente Ideale</Typography>
                    <Typography variant="body2" className="text-slate-600 dark:text-slate-300">{profile.ideal_environment}</Typography>
                  </Paper>
                </Grid>
              </Grid>
              <div className="text-center mt-8"><Button onClick={startIdentityTest} variant="text" color="primary">Rifai il test</Button></div>
            </Grid>
          )}
        </Grid>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB: QUICK SIMULATOR */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'simulator' && (
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper className="p-6 rounded-2xl h-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Typography variant="h6" className="font-bold mb-4 text-slate-800 dark:text-white">Seleziona Job</Typography>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => { setSelectedJobSim(job); setInterviewQ(''); setFeedbackSim(null); }} 
                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedJobSim?.id === job.id 
                        ? 'border-indigo-500 bg-white dark:bg-slate-700 shadow-md' 
                        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-500'
                    }`}
                  >
                    <Typography className="font-bold text-slate-800 dark:text-white">{job.position}</Typography>
                    <Typography variant="caption" className="text-slate-500 dark:text-slate-400">{job.company}</Typography>
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper className="p-8 rounded-3xl min-h-[500px] flex flex-col justify-between relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              {!selectedJobSim ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <RecordVoiceOver sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography>Seleziona un lavoro a sinistra</Typography>
                </div>
              ) : (
                <>
                  {!interviewQ ? (
                    <div className="text-center py-10">
                      <Typography variant="h5" className="font-bold mb-2 text-slate-800 dark:text-white">Mock Interview: {selectedJobSim.position}</Typography>
                      <Button variant="contained" size="large" onClick={startQuickSim} disabled={loading} className="bg-indigo-600 rounded-xl px-8 mt-4">
                        {loading ? <CircularProgress size={24} color="inherit"/> : "Genera Domanda"}
                      </Button>
                    </div>
                  ) : (
                    <div className="animate-fade-in w-full">
                      <div className="flex gap-4 mb-6">
                        <Avatar sx={{ bgcolor: '#1e293b' }}><RecordVoiceOver /></Avatar>
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-600 max-w-[85%]">
                          <Typography className="font-bold text-slate-800 dark:text-white text-lg">{interviewQ}</Typography>
                        </div>
                      </div>
                      {!feedbackSim ? (
                        <div className="mt-8">
                          <TextField 
                            fullWidth multiline rows={4} 
                            label="La tua risposta..." 
                            variant="filled" 
                            value={userAnswerSim} 
                            onChange={(e) => setUserAnswerSim(e.target.value)} 
                            className="bg-white dark:bg-slate-900 rounded-xl"
                            sx={{ '& .MuiFilledInput-root': { backgroundColor: 'transparent' } }}
                          />
                          <div className="flex justify-end mt-4">
                            <Button variant="contained" onClick={submitQuickSim} disabled={loading || !userAnswerSim} className="bg-indigo-600 rounded-xl">{loading ? "Analisi..." : "Invia Risposta"}</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="animate-fade-in mt-6">
                          <div className="flex gap-4 flex-row-reverse">
                            <Avatar sx={{ bgcolor: '#4f46e5' }}><AutoAwesome /></Avatar>
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-2xl rounded-tr-none border border-indigo-100 dark:border-indigo-800 max-w-[90%] text-left">
                              <div className="flex items-center justify-between mb-2">
                                <Typography variant="caption" className="font-bold text-indigo-800 dark:text-indigo-300 uppercase">Coach Feedback</Typography>
                                <Chip label={`${feedbackSim.score}/10`} color={feedbackSim.score >= 7 ? "success" : "warning"} size="small" />
                              </div>
                              <Typography className="text-slate-700 dark:text-slate-300 mb-4">{feedbackSim.feedback}</Typography>
                              <Divider className="my-3 dark:border-indigo-800"/>
                              <Typography variant="caption" className="font-bold text-slate-500 dark:text-slate-400 block mb-1">MIGLIORAMENTO:</Typography>
                              <Typography variant="body2" className="italic text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">"{feedbackSim.improved_version}"</Typography>
                              <Button size="small" className="mt-4 dark:text-indigo-300" onClick={() => { setInterviewQ(''); setFeedbackSim(null); }}>Nuova Domanda</Button>
                            </div>
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
  );
}