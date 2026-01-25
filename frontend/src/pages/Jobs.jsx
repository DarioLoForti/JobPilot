import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, MenuItem, Tooltip, Menu, CircularProgress,
  ToggleButton, ToggleButtonGroup, InputAdornment, IconButton, Grid 
} from '@mui/material';
import { 
  Add as AddIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, 
  Edit as EditIcon, Work as WorkIcon, Link as LinkIcon, 
  Event as EventIcon, AutoAwesome as AutoAwesomeIcon, 
  ContentCopy as ContentCopyIcon, Search as SearchIcon,
  AutoFixHigh as AutoFixHighIcon,
  Psychology as PsychologyIcon 
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import AICoachModal from '../components/AICoachModal'; // Assicurati che il percorso sia corretto

const COLUMNS = [
  { id: 'wishlist', title: '📝 Da Inviare',  style: 'bg-blue-50/50 border-blue-100 dark:bg-slate-800/40 dark:border-slate-700' },
  { id: 'applied',  title: '🚀 Inviato',     style: 'bg-amber-50/50 border-amber-100 dark:bg-slate-800/40 dark:border-slate-700' },
  { id: 'interview', title: '🗣️ Colloquio',   style: 'bg-emerald-50/50 border-emerald-100 dark:bg-slate-800/40 dark:border-slate-700' },
  { id: 'offer',    title: '🎉 Offerta!',    style: 'bg-indigo-50/50 border-indigo-100 dark:bg-slate-800/40 dark:border-slate-700' },
  { id: 'rejected', title: '❌ Rifiutato',   style: 'bg-rose-50/50 border-rose-100 dark:bg-slate-800/40 dark:border-slate-700' }
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  
  // Stati UI
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  // Stati AI Coach
  const [coachOpen, setCoachOpen] = useState(false);
  const [selectedJobForCoach, setSelectedJobForCoach] = useState(null);

  // Stati AI Letter
  const [openLetterModal, setOpenLetterModal] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [letterTone, setLetterTone] = useState('formal');
  const [currentLetterJob, setCurrentLetterJob] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  
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
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Errore parsing user:", e);
        localStorage.removeItem('user');
      }
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
          ...formData, 
          company: data.company, 
          position: data.position,
          job_description: data.job_description // Salviamo la descrizione per il coach
        });
        toast.success("Dati estratti con successo! ✨");
      } else {
        toast.error("L'AI non è riuscita a leggere il link.");
      }
    } catch (e) {
      toast.error("Errore di connessione AI");
    } finally {
      setIsScraping(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const newStatus = destination.droppableId;
    const updatedJobs = jobs.map(job => 
        String(job.id) === String(draggableId) ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);

    const token = localStorage.getItem('token');
    try {
        await fetch(`/api/jobs/${draggableId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (error) {
        toast.error("Errore salvataggio spostamento ❌");
        fetchJobs(); 
    }
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
      setFormData({
        company: jobToEdit.company, 
        position: jobToEdit.position, 
        job_link: jobToEdit.job_link || '', 
        job_description: jobToEdit.job_description || '',
        status: jobToEdit.status, 
        interview_date: formattedDate,
        notes: jobToEdit.notes || '' 
      });
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
    
    try {
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
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
        setGeneratedLetter(data.letter);
        toast.success("Lettera pronta! 🤖");
      }
    } finally { setAiLoading(false); }
  };

  const handleDelete = async (id) => {
    if(!confirm("Eliminare definitivamente?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    toast.success("Eliminata 🗑️");
    fetchJobs();
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Job Board</h1>
            <p className="text-slate-500 text-sm">Organizza il tuo percorso nel 2026</p>
          </div>
          <div className="relative w-full md:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
            <input 
              type="text" placeholder="Filtra per azienda o ruolo..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
        <Button 
          onClick={handleOpenCreate} 
          variant="contained"
          startIcon={<AddIcon />}
          className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-2xl shadow-xl shadow-indigo-500/20 normal-case font-bold"
        >
          Nuova Candidatura
        </Button>
      </div>

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-10 min-h-[650px]">
          {COLUMNS.map(col => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} {...provided.droppableProps}
                  className={`flex-1 min-w-[320px] p-5 rounded-3xl border-2 border-dashed transition-all duration-300 ${col.style} ${snapshot.isDraggingOver ? 'border-indigo-400 bg-indigo-50/50 scale-[1.02]' : 'border-transparent'}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-widest">{col.title}</h3>
                    <span className="bg-white dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {filteredJobs.filter(j => j.status === col.id).length}
                    </span>
                  </div>

                  {filteredJobs.filter(j => j.status === col.id).map((job, index) => (
                    <Draggable key={String(job.id)} draggableId={String(job.id)} index={index}>
                      {(p, s) => (
                        <div
                          ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                          className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-all ${s.isDragging ? 'shadow-2xl rotate-3 ring-2 ring-indigo-500' : 'hover:border-indigo-300'}`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 dark:text-white">{job.position}</h4>
                            <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedJobId(job.id); }}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </div>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3 flex items-center gap-1">
                            <WorkIcon sx={{ fontSize: 14 }} /> {job.company}
                          </p>

                          {job.interview_date && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg mb-3 w-fit">
                              <EventIcon sx={{ fontSize: 12 }} /> 
                              {new Date(job.interview_date).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              {job.job_link && (
                                <Tooltip title="Apri Annuncio">
                                  <IconButton size="small" href={job.job_link} target="_blank" color="primary">
                                    <LinkIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* TRIGGER AI COACH */}
                              <Tooltip title="AI Coach Match">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => { e.stopPropagation(); setSelectedJobForCoach(job); setCoachOpen(true); }} 
                                  sx={{ color: '#10b981' }}
                                >
                                  <PsychologyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="AI Letter">
                                <IconButton size="small" onClick={() => openLetterGenerator(job)} sx={{ color: '#8b5cf6' }}>
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
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* MODALE CREATE/EDIT */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle className="font-bold">{isEditMode ? "Modifica Candidatura" : "Nuova Opportunità"}</DialogTitle>
        <DialogContent>
          <TextField 
            margin="normal" label="Link Annuncio" fullWidth 
            value={formData.job_link} onChange={e => setFormData({...formData, job_link: e.target.value})}
            placeholder="Incolla URL di LinkedIn, Indeed..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Usa l'AI per compilare">
                    <IconButton onClick={handleMagicScrape} disabled={isScraping} color="secondary">
                      {isScraping ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField margin="normal" label="Azienda *" fullWidth value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField margin="normal" label="Ruolo *" fullWidth value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
            </Grid>
          </Grid>
          <div className="mt-4">
            <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">Data e Ora Colloquio</label>
            <input 
              type="datetime-local" value={formData.interview_date} 
              onChange={e => setFormData({...formData, interview_date: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all" 
            />
          </div>
          <TextField margin="normal" label="Note Strategiche" fullWidth multiline rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        </DialogContent>
        <DialogActions className="p-6">
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'slate.500' }}>Chiudi</Button>
          <Button onClick={handleSave} variant="contained" className="bg-indigo-600 rounded-xl px-6">Salva Candidatura</Button>
        </DialogActions>
      </Dialog>

      {/* MENU CONTEXT */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' } }}>
        <MenuItem onClick={handleOpenEdit}><EditIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} /> Modifica</MenuItem>
        <MenuItem onClick={() => { handleDelete(selectedJobId); setAnchorEl(null); }} sx={{ color: 'error.main' }}><DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Elimina</MenuItem>
      </Menu>

      {/* MODALE LETTERA AI */}
      <Dialog open={openLetterModal} onClose={() => setOpenLetterModal(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle className="flex items-center gap-2 font-black text-indigo-600">
          <AutoAwesomeIcon /> Personal AI Ghostwriter
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
            <ToggleButtonGroup value={letterTone} exclusive onChange={(e, v) => v && setLetterTone(v)} size="small" color="primary">
              <ToggleButton value="formal" className="normal-case">💼 Formale</ToggleButton>
              <ToggleButton value="modern" className="normal-case">🚀 Moderno</ToggleButton>
              <ToggleButton value="bold" className="normal-case">🦁 Audace</ToggleButton>
            </ToggleButtonGroup>
            <Button 
              variant="contained" color="secondary" onClick={handleGenerateAi} disabled={aiLoading}
              startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              className="bg-indigo-600"
            >
              {aiLoading ? "L'AI sta scrivendo..." : "Rigenera Lettera"}
            </Button>
          </div>
          <TextField 
            multiline rows={12} fullWidth value={generatedLetter} onChange={e => setGeneratedLetter(e.target.value)}
            className="bg-white dark:bg-slate-800 rounded-2xl"
            sx={{ '& .MuiInputBase-root': { fontFamily: 'serif', lineHeight: 1.8 } }}
          />
        </DialogContent>
        <DialogActions className="p-6">
          <Button onClick={() => setOpenLetterModal(false)}>Indietro</Button>
          <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(generatedLetter); toast.success("Copiato!"); }}>Copia Testo</Button>
        </DialogActions>
      </Dialog>

      {/* MODALE AI COACH */}
      <AICoachModal 
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        jobId={selectedJobForCoach?.id}
        jobTitle={selectedJobForCoach?.position}
        company={selectedJobForCoach?.company}
      />

    </div>
  );
}