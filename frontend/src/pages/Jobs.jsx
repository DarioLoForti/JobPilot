import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  Menu, MenuItem, Tooltip, CircularProgress,
  ToggleButton, ToggleButtonGroup, InputAdornment, IconButton, Grid, Paper, Typography, Chip, Box
} from '@mui/material';
import { 
  Add as AddIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, 
  Edit as EditIcon, Work as WorkIcon, Link as LinkIcon, 
  Event as EventIcon, AutoAwesome as AutoAwesomeIcon, 
  ContentCopy as ContentCopyIcon, Search as SearchIcon,
  AutoFixHigh as AutoFixHighIcon,
  Psychology as PsychologyIcon, ViewKanban,
  DesignServices as DesignServicesIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  MarkEmailRead as FollowUpIcon,
  Mic as MicIcon,
  Warning as WarningIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import AICoachModal from '../components/AICoachModal'; 
import InterviewModal from '../components/InterviewModal'; 

// COLONNE
const COLUMNS = [
  { id: 'wishlist', title: 'Da Inviare', emoji: '📝', bg: 'bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/20' },
  { id: 'applied',  title: 'Inviato',    emoji: '🚀', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' },
  { id: 'interview', title: 'Colloquio',  emoji: '🗣️', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20' },
  { id: 'offer',    title: 'Offerta',    emoji: '🎉', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  { id: 'rejected', title: 'Rifiutato',  emoji: '❌', bg: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' }
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  
  // Stati UI Base
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Stati AI - Match Analysis (QUANDO CLICCHI L'INGRANAGGIO)
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Stati AI - Coach & Letter
  const [coachOpen, setCoachOpen] = useState(false); // Teniamo il coach se serve per altro, ma non sull'icona ingranaggio
  const [selectedJobForCoach, setSelectedJobForCoach] = useState(null);
  const [openLetterModal, setOpenLetterModal] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [letterTone, setLetterTone] = useState('formal');
  const [currentLetterJob, setCurrentLetterJob] = useState(null);

  // Stati AI - Resume Tailor
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorResult, setTailorResult] = useState(null);
  const [selectedJobForTailor, setSelectedJobForTailor] = useState(null);

  // Stati AI - Follow-up
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpEmail, setFollowUpEmail] = useState('');
  const [selectedJobForFollowUp, setSelectedJobForFollowUp] = useState(null);

  // Stati AI - Interview Simulator
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);

  const [formData, setFormData] = useState({ 
    company: '', position: '', job_link: '', job_description: '', status: 'wishlist', interview_date: '', notes: '' 
  });

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchJobs(); 
    const userData = localStorage.getItem('user');
    if (userData && userData !== "undefined") {
      try { setUser(JSON.parse(userData)); } catch (e) { localStorage.removeItem('user'); }
    }
  }, []);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const results = jobs.filter(job => 
      job.company?.toLowerCase().includes(lowerSearch) || 
      job.position?.toLowerCase().includes(lowerSearch)
    );
    setFilteredJobs(results);
  }, [searchTerm, jobs]);

  // --- ACTIONS ---

  const handleMagicScrape = async () => {
    if (!formData.job_link) return toast.error("Incolla prima un link! 🔗");
    setIsScraping(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ url: formData.job_link })
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({ 
          ...formData, company: data.company, position: data.position, job_description: data.job_description 
        });
        toast.success("Dati estratti! ✨");
      } else toast.error("AI scraping fallito.");
    } catch (e) { toast.error("Errore AI"); } 
    finally { setIsScraping(false); }
  };

  // --- NUOVA FUNZIONE: MATCH ANALYSIS (CV vs JOB) ---
  const handleMatchAnalysis = async (job) => {
    setMatchOpen(true);
    setMatchLoading(true);
    setMatchResult(null);
    const token = localStorage.getItem('token');

    try {
        // Chiamata alla rotta GET /api/ai/match/:jobId
        const res = await fetch(`/api/ai/match/${job.id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            setMatchResult(data);
        } else {
            const err = await res.json();
            toast.error(err.error || "Errore analisi match.");
            setMatchOpen(false);
        }
    } catch (e) {
        console.error(e);
        toast.error("Errore di connessione.");
        setMatchOpen(false);
    } finally {
        setMatchLoading(false);
    }
  };

  const handleTailorCV = async (job) => {
    if (!job.job_description || job.job_description.length < 50) return toast.error("Serve una descrizione dell'annuncio!");
    setSelectedJobForTailor(job);
    setTailorOpen(true);
    setTailorLoading(true);
    setTailorResult(null);
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/ai/tailor-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ jobDescription: job.job_description })
        });
        if (res.ok) {
            const data = await res.json();
            setTailorResult(data);
            toast.success("CV Ottimizzato! 🎨");
        } else {
            const err = await res.json();
            toast.error(err.error || "Errore ottimizzazione.");
            setTailorOpen(false);
        }
    } catch (e) { toast.error("Errore di connessione."); } 
    finally { setTailorLoading(false); }
  };

  const handleFollowUp = async (job) => {
    setSelectedJobForFollowUp(job);
    setFollowUpOpen(true);
    setFollowUpLoading(true);
    setFollowUpEmail('');
    const appliedDate = new Date(job.created_at);
    const diffTime = Math.abs(new Date() - appliedDate);
    const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/ai/follow-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ company: job.company, position: job.position, daysAgo: daysAgo })
        });
        if (res.ok) {
            const data = await res.json();
            setFollowUpEmail(data.email);
            toast.success("Email Generata! 📧");
        } else { toast.error("Errore generazione email."); }
    } catch (e) { toast.error("Errore AI."); } 
    finally { setFollowUpLoading(false); }
  };

  const handleInterview = (job) => {
      setSelectedJobForInterview(job);
      setInterviewOpen(true);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const newStatus = destination.droppableId;
    const updatedJobs = jobs.map(job => String(job.id) === String(draggableId) ? { ...job, status: newStatus } : job);
    setJobs(updatedJobs);

    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${draggableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
    });
  };

  const handleOpenCreate = () => {
    setFormData({ company: '', position: '', job_link: '', job_description: '', status: 'wishlist', interview_date: '', notes: '' });
    setIsEditMode(false);
    setOpenModal(true);
  };

  const handleOpenEdit = () => {
    const jobToEdit = jobs.find(j => j.id === selectedJobId);
    if (jobToEdit) {
      const formattedDate = jobToEdit.interview_date ? new Date(jobToEdit.interview_date).toISOString().slice(0, 16) : '';
      setFormData({ ...jobToEdit, interview_date: formattedDate, notes: jobToEdit.notes || '' });
      setCurrentJobId(selectedJobId);
      setIsEditMode(true);
      setOpenModal(true);
      setAnchorEl(null);
    }
  };

  const handleSave = async () => {
    if (!formData.company || !formData.position) return toast.error("Dati mancanti! ⚠️");
    const token = localStorage.getItem('token');
    const url = isEditMode ? `/api/jobs/${currentJobId}` : '/api/jobs';
    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(isEditMode ? "Aggiornato! 🚀" : "Creato! 🎉");
        setOpenModal(false);
        fetchJobs();
      }
    } catch (e) { toast.error("Errore server ❌"); }
  };

  const openLetterGenerator = (job) => {
    setCurrentLetterJob(job);
    setGeneratedLetter('');
    setOpenLetterModal(true);
  };

  const handleGenerateAi = async () => {
    setAiLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            company: currentLetterJob.company, 
            position: currentLetterJob.position, 
            tone: letterTone,
            userName: `${user?.first_name} ${user?.last_name}` 
        })
      });

      if (res.ok) {
        const data = await res.json();
        let finalLetter = "";
        if (data.variants && Array.isArray(data.variants)) {
            const toneMap = { 'formal': 'Formale', 'modern': 'Neutra', 'bold': 'Confidente' };
            const targetType = toneMap[letterTone] || 'Formale';
            const variant = data.variants.find(v => v.type && v.type.includes(targetType)) || data.variants[0];
            finalLetter = variant.letter;
        } else {
            finalLetter = data.letter || "";
        }
        setGeneratedLetter(finalLetter);
        toast.success("Lettera generata! 🤖");
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore generazione.");
      }
    } catch (e) {
        console.error(e);
        toast.error("Errore di connessione.");
    } finally { 
        setAiLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Eliminare definitivamente?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    toast.success("Eliminata 🗑️");
    fetchJobs();
  };

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 min-h-screen text-slate-900 dark:text-slate-100 pb-24 transition-colors duration-300">
      
      {/* HEADER 3D */}
      <Paper className="card-3d p-6 md:p-8 mb-8 rounded-[2rem] flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
        <div className="flex items-center gap-6 z-10 w-full lg:w-auto">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hidden sm:block">
                <ViewKanban fontSize="large" />
            </div>
            <div>
                <Typography variant="h3" className="font-black text-slate-900 dark:text-white mb-1 text-glow">Job Board</Typography>
                <Typography className="text-slate-500 dark:text-slate-400 font-medium">Gestisci il flusso delle tue candidature.</Typography>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto z-10">
            <div className="relative w-full sm:w-80">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" placeholder="Cerca azienda o ruolo..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none transition-all backdrop-blur-sm"
                />
            </div>
            <Button onClick={handleOpenCreate} variant="contained" startIcon={<AddIcon />} className="btn-neon px-8 py-3 rounded-xl font-bold text-lg whitespace-nowrap">
                Nuova Candidatura
            </Button>
        </div>
      </Paper>

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-8 min-h-[70vh] items-start">
          {COLUMNS.map(col => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} {...provided.droppableProps}
                  className={`flex-1 min-w-[300px] w-full p-4 rounded-[2rem] border transition-all duration-300 glass-panel ${col.bg} ${snapshot.isDraggingOver ? 'ring-2 ring-cyan-400 bg-cyan-50 dark:bg-cyan-500/10' : ''}`}
                >
                  <div className="flex justify-between items-center mb-6 px-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{col.emoji}</span>
                        <h3 className="font-black text-slate-700 dark:text-white text-sm uppercase tracking-widest">{col.title}</h3>
                    </div>
                    <span className="bg-white dark:bg-black/30 text-slate-700 dark:text-white px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10">
                      {filteredJobs.filter(j => j.status === col.id).length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {filteredJobs.filter(j => j.status === col.id).map((job, index) => (
                        <Draggable key={String(job.id)} draggableId={String(job.id)} index={index}>
                        {(p, s) => (
                            <div
                            ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                            className={`p-5 rounded-2xl border transition-all group relative overflow-hidden ${s.isDragging ? 'bg-indigo-600/90 shadow-2xl rotate-2 scale-105 z-50 border-indigo-400 text-white' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm'}`}
                            >
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedJobId(job.id); }} className="bg-slate-200 dark:bg-black/40 hover:bg-slate-300 dark:hover:bg-black/60 text-slate-700 dark:text-white p-1 rounded-lg">
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </div>

                                <Typography variant="h6" className={`font-bold mb-1 pr-6 leading-tight ${s.isDragging ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{job.position}</Typography>
                                <Typography className={`text-sm font-medium mb-4 flex items-center gap-1.5 uppercase tracking-wide ${s.isDragging ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                    <WorkIcon sx={{ fontSize: 14 }} /> {job.company}
                                </Typography>

                                {job.interview_date && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 px-3 py-1.5 rounded-lg mb-4 w-fit">
                                        <EventIcon sx={{ fontSize: 14 }} /> 
                                        {new Date(job.interview_date).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                                    </div>
                                )}

                                <div className="flex justify-between items-end mt-2 pt-3 border-t border-slate-100 dark:border-white/5">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${s.isDragging ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-1">
                                        {job.job_link && (
                                            <Tooltip title="Vai all'annuncio">
                                                <IconButton size="small" href={job.job_link} target="_blank" className="text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400"><LinkIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        )}
                                        
                                        <Tooltip title="Ottimizza CV">
                                            <IconButton size="small" onClick={() => handleTailorCV(job)} className="text-slate-400 hover:text-pink-500 dark:hover:text-pink-400">
                                                <DesignServicesIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {/* FOLLOW-UP */}
                                        {job.status === 'applied' && (
                                            <Tooltip title="Genera Follow-up">
                                                <IconButton size="small" onClick={() => handleFollowUp(job)} className="text-slate-400 hover:text-orange-500 dark:hover:text-orange-400">
                                                    <FollowUpIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {/* INTERVIEW SIM */}
                                        {job.status === 'interview' && (
                                            <Tooltip title="Simula Colloquio">
                                                <IconButton size="small" onClick={() => handleInterview(job)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                                                    <MicIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {/* TASTO MATCH ANALYSIS (MODIFICATO) */}
                                        <Tooltip title="Analisi Compatibilità (Match)">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMatchAnalysis(job); }} className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400">
                                                <PsychologyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="AI Letter">
                                            <IconButton size="small" onClick={() => openLetterGenerator(job)} className="text-slate-400 hover:text-purple-500 dark:hover:text-purple-400">
                                                <AutoAwesomeIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* --- MODALI --- */}

      {/* 1. EDIT/CREATE JOB */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ className: 'glass-panel border border-slate-200 dark:border-white/10 bg-white dark:!bg-[#0f172a]', sx: { borderRadius: '24px' } }}>
        <DialogTitle className="font-black text-slate-900 dark:text-white text-xl border-b border-slate-200 dark:border-white/10 pb-4">{isEditMode ? "Modifica Candidatura" : "Nuova Opportunità"}</DialogTitle>
        <DialogContent className="pt-6">
          <TextField 
            margin="normal" label="Link Annuncio" fullWidth value={formData.job_link} onChange={e => setFormData({...formData, job_link: e.target.value})}
            placeholder="Incolla URL..." className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl"
            InputProps={{ endAdornment: (<InputAdornment position="end"><Tooltip title="Auto-fill con AI"><IconButton onClick={handleMagicScrape} disabled={isScraping} className="text-cyan-500 dark:text-cyan-400">{isScraping ? <CircularProgress size={20} /> : <AutoFixHighIcon />}</IconButton></Tooltip></InputAdornment>) }}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField label="Azienda *" fullWidth value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl" /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Ruolo *" fullWidth value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl" /></Grid>
          </Grid>
          <div className="mt-6 mb-2"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Data Colloquio</label><input type="datetime-local" value={formData.interview_date} onChange={e => setFormData({...formData, interview_date: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:border-cyan-500 transition-all" /></div>
          <TextField margin="normal" label="Note Strategiche" fullWidth multiline rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl" />
        </DialogContent>
        <DialogActions className="p-6 border-t border-slate-200 dark:border-white/10"><Button onClick={() => setOpenModal(false)} className="text-slate-500">Annulla</Button><Button onClick={handleSave} variant="contained" className="btn-neon px-8 rounded-xl font-bold">Salva</Button></DialogActions>
      </Dialog>

      {/* 2. MATCH ANALYSIS MODAL (RIPRISTINATO!) */}
      <Dialog open={matchOpen} onClose={() => setMatchOpen(false)} fullWidth maxWidth="md" PaperProps={{ className: 'glass-panel bg-white dark:!bg-[#0f172a] border border-slate-200 dark:border-white/10', sx: { borderRadius: '24px' } }}>
        <DialogTitle className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><PsychologyIcon fontSize="large" /></div>
                <div><Typography variant="h5" className="font-bold">Analisi Compatibilità</Typography><Typography variant="body2" className="text-slate-500 dark:text-slate-400">Match CV vs Job Description</Typography></div>
            </div>
            <IconButton onClick={() => setMatchOpen(false)}><DeleteIcon /></IconButton>
        </DialogTitle>
        <DialogContent className="p-0">
            {matchLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <CircularProgress size={60} className="text-emerald-500 mb-4" />
                    <Typography className="animate-pulse">Analisi competenze in corso...</Typography>
                </div>
            ) : matchResult ? (
                <div className="flex flex-col md:flex-row h-full">
                    {/* SCORE COLUMN */}
                    <div className="w-full md:w-1/3 p-8 border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 flex flex-col items-center justify-center text-center">
                        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                            <CircularProgress variant="determinate" value={100} size={128} className="absolute text-slate-200 dark:text-slate-700" />
                            <CircularProgress variant="determinate" value={matchResult.match_percentage || 0} size={128} className={`absolute ${matchResult.match_percentage >= 75 ? 'text-emerald-500' : matchResult.match_percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`} />
                            <Typography variant="h3" className="font-black text-slate-800 dark:text-white">{matchResult.match_percentage}%</Typography>
                        </div>
                        <Typography variant="h6" className="font-bold mb-2">{matchResult.verdict}</Typography>
                        <Typography variant="body2" className="text-slate-500 dark:text-slate-400 italic">"{matchResult.explainability || matchResult.cv_advice}"</Typography>
                    </div>

                    {/* DETAILS COLUMN */}
                    <div className="w-full md:w-2/3 p-8 overflow-y-auto max-h-[60vh]">
                        <div className="mb-6">
                            <Typography variant="h6" className="font-bold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><ThumbUpIcon fontSize="small" /> Punti di Forza</Typography>
                            <div className="flex flex-wrap gap-2">
                                {matchResult.strengths?.map((skill, i) => (
                                    <Chip key={i} label={skill} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/20" />
                                ))}
                                {(!matchResult.strengths || matchResult.strengths.length === 0) && <Typography className="text-slate-400 text-sm">Nessun punto di forza specifico rilevato.</Typography>}
                            </div>
                        </div>

                        <div>
                            <Typography variant="h6" className="font-bold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400"><WarningIcon fontSize="small" /> Skill Mancanti</Typography>
                            <div className="flex flex-wrap gap-2">
                                {matchResult.missing_skills?.map((skill, i) => (
                                    <Chip key={i} label={skill} className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold border border-red-100 dark:border-red-500/20" />
                                ))}
                                {(!matchResult.missing_skills || matchResult.missing_skills.length === 0) && <Typography className="text-slate-400 text-sm">Ottimo! Sembra che tu abbia tutte le skill richieste.</Typography>}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center">Nessun risultato disponibile. Riprova.</div>
            )}
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
            <Button onClick={() => setMatchOpen(false)} variant="contained" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-6">Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* 3. LETTER GENERATOR */}
      <Dialog open={openLetterModal} onClose={() => setOpenLetterModal(false)} fullWidth maxWidth="md" PaperProps={{ className: 'glass-panel bg-white dark:!bg-[#0f172a] border border-slate-200 dark:border-white/10', sx: { borderRadius: '24px' } }}>
        <DialogTitle className="flex items-center gap-2 font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4"><AutoAwesomeIcon className="text-purple-500 dark:text-purple-400" /> Personal AI Ghostwriter</DialogTitle>
        <DialogContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
            <ToggleButtonGroup value={letterTone} exclusive onChange={(e, v) => v && setLetterTone(v)} size="small" className="bg-slate-200 dark:bg-black/20 rounded-xl">
              <ToggleButton value="formal" className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 px-4">👔 Formale</ToggleButton>
              <ToggleButton value="modern" className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 px-4">🚀 Moderno</ToggleButton>
              <ToggleButton value="bold" className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 px-4">🦁 Audace</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" onClick={handleGenerateAi} disabled={aiLoading} startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />} className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold px-6 text-white">{aiLoading ? "Scrivendo..." : "Genera Lettera"}</Button>
          </div>
          <TextField multiline rows={12} fullWidth value={generatedLetter} onChange={e => setGeneratedLetter(e.target.value)} className="input-glass bg-slate-50 dark:bg-black/20 rounded-2xl" placeholder="L'AI scriverà qui la tua lettera..." sx={{ '& .MuiInputBase-root': { fontFamily: 'serif', lineHeight: 1.8, fontSize: '1.1rem' } }} />
        </DialogContent>
        <DialogActions className="p-6 border-t border-slate-200 dark:border-white/10"><Button onClick={() => setOpenLetterModal(false)} className="text-slate-500">Chiudi</Button><Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(generatedLetter); toast.success("Copiato!"); }} className="btn-neon rounded-xl">Copia</Button></DialogActions>
      </Dialog>

      {/* 4. RESUME TAILORING */}
      <Dialog open={tailorOpen} onClose={() => setTailorOpen(false)} fullWidth maxWidth="lg" PaperProps={{ className: 'glass-panel bg-white dark:!bg-[#0f172a] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10', sx: { borderRadius: '24px', height: '80vh' } }}>
        <DialogTitle className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10"><div className="flex items-center gap-3"><div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400"><DesignServicesIcon fontSize="large" /></div><div><Typography variant="h5" className="font-bold">Resume Tailoring</Typography><Typography variant="body2" className="text-slate-500 dark:text-slate-400">Ottimizzato per: <span className="font-bold text-slate-900 dark:text-white">{selectedJobForTailor?.position}</span> @ {selectedJobForTailor?.company}</Typography></div></div><IconButton onClick={() => setTailorOpen(false)}><DeleteIcon /></IconButton></DialogTitle>
        <DialogContent className="p-0 flex flex-col md:flex-row h-full overflow-hidden">{tailorLoading ? (<div className="w-full h-full flex flex-col items-center justify-center"><CircularProgress size={60} className="text-pink-500 mb-4" /><Typography className="animate-pulse text-lg">L'AI sta riscrivendo il tuo CV per battere gli ATS...</Typography></div>) : tailorResult ? (<><div className="w-full md:w-1/3 p-6 border-r border-slate-200 dark:border-white/10 overflow-y-auto bg-slate-50/50 dark:bg-black/20"><Typography variant="h6" className="font-bold mb-4 flex items-center gap-2 text-pink-600 dark:text-pink-400"><AutoAwesomeIcon fontSize="small"/> Profilo Ottimizzato</Typography><Paper className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm leading-relaxed mb-6 shadow-sm">{tailorResult.optimized_summary}<Button size="small" startIcon={<ContentCopyIcon />} fullWidth onClick={() => {navigator.clipboard.writeText(tailorResult.optimized_summary); toast.success("Copiato!");}} className="mt-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">Copia Testo</Button></Paper><Typography variant="h6" className="font-bold mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircleIcon fontSize="small"/> Parole Chiave ATS</Typography><div className="flex flex-wrap gap-2">{tailorResult.key_skills_to_add?.map((skill, i) => (<Chip key={i} label={skill} className="font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30" />))}</div></div><div className="w-full md:w-2/3 p-6 overflow-y-auto"><Typography variant="h6" className="font-bold mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><LightbulbIcon fontSize="small"/> Suggerimenti per le Esperienze</Typography><div className="flex flex-col gap-4">{tailorResult.experience_enhancements?.map((item, idx) => (<Paper key={idx} className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"><Typography className="font-bold text-lg mb-2 text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">{item.role}</Typography><Typography className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">{item.suggestion}</Typography><Button size="small" startIcon={<ContentCopyIcon />} onClick={() => {navigator.clipboard.writeText(item.suggestion); toast.success("Suggerimento copiato!");}} className="mt-4 text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">Copia Suggerimento</Button></Paper>))}</div></div></>) : <div className="p-10 text-center w-full">Errore nel caricamento dei dati.</div>}</DialogContent>
        <DialogActions className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20"><Button onClick={() => setTailorOpen(false)} variant="contained" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-6">Chiudi</Button></DialogActions>
      </Dialog>

      {/* 5. FOLLOW UP */}
      <Dialog open={followUpOpen} onClose={() => setFollowUpOpen(false)} fullWidth maxWidth="md" PaperProps={{ className: 'glass-panel bg-white dark:!bg-[#0f172a] border border-slate-200 dark:border-white/10', sx: { borderRadius: '24px' } }}>
        <DialogTitle className="flex items-center gap-2 font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4"><FollowUpIcon className="text-orange-500" /> Smart Follow-up</DialogTitle>
        <DialogContent className="pt-6">{followUpLoading ? (<div className="text-center py-10"><CircularProgress size={40} className="text-orange-500 mb-4" /><Typography>Generazione email strategica...</Typography></div>) : (<TextField multiline rows={10} fullWidth value={followUpEmail} className="input-glass bg-slate-50 dark:bg-black/20 rounded-2xl" sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: '0.95rem' } }} />)}</DialogContent>
        <DialogActions className="p-6 border-t border-slate-200 dark:border-white/10"><Button onClick={() => setFollowUpOpen(false)} className="text-slate-500">Chiudi</Button><Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(followUpEmail); toast.success("Copiata!"); }} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Copia Email</Button></DialogActions>
      </Dialog>

      {/* 6. INTERVIEW SIMULATOR */}
      <InterviewModal open={interviewOpen} onClose={() => setInterviewOpen(false)} job={selectedJobForInterview} />

      {/* 7. AI COACH (Solo se chiamato da altre parti, ma non dall'icona ingranaggio) */}
      <AICoachModal open={coachOpen} onClose={() => setCoachOpen(false)} jobId={selectedJobForCoach?.id} jobTitle={selectedJobForCoach?.position} company={selectedJobForCoach?.company} />

      {/* EDIT/DELETE MENU */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white', sx: { borderRadius: '12px' } }}>
        <MenuItem onClick={handleOpenEdit} className="hover:bg-slate-100 dark:hover:bg-white/5"><EditIcon sx={{ mr: 1, fontSize: 18, color: '#22d3ee' }} /> Modifica</MenuItem>
        <MenuItem onClick={() => { handleDelete(selectedJobId); setAnchorEl(null); }} className="hover:bg-slate-100 dark:hover:bg-white/5 text-red-500 dark:text-red-400"><DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Elimina</MenuItem>
      </Menu>

    </div>
  );
}