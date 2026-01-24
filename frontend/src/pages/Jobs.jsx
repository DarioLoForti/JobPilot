import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, MenuItem, Tooltip, Menu
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WorkIcon from '@mui/icons-material/Work';
import LinkIcon from '@mui/icons-material/Link';
import EventIcon from '@mui/icons-material/Event';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';

// Stili Colonne
const COLUMNS = [
  { id: 'wishlist', title: '📝 Da Inviare',  style: 'bg-blue-50 border-blue-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'applied',  title: '🚀 Inviato',     style: 'bg-amber-50 border-amber-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'interview', title: '🗣️ Colloquio',   style: 'bg-emerald-50 border-emerald-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'offer',    title: '🎉 Offerta!',    style: 'bg-violet-50 border-violet-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'rejected', title: '❌ Rifiutato',   style: 'bg-red-50 border-red-100 dark:bg-slate-800/50 dark:border-slate-700' }
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  
  // Stati Modali & Menu
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [openLetterModal, setOpenLetterModal] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // Aggiunto campo 'notes' allo stato iniziale
  const [formData, setFormData] = useState({ 
    company: '', position: '', job_link: '', status: 'applied', interview_date: '', notes: '' 
  });

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchJobs(); 
    const userData = localStorage.getItem('user');
    if(userData) setUser(JSON.parse(userData));
  }, []);

  // Filtro Search
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const results = jobs.filter(job => 
      job.company.toLowerCase().includes(lowerSearch) || 
      job.position.toLowerCase().includes(lowerSearch)
    );
    setFilteredJobs(results);
  }, [searchTerm, jobs]);

  // --- LOGICA DRAG & DROP ---
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    
    // Aggiornamento ottimistico
    const updatedJobs = jobs.map(job => 
        job.id === draggableId ? { ...job, status: newStatus } : job
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
        console.error("Errore salvataggio drag & drop", error);
        toast.error("Errore spostamento card ❌");
        fetchJobs(); 
    }
  };

  // --- ACTIONS ---
  const handleOpenCreate = () => {
    // Reset form incluso notes
    setFormData({ company: '', position: '', job_link: '', status: 'applied', interview_date: '', notes: '' });
    setIsEditMode(false);
    setOpenModal(true);
  };

  const handleOpenEdit = () => {
    const jobToEdit = jobs.find(j => j.id === selectedJobId);
    if (jobToEdit) {
      let formattedDate = '';
      if (jobToEdit.interview_date) {
        formattedDate = new Date(jobToEdit.interview_date).toISOString().slice(0, 16);
      }
      // Popolamento form incluso notes
      setFormData({
        company: jobToEdit.company, 
        position: jobToEdit.position, 
        job_link: jobToEdit.job_link || '', 
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
    if (!formData.company || !formData.position) return toast.error("Compila Azienda e Posizione! ⚠️");

    const token = localStorage.getItem('token');
    const url = isEditMode ? `/api/jobs/${currentJobId}` : '/api/jobs';
    const method = isEditMode ? 'PUT' : 'POST';

    const promise = fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });

    try {
        await toast.promise(promise, {
          loading: 'Salvataggio in corso...',
          success: isEditMode ? 'Candidatura aggiornata! 🚀' : 'Candidatura creata! 🎉',
          error: 'Errore durante il salvataggio ❌',
        });

        const res = await promise;
        if (res.ok) { 
           setOpenModal(false); 
           fetchJobs(); 
        }
    } catch (e) { console.error(e); }
  };

  const handleGenerateLetter = (job) => {
    const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    const userName = user ? `${user.first_name} ${user.last_name}` : "[Il Tuo Nome]";
    const letter = `Data: ${today}\n\nAlla cortese attenzione del Responsabile Assunzioni,\n${job.company}\n\nOggetto: Candidatura per la posizione di ${job.position}\n\nGentile Responsabile,\n\nCon la presente desidero sottoporre alla Vostra attenzione la mia candidatura per la posizione di ${job.position} presso ${job.company}.\n\nCordiali saluti,\n\n${userName}\n${user?.email || ""}`;
    setGeneratedLetter(letter);
    setOpenLetterModal(true);
  };
  
  const copyToClipboard = () => { 
      navigator.clipboard.writeText(generatedLetter); 
      toast.success("Copiato negli appunti! 📋");
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Eliminare questa candidatura?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    toast.success("Candidatura eliminata 🗑️");
    fetchJobs();
  };
  
  const handleStatusChange = async (newStatus) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${selectedJobId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus })
    });
    setAnchorEl(null); fetchJobs();
  };

  // --- RENDER CARD ---
  const renderCard = (job, index) => {
    const hasInterview = job.interview_date;
    const interviewDate = hasInterview ? new Date(job.interview_date).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) : null;

    return (
      <Draggable key={job.id} draggableId={job.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{ ...provided.draggableProps.style }}
            className={`bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 mb-3 relative group transition-all ${snapshot.isDragging ? 'shadow-2xl rotate-2 ring-2 ring-blue-500 z-50' : 'hover:shadow-md'}`}
          >
            <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{job.position}</h3>
            <div className="flex items-center text-slate-500 dark:text-slate-300 text-sm mt-1 mb-2">
              <WorkIcon style={{ fontSize: 16, marginRight: 4 }} /> {job.company}
            </div>
            
            {hasInterview && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md mb-2 w-fit">
                    <EventIcon style={{ fontSize: 14 }} /> {interviewDate}
                </div>
            )}

            {/* Mostriamo un'icona se ci sono note (opzionale, per UI feedback) */}
            {job.notes && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 italic truncate">
                    📝 {job.notes}
                </div>
            )}

            {job.job_link && (
              <a href={job.job_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center mb-3">
                <LinkIcon style={{ fontSize: 14, marginRight: 2 }} /> Vedi Annuncio
              </a>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-600">
              <span className="text-xs text-slate-400 border border-slate-200 dark:border-slate-500 px-2 py-0.5 rounded-full">
                  {new Date(job.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                   <Tooltip title="AI Cover Letter">
                      <button onClick={() => handleGenerateLetter(job)} className="p-1 text-slate-400 hover:text-purple-500 transition-colors">
                          <AutoAwesomeIcon fontSize="small" />
                      </button>
                   </Tooltip>
                   <button 
                      onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedJobId(job.id); }} 
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      onMouseDown={(e) => e.stopPropagation()} 
                   >
                      <MoreVertIcon fontSize="small" />
                   </button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      
      {/* HEADER + SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white whitespace-nowrap">📋 Job Board</h1>
            <span className="hidden md:inline-block h-8 w-px bg-slate-300 dark:bg-slate-700"></span>
            
            <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <SearchIcon fontSize="small" />
                </div>
                <input 
                    type="text" placeholder="Cerca azienda..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>
        </div>

        <button onClick={handleOpenCreate} className="w-full md:w-auto flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all font-medium">
            <AddIcon fontSize="small" /> Nuova Candidatura
        </button>
      </div>

      {/* DRAG AND DROP CONTEXT */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-8 min-h-[500px]">
            {COLUMNS.map(col => (
            <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-w-[280px] p-4 rounded-2xl border transition-colors duration-200 ${col.style} ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 bg-blue-50/80 dark:bg-slate-800/80' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">{col.title}</h3>
                            <span className="bg-white/50 dark:bg-slate-700/50 px-2 py-0.5 rounded text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {filteredJobs.filter(j => j.status === col.id).length}
                            </span>
                        </div>
                        
                        {filteredJobs
                            .filter(job => job.status === col.id)
                            .map((job, index) => renderCard(job, index))}
                        
                        {provided.placeholder}
                        
                        {filteredJobs.filter(job => job.status === col.id).length === 0 && (
                            <div className="text-center text-slate-400 dark:text-slate-500 text-sm italic py-8">
                            {searchTerm ? "Nessun risultato" : "Trascina qui..."}
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
            ))}
        </div>
      </DragDropContext>

      {/* MENU CONTEXT */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleOpenEdit} sx={{ fontSize: '0.9rem' }}><EditIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} /> Modifica</MenuItem>
        <div className="my-1 border-t border-slate-100"></div>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { handleDelete(selectedJobId); setAnchorEl(null); }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Elimina</MenuItem>
      </Menu>

      {/* MODALE CREATE/EDIT */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? "Modifica Candidatura" : "Aggiungi Candidatura"}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Azienda *" fullWidth value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
          <TextField margin="dense" label="Posizione *" fullWidth value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          <TextField margin="dense" label="Link Annuncio" fullWidth value={formData.job_link} onChange={e => setFormData({...formData, job_link: e.target.value})} />
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Stato</InputLabel>
            <Select value={formData.status} label="Stato" onChange={e => setFormData({...formData, status: e.target.value})}>
                {COLUMNS.map(c => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
            </Select>
          </FormControl>
          
          <div className="mt-4">
             <label className="text-xs text-slate-500 block mb-1">Data Colloquio (Opzionale)</label>
             <input type="datetime-local" value={formData.interview_date} onChange={e => setFormData({...formData, interview_date: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded p-3 bg-transparent text-slate-700 dark:text-white focus:outline-none focus:border-blue-500" />
          </div>

          {/* NUOVO CAMPO NOTE */}
          <TextField
             margin="dense"
             label="Note Personali"
             fullWidth
             multiline
             rows={3}
             placeholder="Es: Stipendio discusso, nome recruiter, dettagli tecnici..."
             value={formData.notes}
             onChange={e => setFormData({...formData, notes: e.target.value})}
             sx={{ mt: 2 }}
          />

        </DialogContent>
        <DialogActions><Button onClick={() => setOpenModal(false)}>Annulla</Button><Button onClick={handleSave} variant="contained">{isEditMode ? "Aggiorna" : "Salva"}</Button></DialogActions>
      </Dialog>

      {/* MODALE LETTERA */}
      <Dialog open={openLetterModal} onClose={() => setOpenLetterModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AutoAwesomeIcon color="primary" /> Lettera Generata</DialogTitle>
        <DialogContent><TextField multiline rows={15} fullWidth value={generatedLetter} onChange={(e) => setGeneratedLetter(e.target.value)} sx={{ mt: 1 }} /></DialogContent>
        <DialogActions><Button onClick={() => setOpenLetterModal(false)}>Chiudi</Button><Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copyToClipboard}>Copia</Button></DialogActions>
      </Dialog>
    </div>
  );
}