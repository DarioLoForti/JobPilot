import { useState, useEffect } from 'react';
import { 
  Typography, Paper, Grid, Button, Box, TextField, 
  Avatar, Chip, CircularProgress, Fade
} from '@mui/material';
import { 
  Psychology, RecordVoiceOver, 
  AutoAwesome, CheckCircle, Engineering, Groups, Favorite, Assessment, Science, 
  HelpOutline
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown'; 
import toast from 'react-hot-toast';

// Configurazione STEP UCAF
const UCAF_STEPS = [
  { label: 'Technical', icon: <Engineering /> },
  { label: 'Cognitive', icon: <Psychology /> },
  { label: 'Behavioral', icon: <Groups /> },
  { label: 'Values', icon: <Favorite /> }
];

export default function Coach() {
  const [activeTab, setActiveTab] = useState('ucaf'); 
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  // States
  const [profile, setProfile] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [activeStepIdentity, setActiveStepIdentity] = useState(0);
  const [answersIdentity, setAnswersIdentity] = useState({});
  const [isTestingIdentity, setIsTestingIdentity] = useState(false);

  const [selectedJobSim, setSelectedJobSim] = useState(null);
  const [interviewQ, setInterviewQ] = useState('');
  const [userAnswerSim, setUserAnswerSim] = useState('');
  const [feedbackSim, setFeedbackSim] = useState(null);

  const [selectedJobUcaf, setSelectedJobUcaf] = useState(null);
  const [activeStepUcaf, setActiveStepUcaf] = useState(-1); 
  const [ucafQuestions, setUcafQuestions] = useState(null);
  const [ucafAnswers, setUcafAnswers] = useState({ s1: '', s2: '', s3: '', s4: '' });
  const [ucafResult, setUcafResult] = useState(null);

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
    try { const res = await fetch('/api/coach/history', { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setProfile(await res.json()); } catch (e) {}
  };

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    try { const res = await fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setJobs(await res.json()); } catch (e) {}
  };

  // --- API CALLS ---
  const apiCall = async (url, body, callback) => {
    setLoading(true);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(body)
        });
        if (res.ok) callback(await res.json());
        else toast.error("Errore operazione");
    } catch(e) { toast.error("Errore di rete"); }
    finally { setLoading(false); }
  };

  // Wrappers
  const startIdentityTest = async () => { setLoading(true); try { const res = await fetch('/api/coach/test', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setTestQuestions(await res.json()); setIsTestingIdentity(true); } finally { setLoading(false); } };
  const submitIdentityTest = () => apiCall('/api/coach/test/submit', { answers: testQuestions.map((q, i) => ({ question: q.text, answer: answersIdentity[i] })) }, (data) => { setProfile(data); setIsTestingIdentity(false); toast.success("Profilo creato!"); });
  
  const startQuickSim = () => apiCall('/api/coach/interview/start', { company: selectedJobSim.company, position: selectedJobSim.position, description: selectedJobSim.job_description }, (data) => setInterviewQ(data.question));
  const submitQuickSim = () => apiCall('/api/coach/interview/evaluate', { question: interviewQ, answer: userAnswerSim }, (data) => setFeedbackSim(data));

  const startUCAF = () => apiCall('/api/coach/ucaf/start', { jobId: selectedJobUcaf.id }, (data) => { setUcafQuestions(data); setActiveStepUcaf(0); });
  const submitUCAF = () => apiCall('/api/coach/ucaf/evaluate', { jobId: selectedJobUcaf.id, questions: ucafQuestions, answers: ucafAnswers }, (data) => { setUcafResult(data); setActiveStepUcaf(4); });

  const startQuiz = () => apiCall('/api/coach/quiz/start', {}, (data) => { setQuizQuestions(data); setIsQuizzing(true); setQuizAnswers({}); setActiveStepQuiz(0); setQuizResult(null); });
  const submitQuiz = () => apiCall('/api/coach/quiz/evaluate', { questions: quizQuestions, answers: quizAnswers }, (data) => { setQuizResult(data); setIsQuizzing(false); });

  const currentUcafQuestion = () => {
    if (!ucafQuestions) return "";
    return [ucafQuestions.section_1_task, ucafQuestions.section_2_logic, ucafQuestions.section_3_behavioral, ucafQuestions.section_4_values][activeStepUcaf];
  };
  
  const currentUcafKey = () => ['s1', 's2', 's3', 's4'][activeStepUcaf];

  return (
    // FIX: bg-slate-100 (Grigio chiaro) invece di bianco
    <div className="relative min-h-screen bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto px-4 pt-10 animate-fade-in relative z-10">
        
        {/* HEADER */}
        <Box className="mb-12 text-center">
          <Typography variant="h2" className="font-black text-slate-900 dark:text-white mb-2 tracking-tight drop-shadow-lg">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400">Coach</span>
          </Typography>
          <Typography className="text-slate-500 dark:text-slate-400 text-lg font-light tracking-wide">
            Potenziamento di carriera next-gen.
          </Typography>
        </Box>

        {/* TABS */}
        <div className="flex justify-center flex-wrap gap-4 mb-16 sticky top-24 z-50">
          {[
              { id: 'ucaf', label: 'U.C.A.F.', icon: <Science /> },
              { id: 'quiz', label: 'Skill Audit', icon: <HelpOutline /> },
              { id: 'identity', label: 'Identity', icon: <Psychology /> },
              { id: 'simulator', label: 'Simulator', icon: <RecordVoiceOver /> }
          ].map((tab) => (
              <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-500 backdrop-blur-md border ${
                      activeTab === tab.id 
                      ? 'bg-blue-100 dark:bg-white/10 border-blue-300 dark:border-cyan-500/50 text-blue-700 dark:text-cyan-300 shadow-md' 
                      : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                  {tab.icon} {tab.label}
              </button>
          ))}
        </div>

        <Fade in={true} key={activeTab} timeout={600}>
          <div>
              {/* --- SKILL AUDIT (QUIZ) --- */}
              {activeTab === 'quiz' && (
                  <Grid container spacing={4} justifyContent="center">
                      {!isQuizzing && !quizResult && (
                          <div className="text-center w-full max-w-3xl">
                              <Paper className="glass-panel p-12 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-indigo-100 dark:from-cyan-500/20 dark:to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-200 dark:border-white/10">
                                      <HelpOutline sx={{ fontSize: 50, color: '#22d3ee' }} />
                                  </div>
                                  <Typography variant="h3" className="font-bold text-slate-900 dark:text-white mb-4">Deep Skill Audit</Typography>
                                  <Typography className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
                                      Generazione di un esame adattivo di <strong>30 domande</strong> basato sul tuo profilo neurale.
                                  </Typography>
                                  <Button onClick={startQuiz} disabled={loading} className="btn-neon px-12 py-4 rounded-2xl text-lg w-full md:w-auto">
                                      {loading ? "Generazione in corso..." : "Avvia Scansione Competenze"}
                                  </Button>
                              </Paper>
                          </div>
                      )}

                      {isQuizzing && quizQuestions.length > 0 && (
                          <Grid item xs={12} md={8}>
                              <Paper className="glass-panel p-8 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                  <div className="flex justify-between items-center mb-8">
                                      <Typography variant="overline" className="text-cyan-600 dark:text-cyan-400 font-bold tracking-widest">Q{activeStepQuiz + 1} / {quizQuestions.length}</Typography>
                                      <div className="h-1 w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div className="h-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-500" style={{ width: `${((activeStepQuiz + 1) / quizQuestions.length) * 100}%` }}></div>
                                      </div>
                                  </div>
                                  <Typography variant="h5" className="font-bold mb-10 text-slate-800 dark:text-white leading-relaxed">{quizQuestions[activeStepQuiz].question}</Typography>
                                  <div className="grid gap-4 mb-10">
                                      {quizQuestions[activeStepQuiz].options.map((opt, idx) => {
                                          const isSelected = quizAnswers[quizQuestions[activeStepQuiz].id] === opt;
                                          return (
                                              <div key={idx} onClick={() => setQuizAnswers({...quizAnswers, [quizQuestions[activeStepQuiz].id]: opt})}
                                                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center gap-4 ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 shadow-md' : 'border-slate-200 dark:border-white/5 hover:border-cyan-300 dark:hover:border-white/20 bg-white dark:bg-transparent'}`}
                                              >
                                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-cyan-500' : 'border-slate-400'}`}>
                                                      {isSelected && <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />}
                                                  </div>
                                                  <span className={`text-lg ${isSelected ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-300'}`}>{opt}</span>
                                              </div>
                                          );
                                      })}
                                  </div>
                                  <div className="flex justify-between">
                                      <Button disabled={activeStepQuiz === 0} onClick={() => setActiveStepQuiz(p => p-1)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Indietro</Button>
                                      <Button onClick={activeStepQuiz === quizQuestions.length - 1 ? submitQuiz : () => setActiveStepQuiz(p => p+1)} disabled={!quizAnswers[quizQuestions[activeStepQuiz].id] || loading} className="btn-neon rounded-xl px-8 py-2">
                                          {loading ? "Calcolo..." : (activeStepQuiz === quizQuestions.length - 1 ? "Termina" : "Avanti")}
                                      </Button>
                                  </div>
                              </Paper>
                          </Grid>
                      )}

                      {quizResult && !isQuizzing && (
                          <Grid item xs={12} md={10}>
                              <Paper className="glass-panel p-12 rounded-[3rem] text-center border-t-4 border-cyan-500 bg-white dark:bg-white/5 shadow-xl dark:shadow-none">
                                  <div className="inline-block relative mb-8">
                                      <CircularProgress variant="determinate" value={100} size={180} thickness={1} sx={{ color: 'rgba(128,128,128,0.1)', position: 'absolute' }} />
                                      <CircularProgress variant="determinate" value={quizResult.score} size={180} thickness={2} sx={{ color: quizResult.score > 70 ? '#10b981' : '#f59e0b' }} />
                                      <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                          <span className="text-6xl font-black text-slate-900 dark:text-white">{quizResult.score}</span>
                                      </Box>
                                  </div>
                                  <Typography variant="h3" className="font-bold text-slate-900 dark:text-white mb-2">{quizResult.level}</Typography>
                                  <Typography className="text-slate-500 dark:text-slate-400 italic mb-10 max-w-2xl mx-auto">"{quizResult.analysis}"</Typography>
                                  <div className="grid md:grid-cols-2 gap-6 text-left">
                                      <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                                          <Typography className="text-emerald-600 dark:text-emerald-400 font-bold mb-4 flex gap-2"><CheckCircle/> Punti di Forza</Typography>
                                          <ul className="space-y-2 text-slate-700 dark:text-slate-300">{quizResult.top_skills.map(s => <li key={s}>• {s}</li>)}</ul>
                                      </div>
                                      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                          <Typography className="text-amber-600 dark:text-amber-400 font-bold mb-4 flex gap-2"><AutoAwesome/> Aree di Crescita</Typography>
                                          <ul className="space-y-2 text-slate-700 dark:text-slate-300">{quizResult.areas_to_improve.map(s => <li key={s}>• {s}</li>)}</ul>
                                      </div>
                                  </div>
                                  <Button onClick={startQuiz} className="mt-12 btn-neon px-10 py-3 rounded-xl">Nuovo Audit</Button>
                              </Paper>
                          </Grid>
                      )}
                  </Grid>
              )}

              {/* --- UCAF --- */}
              {activeTab === 'ucaf' && (
                  <div className="max-w-6xl mx-auto">
                      {activeStepUcaf === -1 && (
                          <Paper className="glass-panel p-12 rounded-[2.5rem] text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                              <Assessment sx={{ fontSize: 60, color: '#a78bfa', mb: 4 }} />
                              <Typography variant="h3" className="font-bold mb-4 text-slate-900 dark:text-white">Seleziona Candidatura</Typography>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 mt-8">
                                  {jobs.map(job => (
                                      <div key={job.id} onClick={() => setSelectedJobUcaf(job)} className={`p-6 rounded-2xl cursor-pointer border transition-all text-left ${selectedJobUcaf?.id === job.id ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                                          <Typography className="font-bold text-slate-800 dark:text-white">{job.position}</Typography>
                                          <Typography variant="caption" className="text-slate-500 dark:text-slate-400">{job.company}</Typography>
                                      </div>
                                  ))}
                              </div>
                              <Button onClick={startUCAF} disabled={!selectedJobUcaf || loading} className="btn-neon px-12 py-4 rounded-xl text-lg">
                                  {loading ? <CircularProgress size={24} color="inherit" /> : "Avvia Protocollo U.C.A.F."}
                              </Button>
                          </Paper>
                      )}

                      {activeStepUcaf >= 0 && activeStepUcaf < 4 && ucafQuestions && (
                          <Grid container spacing={6}>
                              <Grid item xs={12} md={4}>
                                  <Paper className="glass-panel p-8 rounded-[2rem] h-full sticky top-32 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                      <Typography variant="overline" className="text-indigo-500 dark:text-indigo-400 font-bold">Modulo {activeStepUcaf + 1}/4</Typography>
                                      <Typography variant="h4" className="font-bold my-4 text-slate-900 dark:text-white">{UCAF_STEPS[activeStepUcaf].label}</Typography>
                                      <Typography className="text-slate-500 dark:text-slate-400 leading-relaxed">{UCAF_STEPS[activeStepUcaf].desc}</Typography>
                                  </Paper>
                              </Grid>
                              <Grid item xs={12} md={8}>
                                  <Paper className="glass-panel p-8 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                      <Typography className="text-lg text-slate-700 dark:text-slate-200 mb-6 font-medium">{currentUcafQuestion()}</Typography>
                                      <TextField 
                                          fullWidth multiline rows={10} placeholder="Scrivi la tua analisi..." 
                                          value={ucafAnswers[currentUcafKey()] || ''} onChange={(e) => setUcafAnswers({...ucafAnswers, [currentUcafKey()]: e.target.value})} 
                                          className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl mb-8"
                                      />
                                      <div className="flex justify-end">
                                          <Button onClick={() => activeStepUcaf === 3 ? submitUCAF() : setActiveStepUcaf(p => p+1)} disabled={!ucafAnswers[currentUcafKey()] || loading} className="btn-neon rounded-xl px-10 py-3">
                                              {loading ? "Analisi..." : (activeStepUcaf === 3 ? "Concludi" : "Prossimo")}
                                          </Button>
                                      </div>
                                  </Paper>
                              </Grid>
                          </Grid>
                      )}

                      {activeStepUcaf === 4 && ucafResult && (
                          <Paper className="glass-panel p-12 rounded-[3rem] border-t-4 border-indigo-500 bg-white dark:bg-white/5 shadow-xl dark:shadow-none">
                              <div className="flex justify-between items-center mb-10 pb-10 border-b border-slate-200 dark:border-white/10">
                                  <Typography variant="h3" className="font-bold text-slate-900 dark:text-white">Scorecard</Typography>
                                  <div className="text-center">
                                      <Typography variant="h2" className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500">{ucafResult.score_total}</Typography>
                                      <Typography variant="caption" className="text-slate-400 uppercase tracking-widest">Total Fit</Typography>
                                  </div>
                              </div>
                              <div className="prose prose-lg max-w-none text-slate-600 dark:text-slate-300 dark:prose-invert">
                                  <ReactMarkdown>{ucafResult.markdown_report}</ReactMarkdown>
                              </div>
                              <div className="text-center mt-12"><Button onClick={() => setActiveStepUcaf(-1)} className="btn-neon px-8 py-3 rounded-xl">Nuova Valutazione</Button></div>
                          </Paper>
                      )}
                  </div>
              )}

              {/* --- IDENTITY LAB --- */}
              {activeTab === 'identity' && (
                  <Grid container spacing={4} justifyContent="center">
                      {!profile && !isTestingIdentity && (
                          <div className="text-center w-full max-w-3xl">
                              <Paper className="glass-panel p-12 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                  <Psychology sx={{ fontSize: 70, color: '#f472b6', mb: 4 }} />
                                  <Typography variant="h3" className="font-bold text-slate-900 dark:text-white mb-4">Identity Lab</Typography>
                                  <Typography className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Analisi psicometrica avanzata per definire il tuo archetipo professionale.</Typography>
                                  <Button onClick={startIdentityTest} disabled={loading} className="btn-neon px-12 py-4 rounded-xl text-lg">
                                      {loading ? <CircularProgress size={24} color="inherit" /> : "Avvia Analisi"}
                                  </Button>
                              </Paper>
                          </div>
                      )}
                      {isTestingIdentity && (
                          <Grid item xs={12} md={8}>
                              <Paper className="glass-panel p-10 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                  <Typography variant="overline" className="text-pink-500 dark:text-pink-400 font-bold tracking-widest">Q{activeStepIdentity + 1} / 5</Typography>
                                  <Typography variant="h5" className="font-bold my-6 text-slate-900 dark:text-white">{testQuestions[activeStepIdentity]?.text}</Typography>
                                  <TextField fullWidth multiline rows={4} placeholder="Rispondi..." value={answersIdentity[activeStepIdentity] || ''} onChange={(e) => setAnswersIdentity({...answersIdentity, [activeStepIdentity]: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl mb-8" />
                                  <div className="flex justify-end"><Button onClick={activeStepIdentity === 4 ? submitIdentityTest : () => setActiveStepIdentity(p=>p+1)} disabled={!answersIdentity[activeStepIdentity]} className="btn-neon rounded-xl px-8 py-2">{activeStepIdentity === 4 ? 'Analizza' : 'Avanti'}</Button></div>
                              </Paper>
                          </Grid>
                      )}
                      {profile && !isTestingIdentity && (
                          <Grid item xs={12} md={10}>
                              <div className="glass-panel p-12 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                                  <Avatar sx={{ width: 150, height: 150 }} className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-black text-6xl shadow-xl">{profile.archetype[0]}</Avatar>
                                  <div>
                                      <Typography variant="overline" className="text-pink-500 dark:text-pink-400 font-bold tracking-widest text-lg">ARCHETIPO IDENTIFICATO</Typography>
                                      <Typography variant="h2" className="font-black text-slate-900 dark:text-white mb-4">{profile.archetype}</Typography>
                                      <Typography className="text-slate-600 dark:text-slate-300 text-xl leading-relaxed">{profile.description}</Typography>
                                  </div>
                              </div>
                              <div className="text-center mt-8"><Button onClick={startIdentityTest} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-300 dark:border-white/10 px-6 py-2 rounded-xl">Rifai Analisi</Button></div>
                          </Grid>
                      )}
                  </Grid>
              )}

              {/* --- SIMULATOR --- */}
              {activeTab === 'simulator' && (
                  <Grid container spacing={6} justifyContent="center" className="h-[70vh]">
                      <Grid item xs={12} md={4}>
                          <Paper className="glass-panel p-6 rounded-[2rem] h-full flex flex-col bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                              <Typography variant="h6" className="font-bold mb-6 text-slate-900 dark:text-white px-2">Scenari Disponibili</Typography>
                              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                  {jobs.map(job => (
                                      <div key={job.id} onClick={() => { setSelectedJobSim(job); setInterviewQ(''); setFeedbackSim(null); }} className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedJobSim?.id === job.id ? 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                                          <Typography className="font-bold text-slate-800 dark:text-white">{job.position}</Typography>
                                      </div>
                                  ))}
                              </div>
                          </Paper>
                      </Grid>
                      <Grid item xs={12} md={8}>
                          <Paper className="glass-panel p-10 rounded-[2.5rem] h-full flex flex-col justify-center relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                              {!selectedJobSim ? (
                                  <div className="text-center text-slate-400"><RecordVoiceOver sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} /><Typography>Seleziona uno scenario</Typography></div>
                              ) : (
                                  <>
                                      {!interviewQ ? (
                                          <div className="text-center">
                                              <Typography variant="h4" className="font-bold mb-6 text-slate-900 dark:text-white">Simulazione Vocale</Typography>
                                              <Button onClick={startQuickSim} disabled={loading} className="btn-neon px-10 py-3 rounded-xl">{loading ? <CircularProgress size={24} color="inherit"/> : "Genera Domanda AI"}</Button>
                                          </div>
                                      ) : (
                                          <div className="w-full flex flex-col h-full justify-between">
                                              <div className="flex gap-6 mb-8 items-start"><Avatar className="bg-slate-800 border border-slate-600"><RecordVoiceOver /></Avatar><div className="bg-slate-100 dark:bg-white/10 p-6 rounded-2xl rounded-tl-none border border-slate-200 dark:border-white/10"><Typography className="font-bold text-slate-800 dark:text-white text-lg">{interviewQ}</Typography></div></div>
                                              {!feedbackSim ? (
                                                  <div className="pl-16 flex-1 flex flex-col justify-end">
                                                      <TextField fullWidth multiline rows={4} placeholder="Rispondi..." value={userAnswerSim} onChange={(e) => setUserAnswerSim(e.target.value)} className="input-glass bg-slate-50 dark:bg-black/30 rounded-2xl mb-4" />
                                                      <div className="flex justify-end"><Button onClick={submitQuickSim} disabled={loading} className="btn-neon rounded-xl px-8 py-2">{loading ? "..." : "Invia"}</Button></div>
                                                  </div>
                                              ) : (
                                                  <div className="pl-16 overflow-y-auto pr-2">
                                                      <div className="bg-indigo-50 dark:bg-indigo-500/10 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-500/30">
                                                          <div className="flex justify-between mb-4"><Typography className="font-bold text-indigo-600 dark:text-indigo-300">FEEDBACK</Typography><Chip label={`${feedbackSim.score}/10`} className="bg-indigo-500 text-white font-bold" /></div>
                                                          <Typography className="text-slate-700 dark:text-slate-200 mb-6">{feedbackSim.feedback}</Typography>
                                                          <div className="bg-white dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5"><Typography variant="caption" className="text-slate-500 dark:text-slate-400 block mb-2">SUGGERIMENTO</Typography><Typography className="italic text-slate-600 dark:text-slate-300">"{feedbackSim.improved_version}"</Typography></div>
                                                          <Button className="mt-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => { setInterviewQ(''); setFeedbackSim(null); }}>Nuova Domanda</Button>
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
    </div>
  );
}