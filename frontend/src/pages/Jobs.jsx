import { useEffect, useState } from 'react';
import { 
  Button, TextField, Card, CardContent, Chip, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select,
  Tooltip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';
import LinkIcon from '@mui/icons-material/Link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// DEFINIZIONE STILI COLONNE (Tailwind Classes)
const COLUMNS = [
  { id: 'wishlist', title: '📝 Da Inviare',  style: 'bg-blue-50 border-blue-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'applied',  title: '🚀 Inviato',     style: 'bg-amber-50 border-amber-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'interview', title: '🗣️ Colloquio',   style: 'bg-emerald-50 border-emerald-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'offer',    title: '🎉 Offerta!',    style: 'bg-violet-50 border-violet-100 dark:bg-slate-800/50 dark:border-slate-700' },
  { id: 'rejected', title: '❌ Rifiutato',   style: 'bg-red-50 border-red-100 dark:bg-slate-800/50 dark:border-slate-700' }
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  
  // Stati Modali & Menu
  const [openModal, setOpenModal] = useState(false);
  const [openLetterModal, setOpenLetterModal] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [formData, setFormData] = useState({ company: '', position: '', job_link: '', status: 'applied' });

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setJobs(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchJobs(); 
    const userData = localStorage.getItem('user');
    if(userData) setUser(JSON.parse(userData));
  }, []);

  // --- LOGICHE (Uguali a prima) ---
  const handleGenerateLetter = (job) => {
    const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    const userName = user ? `${user.first_name} ${user.last_name}` : "[Il Tuo Nome]";
    const letter = `Data: ${today}\n\nAlla cortese attenzione del Responsabile Assunzioni,\n${job.company}\n\nOggetto: Candidatura per la posizione di ${job.position}\n\nGentile Responsabile,\n\nCon la presente desidero sottoporre alla Vostra attenzione la mia candidatura per la posizione di ${job.position} presso ${job.company}.\n\nCordiali saluti,\n\n${userName}\n${user?.email || ""}`;
    setGeneratedLetter(letter);
    setOpenLetterModal(true);
  };
  const copyToClipboard = () => { navigator.clipboard.writeText(generatedLetter); alert("Copiato!"); };
  
  const handleCreate = async () => {
    if (!formData.company || !formData.position) return alert("Dati mancanti");
    const token = localStorage.getItem('token');
    const res = await fetch('/api/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData)
    });
    if (res.ok) { setOpenModal(false); setFormData({ company: '', position: '', job_link: '', status: 'applied' }); fetchJobs(); }
  };
  const handleDelete = async (id) => {
    if(!window.confirm("Eliminare?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchJobs();
  };
  const handleStatusChange = async (newStatus) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/${selectedJobId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus })
    });
    setAnchorEl(null); fetchJobs();
  };

  const renderCard = (job) => (
    <div key={job.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 mb-3 hover:shadow-md transition-shadow relative group">
      <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{job.position}</h3>
      <div className="flex items-center text-slate-500 dark:text-slate-300 text-sm mt-1 mb-2">
        <WorkIcon style={{ fontSize: 16, marginRight: 4 }} /> {job.company}
      </div>
      
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
             <button onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedJobId(job.id); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreVertIcon fontSize="small" />
             </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📋 Job Board</h1>
        <button onClick={() => setOpenModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all">
            <AddIcon fontSize="small" /> Nuova Candidatura
        </button>
      </div>

      {/* KANBAN COLUMNS */}
      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-8">
        {COLUMNS.map(col => (
          <div key={col.id} className={`flex-1 min-w-[280px] p-4 rounded-2xl border ${col.style}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">{col.title}</h3>
                <span className="bg-white/50 dark:bg-slate-700/50 px-2 py-0.5 rounded text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {jobs.filter(j => j.status === col.id).length}
                </span>
            </div>
            {jobs.filter(job => job.status === col.id).map(job => renderCard(job))}
            {jobs.filter(job => job.status === col.id).length === 0 && (
                <div className="text-center text-slate-400 text-sm italic py-4">Vuoto</div>
            )}
          </div>
        ))}
      </div>

      {/* MENU ACTIONS (Resta MUI per comodità) */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem disabled>Sposta in...</MenuItem>
        {COLUMNS.map(col => (<MenuItem key={col.id} onClick={() => handleStatusChange(col.id)}>{col.title}</MenuItem>))}
        <MenuItem sx={{ color: 'error.main', borderTop: '1px solid #eee' }} onClick={() => { handleDelete(selectedJobId); setAnchorEl(null); }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Elimina</MenuItem>
      </Menu>

      {/* MODALI (MUI + Tailwind Classes dentro se serve) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Aggiungi Candidatura</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Azienda *" fullWidth value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
          <TextField margin="dense" label="Posizione *" fullWidth value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          <TextField margin="dense" label="Link" fullWidth value={formData.job_link} onChange={e => setFormData({...formData, job_link: e.target.value})} />
          <FormControl fullWidth margin="dense"><InputLabel>Stato</InputLabel><Select value={formData.status} label="Stato" onChange={e => setFormData({...formData, status: e.target.value})}>{COLUMNS.map(c => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}</Select></FormControl>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenModal(false)}>Annulla</Button><Button onClick={handleCreate} variant="contained">Salva</Button></DialogActions>
      </Dialog>

      <Dialog open={openLetterModal} onClose={() => setOpenLetterModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AutoAwesomeIcon color="primary" /> Lettera Generata</DialogTitle>
        <DialogContent><TextField multiline rows={15} fullWidth value={generatedLetter} onChange={(e) => setGeneratedLetter(e.target.value)} sx={{ mt: 1 }} /></DialogContent>
        <DialogActions><Button onClick={() => setOpenLetterModal(false)}>Chiudi</Button><Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copyToClipboard}>Copia</Button></DialogActions>
      </Dialog>
    </div>
  );
}