import { useEffect, useState } from 'react';
import { 
  TextField, Button, Box, CircularProgress, 
  Avatar, IconButton, Typography,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  List, ListItem, ListItemIcon, ListItemText, Fade
} from '@mui/material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from '../components/CVDocument';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import PsychologyIcon from '@mui/icons-material/Psychology';
import StarsIcon from '@mui/icons-material/Stars';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Rimane per l'immagine profilo
import toast from 'react-hot-toast';

const DEGREES = ["Diploma di Maturità", "Laurea Triennale", "Laurea Magistrale", "Master", "Dottorato", "Altro"];
const SOCIAL_PLATFORMS = ["LinkedIn", "GitHub", "Portfolio", "Sito Web", "Behance", "Twitter / X", "Instagram", "Altro"];

const MENU_ITEMS = [
    { id: 0, label: "Info", icon: <PersonIcon fontSize="small" /> },
    { id: 1, label: "Skills", icon: <PsychologyIcon fontSize="small" /> },
    { id: 2, label: "Lavoro", icon: <WorkIcon fontSize="small" /> },
    { id: 3, label: "Studi", icon: <SchoolIcon fontSize="small" /> },
    { id: 4, label: "Cert", icon: <StarsIcon fontSize="small" /> },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgKey, setImgKey] = useState(Date.now());

  const [formData, setFormData] = useState({ 
    first_name: '', last_name: '', email: '', phone: '', address: '',
    socials: [],
    personal_description: '',
    hard_skills: '', soft_skills: '',
    experiences: [], 
    education: [], 
    certifications: [],
    cv_filename: '' 
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        syncFormData(data);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const syncFormData = (data) => {
    setFormData({
      first_name: data.first_name || '', last_name: data.last_name || '',
      email: data.email || '', phone: data.phone || '', address: data.address || '',
      socials: Array.isArray(data.socials) ? data.socials : [],
      personal_description: data.personal_description || '',
      hard_skills: data.hard_skills || '', soft_skills: data.soft_skills || '',
      experiences: Array.isArray(data.experiences) ? data.experiences : [],
      education: Array.isArray(data.education) ? data.education : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      cv_filename: data.cv_filename || ''
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleArrayChange = (index, field, value, listName) => {
      const newList = [...formData[listName]];
      newList[index][field] = value;
      if (listName === 'experiences' && field === 'current' && value === true) {
          newList[index]['dateEnd'] = ''; 
      }
      setFormData({ ...formData, [listName]: newList });
  };
  
  const addItem = (listName, template) => {
      setFormData({ ...formData, [listName]: [...formData[listName], template] });
  };
  
  const removeItem = (index, listName) => {
      const newList = formData[listName].filter((_, i) => i !== index);
      setFormData({ ...formData, [listName]: newList });
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) dataToSend.append(key, JSON.stringify(formData[key]));
        else dataToSend.append(key, formData[key]);
    });
    if (selectedFile) dataToSend.append('profileImage', selectedFile);

    const savePromise = fetch('/api/users/profile', {
      method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: dataToSend
    });

    await toast.promise(savePromise, { loading: 'Salvataggio...', success: 'Profilo aggiornato! ✅', error: 'Errore nel salvataggio ❌' });
    const res = await savePromise;
    if(res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setImgKey(Date.now());
        setPreviewUrl(null); setSelectedFile(null);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><CircularProgress /></div>;
  const avatarSrc = previewUrl ? previewUrl : (user?.has_image ? `/api/users/profile/image?t=${imgKey}` : null);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 py-4 pb-24 md:pb-12 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER CARD */}
      <div className="card-3d p-6 md:p-8 mb-6 rounded-3xl md:rounded-[2rem] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden w-full bg-white dark:bg-transparent shadow-xl dark:shadow-none border border-slate-200 dark:border-white/10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
        
        <div className="relative group z-10 shrink-0">
            <Avatar src={avatarSrc} sx={{ width: {xs: 90, md: 130}, height: {xs: 90, md: 130}, fontSize: 40, bgcolor: '#4f46e5', border: '4px solid rgba(255,255,255,0.2)' }}>
                {user?.first_name?.[0]}
            </Avatar>
            <label htmlFor="upload-photo" className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                <CloudUploadIcon />
            </label>
            <input type="file" id="upload-photo" className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        
        <div className="flex-1 text-center md:text-left z-10 w-full">
            <Typography variant="h4" className="font-black text-slate-900 dark:text-white mb-1 text-glow truncate">
                {user?.first_name} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">{user?.last_name}</span>
            </Typography>
            <Typography variant="body1" className="text-slate-500 dark:text-slate-400 font-medium mb-4 text-sm md:text-base">
                Gestione Profilo & CV
            </Typography>
            
            <div className="block md:hidden w-full">
                <PDFDownloadLink document={<MyDocument data={formData} image={avatarSrc} />} fileName={`CV_${user?.first_name}_${user?.last_name}.pdf`}>
                {({ loading }) => (
                    <Button variant="contained" className="btn-3d-primary w-full py-3 rounded-xl font-bold" disabled={loading} startIcon={<PictureAsPdfIcon />}>
                        {loading ? '...' : 'Scarica PDF'}
                    </Button>
                )}
                </PDFDownloadLink>
            </div>
        </div>
        
        <div className="hidden md:block bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-lg z-10">
            <PDFDownloadLink document={<MyDocument data={formData} image={avatarSrc} />} fileName={`CV_${user?.first_name}_${user?.last_name}.pdf`}>
              {({ loading }) => (
                <Button variant="contained" className="btn-3d-primary px-6 py-3 rounded-xl font-bold" disabled={loading} startIcon={<PictureAsPdfIcon />}>
                    {loading ? 'Generazione...' : 'Scarica CV PDF'}
                </Button>
              )}
            </PDFDownloadLink>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full">
        
        {/* NAVIGATION */}
        <div className="md:w-64 shrink-0">
            <div className="md:sticky md:top-24 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex md:block gap-2">
                <div className="glass-panel p-2 md:p-4 rounded-xl md:rounded-2xl flex md:flex-col gap-2 min-w-max md:min-w-0 w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    {MENU_ITEMS.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-all rounded-xl md:min-w-0 justify-center md:justify-start flex-1
                            ${activeTab === item.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <span>{item.icon}</span>
                            <span className="text-xs md:text-sm">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 w-full min-w-0">
            <div className="glass-panel p-4 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] min-h-[500px] relative w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                
                <Fade in={true} key={activeTab} timeout={500}>
                    <div className="w-full">
                        {activeTab === 0 && (
                            <div className="space-y-6 w-full">
                                <Typography variant="h5" className="font-black text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4 mb-4">Dati Anagrafici</Typography>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <TextField label="Nome" fullWidth variant="outlined" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="input-glass" />
                                    <TextField label="Cognome" fullWidth variant="outlined" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="input-glass" />
                                    <TextField label="Email" fullWidth variant="filled" disabled value={formData.email} className="input-glass" />
                                    <TextField label="Telefono" fullWidth variant="outlined" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-glass" />
                                    <TextField label="Indirizzo" fullWidth className="md:col-span-2 input-glass" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                                
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4 mb-4 mt-8">
                                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">Social</Typography>
                                    <Button startIcon={<AddCircleIcon />} size="small" className="text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-400/30 hover:bg-cyan-50 dark:hover:bg-cyan-400/10 rounded-lg px-3" onClick={() => addItem('socials', {platform: 'LinkedIn', url: ''})}>Aggiungi</Button>
                                </div>
                                
                                {formData.socials.map((soc, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-3 mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 relative w-full">
                                            <FormControl size="small" className="input-glass w-full md:w-48">
                                                <InputLabel className="text-slate-500 dark:text-slate-400">Piattaforma</InputLabel>
                                                <Select value={soc.platform} label="Piattaforma" onChange={e => handleArrayChange(index, 'platform', e.target.value, 'socials')} className="text-slate-900 dark:text-white">
                                                    {SOCIAL_PLATFORMS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                            <TextField label="URL Profilo" size="small" fullWidth value={soc.url} onChange={e => handleArrayChange(index, 'url', e.target.value, 'socials')} className="input-glass" />
                                            <IconButton size="small" className="text-red-500 dark:text-red-400 md:absolute md:right-2 md:top-3 self-end md:self-auto" onClick={() => removeItem(index, 'socials')}><DeleteIcon fontSize="small" /></IconButton>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 1 && (
                             <div className="space-y-6 w-full">
                                <Typography variant="h5" className="font-black text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4 mb-4">Profilo & Skills</Typography>
                                <TextField multiline rows={6} fullWidth placeholder="Riassumi la tua carriera..." value={formData.personal_description} onChange={e => setFormData({...formData, personal_description: e.target.value})} className="input-glass" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
                                    <div className="p-4 md:p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 w-full">
                                        <Typography variant="subtitle1" className="font-bold text-indigo-600 dark:text-indigo-300 mb-3">🛠️ Hard Skills</Typography>
                                        <TextField multiline rows={4} fullWidth variant="standard" placeholder="React, Node.js, AWS..." value={formData.hard_skills} onChange={e => setFormData({...formData, hard_skills: e.target.value})} className="input-glass" InputProps={{ disableUnderline: true }} />
                                    </div>
                                    <div className="p-4 md:p-5 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl border border-cyan-100 dark:border-cyan-500/30 w-full">
                                        <Typography variant="subtitle1" className="font-bold text-cyan-600 dark:text-cyan-300 mb-3">🤝 Soft Skills</Typography>
                                        <TextField multiline rows={4} fullWidth variant="standard" placeholder="Problem Solving..." value={formData.soft_skills} onChange={e => setFormData({...formData, soft_skills: e.target.value})} className="input-glass" InputProps={{ disableUnderline: true }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 2 && (
                            <div className="space-y-6 w-full">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
                                    <Typography variant="h5" className="font-black text-slate-800 dark:text-white">Esperienza</Typography>
                                    <Button startIcon={<AddCircleIcon />} className="text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-400/30 hover:bg-cyan-50 dark:hover:bg-cyan-400/10 px-3 rounded-lg" onClick={() => addItem('experiences', {role:'', company:'', dateStart:'', dateEnd:'', current: false, description:''})}>Aggiungi</Button>
                                </div>
                                {formData.experiences.map((exp, index) => (
                                    <div key={index} className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 md:p-5 rounded-2xl mb-4 relative hover:bg-slate-100 dark:hover:bg-white/10 transition-colors w-full">
                                            <IconButton size="small" className="absolute top-2 right-2 text-slate-500 hover:text-red-500" onClick={() => removeItem(index, 'experiences')}><DeleteIcon fontSize="small" /></IconButton>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <TextField label="Ruolo" size="small" fullWidth value={exp.role} onChange={e => handleArrayChange(index, 'role', e.target.value, 'experiences')} className="input-glass" />
                                                <TextField label="Azienda" size="small" fullWidth value={exp.company} onChange={e => handleArrayChange(index, 'company', e.target.value, 'experiences')} className="input-glass" />
                                                <div className="grid grid-cols-2 gap-2 md:col-span-2">
                                                    <TextField type="date" label="Inizio" size="small" InputLabelProps={{shrink: true}} fullWidth value={exp.dateStart} onChange={e => handleArrayChange(index, 'dateStart', e.target.value, 'experiences')} className="input-glass" />
                                                    <TextField type="date" label="Fine" size="small" InputLabelProps={{shrink: true}} fullWidth value={exp.dateEnd} onChange={e => handleArrayChange(index, 'dateEnd', e.target.value, 'experiences')} disabled={exp.current} className="input-glass" />
                                                </div>
                                                <FormControlLabel control={<Checkbox checked={exp.current || false} onChange={e => handleArrayChange(index, 'current', e.target.checked, 'experiences')} sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#22d3ee' } }} />} label={<Typography variant="caption" className="font-bold text-slate-500 dark:text-slate-300">Lavoro attuale</Typography>} className="md:col-span-2" />
                                                <TextField label="Descrizione" multiline rows={3} fullWidth size="small" value={exp.description} onChange={e => handleArrayChange(index, 'description', e.target.value, 'experiences')} className="input-glass md:col-span-2" />
                                            </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 3 && (
                            <div className="space-y-6 w-full">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
                                    <Typography variant="h5" className="font-black text-slate-800 dark:text-white">Istruzione</Typography>
                                    <Button startIcon={<AddCircleIcon />} className="text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-400/30 hover:bg-cyan-50 dark:hover:bg-cyan-400/10 px-3 rounded-lg" onClick={() => addItem('education', {degree:'', school:'', dateStart:'', dateEnd:'', city:'', description:''})}>Aggiungi</Button>
                                </div>
                                {formData.education.map((edu, index) => (
                                    <div key={index} className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 md:p-5 rounded-2xl mb-4 relative hover:bg-slate-100 dark:hover:bg-white/10 transition-colors w-full">
                                            <IconButton size="small" className="absolute top-2 right-2 text-slate-500 hover:text-red-500" onClick={() => removeItem(index, 'education')}><DeleteIcon fontSize="small" /></IconButton>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <FormControl fullWidth size="small" className="input-glass">
                                                    <InputLabel className="text-slate-500 dark:text-slate-400">Titolo</InputLabel>
                                                    <Select value={DEGREES.includes(edu.degree) ? edu.degree : ''} label="Titolo" onChange={e => handleArrayChange(index, 'degree', e.target.value, 'education')} className="text-slate-900 dark:text-white">
                                                        {DEGREES.map((deg) => <MenuItem key={deg} value={deg}>{deg}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                                <TextField label="Istituto" size="small" fullWidth value={edu.school} onChange={e => handleArrayChange(index, 'school', e.target.value, 'education')} className="input-glass" />
                                                <TextField label="Città" size="small" fullWidth value={edu.city} onChange={e => handleArrayChange(index, 'city', e.target.value, 'education')} className="input-glass" />
                                                <div className="grid grid-cols-2 gap-2 md:col-span-2">
                                                    <TextField type="date" label="Inizio" size="small" InputLabelProps={{shrink: true}} fullWidth value={edu.dateStart} onChange={e => handleArrayChange(index, 'dateStart', e.target.value, 'education')} className="input-glass" />
                                                    <TextField type="date" label="Fine" size="small" InputLabelProps={{shrink: true}} fullWidth value={edu.dateEnd} onChange={e => handleArrayChange(index, 'dateEnd', e.target.value, 'education')} className="input-glass" />
                                                </div>
                                                <TextField label="Tesi / Dettagli" multiline rows={2} fullWidth size="small" value={edu.description} onChange={e => handleArrayChange(index, 'description', e.target.value, 'education')} className="input-glass md:col-span-2" />
                                            </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 4 && (
                            <div className="space-y-6 w-full">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
                                    <Typography variant="h5" className="font-black text-slate-800 dark:text-white">Certificazioni</Typography>
                                    <Button startIcon={<AddCircleIcon />} className="text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-400/30 hover:bg-cyan-50 dark:hover:bg-cyan-400/10 px-3 rounded-lg" onClick={() => addItem('certifications', {name:'', year:''})}>Aggiungi</Button>
                                </div>
                                {formData.certifications.map((cert, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-3 mb-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 relative w-full">
                                            <TextField label="Nome Certificazione" fullWidth size="small" value={cert.name} onChange={e => handleArrayChange(index, 'name', e.target.value, 'certifications')} className="input-glass" />
                                            <TextField label="Anno" size="small" placeholder="YYYY" value={cert.year} onChange={e => handleArrayChange(index, 'year', e.target.value, 'certifications')} className="input-glass w-full md:w-32" />
                                            <IconButton size="small" className="text-red-500 dark:text-red-400 md:absolute md:right-2 md:top-3 self-end" onClick={() => removeItem(index, 'certifications')}><DeleteIcon fontSize="small" /></IconButton>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Fade>

                <div className="mt-10 flex justify-end pt-6 border-t border-slate-200 dark:border-white/10 sticky bottom-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-4 -mx-4 md:-mx-10 -mb-4 md:-mb-10 rounded-b-[1.5rem] md:rounded-b-[2.5rem] z-20">
                    <Button variant="contained" size="large" onClick={handleSave} className="btn-neon px-8 py-3 rounded-xl text-lg font-bold shadow-xl w-full md:w-auto">Salva Modifiche</Button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}