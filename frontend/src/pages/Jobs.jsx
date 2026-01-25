import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  Menu, MenuItem, Tooltip, CircularProgress,
  ToggleButton, ToggleButtonGroup, InputAdornment, IconButton, Grid, Paper, Typography, Avatar, Fade 
} from '@mui/material';
import { 
  Add as AddIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, 
  Edit as EditIcon, Work as WorkIcon, Link as LinkIcon, 
  Event as EventIcon, AutoAwesome as AutoAwesomeIcon, 
  ContentCopy as ContentCopyIcon, Search as SearchIcon,
  AutoFixHigh as AutoFixHighIcon,
  Psychology as PsychologyIcon, ViewKanban
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import AICoachModal from '../components/AICoachModal'; 

// COLONNE: Aggiornate per supportare Light e Dark mode
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
  
  // Stati UI
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  // Stati AI
  const [coachOpen, setCoachOpen] = useState(false);
  const [selectedJobForCoach, setSelectedJobForCoach] = useState(null);
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
        body: JSON.stringify({ company: currentLetterJob.company, position: currentLetterJob.position, tone: letterTone, userName: `${user?.first_name} ${user?.last_name}` })
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
                                {/* Actions Overlay (visible on hover) */}
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
                                            <Tooltip title="Link Annuncio">
                                                <IconButton size="small" href={job.job_link} target="_blank" className="text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400"><LinkIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="AI Coach">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedJobForCoach(job); setCoachOpen(true); }} className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400">
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

      {/* MODALE CREATE/EDIT */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ className: 'glass-panel border border-slate-200 dark:border-white/10 bg-white dark:!bg-[#0f172a]', sx: { borderRadius: '24px' } }}>
        <DialogTitle className="font-black text-slate-900 dark:text-white text-xl border-b border-slate-200 dark:border-white/10 pb-4">
            {isEditMode ? "Modifica Candidatura" : "Nuova Opportunità"}
        </DialogTitle>
        <DialogContent className="pt-6">
          <TextField 
            margin="normal" label="Link Annuncio" fullWidth 
            value={formData.job_link} onChange={e => setFormData({...formData, job_link: e.target.value})}
            placeholder="Incolla URL..." className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Auto-fill con AI">
                    <IconButton onClick={handleMagicScrape} disabled={isScraping} className="text-cyan-500 dark:text-cyan-400">
                      {isScraping ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Azienda *" fullWidth value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ruolo *" fullWidth value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl" />
            </Grid>
          </Grid>
          <div className="mt-6 mb-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Data Colloquio</label>
            <input 
              type="datetime-local" value={formData.interview_date} 
              onChange={e => setFormData({...formData, interview_date: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:border-cyan-500 transition-all" 
            />
          </div>
          <TextField margin="normal" label="Note Strategiche" fullWidth multiline rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input-glass bg-slate-50 dark:bg-black/20 rounded-xl" />
        </DialogContent>
        <DialogActions className="p-6 border-t border-slate-200 dark:border-white/10">
          <Button onClick={() => setOpenModal(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Annulla</Button>
          <Button onClick={handleSave} variant="contained" className="btn-neon px-8 rounded-xl font-bold">Salva</Button>
        </DialogActions>
      </Dialog>

      {/* MENU CONTEXT */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white', sx: { borderRadius: '12px' } }}>
        <MenuItem onClick={handleOpenEdit} className="hover:bg-slate-100 dark:hover:bg-white/5"><EditIcon sx={{ mr: 1, fontSize: 18, color: '#22d3ee' }} /> Modifica</MenuItem>
        <MenuItem onClick={() => { handleDelete(selectedJobId); setAnchorEl(null); }} className="hover:bg-slate-100 dark:hover:bg-white/5 text-red-500 dark:text-red-400"><DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Elimina</MenuItem>
      </Menu>

      {/* MODALE AI LETTER */}
      <Dialog open={openLetterModal} onClose={() => setOpenLetterModal(false)} fullWidth maxWidth="md" PaperProps={{ className: 'glass-panel bg-white dark:!bg-[#0f172a] border border-slate-200 dark:border-white/10', sx: { borderRadius: '24px' } }}>
        <DialogTitle className="flex items-center gap-2 font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4">
          <AutoAwesomeIcon className="text-purple-500 dark:text-purple-400" /> Personal AI Ghostwriter
        </DialogTitle>
        <DialogContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
            <ToggleButtonGroup value={letterTone} exclusive onChange={(e, v) => v && setLetterTone(v)} size="small" className="bg-slate-200 dark:bg-black/20 rounded-xl">
              <ToggleButton value="formal" className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 px-4">👔 Formale</ToggleButton>
              <ToggleButton value="modern" className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 px-4">🚀 Moderno</ToggleButton>
              <ToggleButton value="bold" className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 px-4">🦁 Audace</ToggleButton>
            </ToggleButtonGroup>
            <Button 
              variant="contained" onClick={handleGenerateAi} disabled={aiLoading}
              startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold px-6 text-white"
            >
              {aiLoading ? "Scrivendo..." : "Genera Lettera"}
            </Button>
          </div>
          <TextField 
            multiline rows={12} fullWidth value={generatedLetter} onChange={e => setGeneratedLetter(e.target.value)}
            className="input-glass bg-slate-50 dark:bg-black/20 rounded-2xl" placeholder="L'AI scriverà qui la tua lettera..."
            sx={{ '& .MuiInputBase-root': { fontFamily: 'serif', lineHeight: 1.8, fontSize: '1.1rem' } }}
          />
        </DialogContent>
        <DialogActions className="p-6 border-t border-slate-200 dark:border-white/10">
          <Button onClick={() => setOpenLetterModal(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Chiudi</Button>
          <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(generatedLetter); toast.success("Copiato!"); }} className="btn-neon rounded-xl">Copia</Button>
        </DialogActions>
      </Dialog>

      <AICoachModal 
        open={coachOpen} onClose={() => setCoachOpen(false)}
        jobId={selectedJobForCoach?.id} jobTitle={selectedJobForCoach?.position} company={selectedJobForCoach?.company}
      />
    </div>
  );
}