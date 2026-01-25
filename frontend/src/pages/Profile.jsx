import { useEffect, useState } from 'react';
import { 
  TextField, Button, Box, CircularProgress, 
  Avatar, IconButton, Divider, Grid, Paper, Typography,
  FormControl, InputLabel, Select, MenuItem, Card, CardContent, Checkbox, FormControlLabel,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from '../components/CVDocument';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import PsychologyIcon from '@mui/icons-material/Psychology';
import StarsIcon from '@mui/icons-material/Stars';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import toast from 'react-hot-toast';

const DEGREES = ["Diploma di Maturità", "Laurea Triennale", "Laurea Magistrale", "Master", "Dottorato", "Altro"];
const SOCIAL_PLATFORMS = ["LinkedIn", "GitHub", "Portfolio", "Sito Web", "Behance", "Twitter / X", "Instagram", "Altro"];

const MENU_ITEMS = [
    { id: 0, label: "Info Personali & Social", icon: <PersonIcon /> },
    { id: 1, label: "Descrizione & Skills", icon: <PsychologyIcon /> },
    { id: 2, label: "Esperienza Lavorativa", icon: <WorkIcon /> },
    { id: 3, label: "Istruzione e Formazione", icon: <SchoolIcon /> },
    { id: 4, label: "Altre Competenze", icon: <StarsIcon /> },
    { id: 5, label: "Analisi AI & Estrazione", icon: <AutoFixHighIcon /> }
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgKey, setImgKey] = useState(Date.now());

  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

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

  const handleCvUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') return toast.error("Carica solo file PDF");
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('cv', file);
      
      const uploadRequest = fetch('/api/ai/upload-cv', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: data });
      
      await toast.promise(uploadRequest, { 
        loading: 'Caricamento CV...', 
        success: 'File caricato con successo!', 
        error: 'Errore durante l\'upload' 
      });

      const res = await uploadRequest;
      if (res.ok) {
        const result = await res.json();
        setFormData(prev => ({ ...prev, cv_filename: result.filename }));
      }
  };

  const handleAnalyze = async () => {
      setAnalyzing(true);
      const token = localStorage.getItem('token');
      try {
          const res = await fetch('/api/ai/analyze-cv', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
              const data = await res.json();
              setAnalysisResult(data);
              toast.success("Analisi AI completata!");
          } else {
              const err = await res.json();
              toast.error(err.error || "Errore durante l'analisi");
          }
      } catch (e) { toast.error("Errore di connessione al server"); }
      finally { setAnalyzing(false); }
  };

  // 🪄 NUOVA FUNZIONE: Estrazione Dati Automatica dal CV
  const handleExtractData = async () => {
      setExtracting(true);
      const token = localStorage.getItem('token');
      try {
          const res = await fetch('/api/ai/extract-profile', { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          
          if (res.ok) {
              const result = await res.json();
              setUser(result.user);
              syncFormData(result.user); // Popola automaticamente tutti i campi del form
              toast.success("Magia! Profilo compilato dai dati del CV ✨");
              setActiveTab(0); // Torna alla prima tab per vedere i risultati
          } else {
              const err = await res.json();
              toast.error(err.error || "Impossibile estrarre i dati");
          }
      } catch (e) {
          toast.error("Errore durante l'estrazione intelligente");
      } finally {
          setExtracting(false);
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><CircularProgress /></div>;
  const avatarSrc = previewUrl ? previewUrl : (user?.has_image ? `/api/users/profile/image?t=${imgKey}` : null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER CARD */}
      <Paper elevation={0} className="p-6 mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="relative group">
            <Avatar src={avatarSrc} sx={{ width: 110, height: 110, fontSize: 45, bgcolor: '#4f46e5', border: '4px solid white', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)' }}>
                {user?.first_name?.[0]}
            </Avatar>
            <label htmlFor="upload-photo" className="absolute inset-0 flex items-center justify-center bg-indigo-900/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <CloudUploadIcon />
            </label>
            <input type="file" id="upload-photo" className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        <div className="flex-1 text-center md:text-left">
            <Typography variant="h4" fontWeight="800" className="text-slate-900 dark:text-white">
                {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="body1" className="text-slate-500 dark:text-slate-400 font-medium">
                Gestione Profilo Professionale & Ottimizzazione CV
            </Typography>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <PDFDownloadLink document={<MyDocument data={formData} image={avatarSrc} />} fileName={`CV_${user?.first_name}_${user?.last_name}.pdf`}>
              {({ loading }) => (<Button variant="contained" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading} startIcon={<PictureAsPdfIcon />}>
                {loading ? 'Generazione...' : 'Scarica CV PDF'}
              </Button>)}
            </PDFDownloadLink>
        </div>
      </Paper>

      <Grid container spacing={4}>
        {/* SIDEBAR NAVIGATION */}
        <Grid item xs={12} md={3}>
            <Paper elevation={0} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                {MENU_ITEMS.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-l-4
                        ${activeTab === item.id 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold' 
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <span className={activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                            {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                    </div>
                ))}
            </Paper>
        </Grid>

        {/* CONTENT AREA */}
        <Grid item xs={12} md={9}>
            <Paper elevation={0} className="p-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm min-h-[600px]">
                
                {activeTab === 0 && (
                    <div className="animate-fade-in space-y-6">
                        <Typography variant="h6" className="text-indigo-700 dark:text-indigo-400 font-extrabold border-b border-slate-100 dark:border-slate-700 pb-3 mb-6">Dati Anagrafici</Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <TextField label="Nome" fullWidth variant="outlined" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                            <TextField label="Cognome" fullWidth variant="outlined" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                            <TextField label="Email" fullWidth variant="filled" disabled value={formData.email} />
                            <TextField label="Telefono" fullWidth variant="outlined" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            <TextField label="Indirizzo Completo" fullWidth className="md:col-span-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-6 mt-10">
                            <Typography variant="h6" className="text-indigo-700 dark:text-indigo-400 font-extrabold">Link & Social Presence</Typography>
                            <Button startIcon={<AddCircleIcon />} size="small" variant="outlined" className="text-indigo-600 border-indigo-200" onClick={() => addItem('socials', {platform: 'LinkedIn', url: ''})}>Aggiungi Link</Button>
                        </div>
                        
                        {formData.socials.map((soc, index) => (
                            <div key={index} className="flex gap-3 mb-4 items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                <FormControl size="small" sx={{ width: 160 }}>
                                    <InputLabel>Piattaforma</InputLabel>
                                    <Select value={soc.platform} label="Piattaforma" onChange={e => handleArrayChange(index, 'platform', e.target.value, 'socials')}>
                                        {SOCIAL_PLATFORMS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField label="Indirizzo URL" size="small" fullWidth placeholder="https://..." value={soc.url} onChange={e => handleArrayChange(index, 'url', e.target.value, 'socials')} />
                                <IconButton color="error" onClick={() => removeItem(index, 'socials')}><DeleteIcon fontSize="small" /></IconButton>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 1 && (
                     <div className="animate-fade-in space-y-6">
                        <Typography variant="h6" className="text-indigo-700 dark:text-indigo-400 font-extrabold border-b border-slate-100 dark:border-slate-700 pb-3 mb-6">Profilo Professionale</Typography>
                        <TextField multiline rows={6} fullWidth placeholder="Riassumi la tua carriera e i tuoi obiettivi..." value={formData.personal_description} onChange={e => setFormData({...formData, personal_description: e.target.value})} className="bg-slate-50/50 dark:bg-slate-900/20" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <Box className="p-5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                <Typography variant="subtitle2" className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">🛠️ Hard Skills</Typography>
                                <TextField multiline rows={4} fullWidth variant="standard" placeholder="React, Node.js, AWS, Project Management..." value={formData.hard_skills} onChange={e => setFormData({...formData, hard_skills: e.target.value})} />
                            </Box>
                            <Box className="p-5 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                <Typography variant="subtitle2" className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">🤝 Soft Skills</Typography>
                                <TextField multiline rows={4} fullWidth variant="standard" placeholder="Leadership, Problem Solving, Public Speaking..." value={formData.soft_skills} onChange={e => setFormData({...formData, soft_skills: e.target.value})} />
                            </Box>
                        </div>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-6">
                            <Typography variant="h6" className="text-indigo-700 dark:text-indigo-400 font-extrabold">Cronologia Professionale</Typography>
                            <Button startIcon={<AddCircleIcon />} variant="contained" className="bg-indigo-600" size="small" onClick={() => addItem('experiences', {role:'', company:'', dateStart:'', dateEnd:'', current: false, description:''})}>Aggiungi</Button>
                        </div>
                        {formData.experiences.map((exp, index) => (
                            <Card key={index} elevation={0} className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 mb-5 relative">
                                <IconButton size="small" className="absolute top-3 right-3 text-slate-400 hover:text-red-600" onClick={() => removeItem(index, 'experiences')}><DeleteIcon fontSize="small" /></IconButton>
                                <CardContent className="space-y-4 pt-6">
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}><TextField label="Qualifica / Ruolo" size="small" fullWidth value={exp.role} onChange={e => handleArrayChange(index, 'role', e.target.value, 'experiences')} /></Grid>
                                        <Grid item xs={12} md={6}><TextField label="Azienda" size="small" fullWidth value={exp.company} onChange={e => handleArrayChange(index, 'company', e.target.value, 'experiences')} /></Grid>
                                        <Grid item xs={12} md={4}><TextField type="date" label="Inizio" size="small" InputLabelProps={{shrink: true}} fullWidth value={exp.dateStart} onChange={e => handleArrayChange(index, 'dateStart', e.target.value, 'experiences')} /></Grid>
                                        <Grid item xs={12} md={4}><TextField type="date" label="Fine" size="small" InputLabelProps={{shrink: true}} fullWidth value={exp.dateEnd} onChange={e => handleArrayChange(index, 'dateEnd', e.target.value, 'experiences')} disabled={exp.current} /></Grid>
                                        <Grid item xs={12} md={4}><FormControlLabel control={<Checkbox checked={exp.current || false} onChange={e => handleArrayChange(index, 'current', e.target.checked, 'experiences')} color="indigo" />} label={<Typography variant="caption" className="font-bold">In corso</Typography>} /></Grid>
                                        <Grid item xs={12}><TextField label="Responsabilità e Traguardi" multiline rows={3} fullWidth size="small" value={exp.description} onChange={e => handleArrayChange(index, 'description', e.target.value, 'experiences')} /></Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-6">
                            <Typography variant="h6" className="text-indigo-700 dark:text-indigo-400 font-extrabold">Istruzione e Formazione</Typography>
                            <Button startIcon={<AddCircleIcon />} variant="contained" className="bg-indigo-600" size="small" onClick={() => addItem('education', {degree:'', school:'', dateStart:'', dateEnd:'', city:'', description:''})}>Aggiungi Titolo</Button>
                        </div>
                        {formData.education.map((edu, index) => (
                            <Card key={index} elevation={0} className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 mb-5 relative">
                                <IconButton size="small" className="absolute top-2 right-2 text-slate-400 hover:text-red-600" onClick={() => removeItem(index, 'education')}><DeleteIcon fontSize="small" /></IconButton>
                                <CardContent className="space-y-4 pt-6">
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Titolo di Studio</InputLabel>
                                                <Select value={DEGREES.includes(edu.degree) ? edu.degree : ''} label="Titolo di Studio" onChange={e => handleArrayChange(index, 'degree', e.target.value, 'education')}>
                                                    {DEGREES.map((deg) => <MenuItem key={deg} value={deg}>{deg}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}><TextField label="Istituto / Università" size="small" fullWidth value={edu.school} onChange={e => handleArrayChange(index, 'school', e.target.value, 'education')} /></Grid>
                                        <Grid item xs={12} md={4}><TextField label="Città" size="small" fullWidth value={edu.city} onChange={e => handleArrayChange(index, 'city', e.target.value, 'education')} /></Grid>
                                        <Grid item xs={12} md={4}><TextField type="date" label="Inizio" size="small" InputLabelProps={{shrink: true}} fullWidth value={edu.dateStart} onChange={e => handleArrayChange(index, 'dateStart', e.target.value, 'education')} /></Grid>
                                        <Grid item xs={12} md={4}><TextField type="date" label="Data Fine" size="small" InputLabelProps={{shrink: true}} fullWidth value={edu.dateEnd} onChange={e => handleArrayChange(index, 'dateEnd', e.target.value, 'education')} /></Grid>
                                        <Grid item xs={12}><TextField label="Descrizione / Tesi" multiline rows={2} fullWidth size="small" value={edu.description} onChange={e => handleArrayChange(index, 'description', e.target.value, 'education')} /></Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 4 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-6">
                            <Typography variant="h6" className="text-indigo-700 dark:text-indigo-400 font-extrabold">Certificazioni & Riconoscimenti</Typography>
                            <Button startIcon={<AddCircleIcon />} variant="contained" className="bg-indigo-600" size="small" onClick={() => addItem('certifications', {name:'', year:''})}>Aggiungi</Button>
                        </div>
                         {formData.certifications.map((cert, index) => (
                            <Box key={index} className="flex gap-4 items-center mb-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <TextField label="Nome del Titolo" fullWidth size="small" value={cert.name} onChange={e => handleArrayChange(index, 'name', e.target.value, 'certifications')} />
                                <TextField label="Data" sx={{width: 140}} size="small" placeholder="YYYY" value={cert.year} onChange={e => handleArrayChange(index, 'year', e.target.value, 'certifications')} />
                                <IconButton color="error" onClick={() => removeItem(index, 'certifications')}><DeleteIcon /></IconButton>
                            </Box>
                         ))}
                    </div>
                )}

                {activeTab === 5 && (
                    <div className="animate-fade-in space-y-8">
                        <Box className="text-center py-10 border-2 border-dashed border-indigo-200 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl">
                            <AutoFixHighIcon className="text-indigo-600 dark:text-indigo-400 text-6xl mb-4" />
                            <Typography variant="h5" fontWeight="800" className="text-indigo-900 dark:text-indigo-200">Ottimizzazione Intelligente</Typography>
                            <Typography variant="body2" className="text-indigo-600 dark:text-indigo-400 mb-6 max-w-md mx-auto">Analizza il tuo CV o lascia che l'IA compili il tuo profilo partendo dal file PDF.</Typography>
                            
                            {formData.cv_filename && (
                                <Box className="mb-6 inline-flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">
                                    <PictureAsPdfIcon className="text-red-500" fontSize="small" />
                                    <Typography variant="caption" className="font-bold text-slate-700 dark:text-slate-200">File pronto: {formData.cv_filename}</Typography>
                                    <CheckCircleIcon className="text-emerald-500" sx={{ fontSize: 16 }} />
                                </Box>
                            )}

                            <Box className="flex flex-col sm:flex-row gap-4 justify-center px-6">
                                <Button variant="outlined" component="label" className="border-indigo-300 text-indigo-700 dark:text-indigo-300" startIcon={<CloudUploadIcon />}>
                                    {formData.cv_filename ? "Sostituisci PDF" : "Seleziona PDF"}
                                    <input type="file" hidden accept="application/pdf" onChange={handleCvUpload} />
                                </Button>
                                
                                {/* TASTO ESTRAZIONE DATI */}
                                <Button 
                                    variant="contained" 
                                    className="bg-purple-600 px-6 hover:bg-purple-700"
                                    onClick={handleExtractData}
                                    disabled={extracting || !formData.cv_filename}
                                    startIcon={extracting ? <CircularProgress size={20} color="inherit"/> : <AutoAwesomeIcon />}
                                >
                                    {extracting ? "Estrazione..." : "Auto-Compila Profilo ✨"}
                                </Button>

                                <Button 
                                    variant="contained" 
                                    className="bg-indigo-600 px-6" 
                                    onClick={handleAnalyze} 
                                    disabled={analyzing || !formData.cv_filename} 
                                    startIcon={analyzing ? <CircularProgress size={20} color="inherit"/> : <AutoFixHighIcon />}
                                >
                                    {analyzing ? "Analisi..." : "Analisi Qualità CV"}
                                </Button>
                            </Box>
                        </Box>

                        {analysisResult && (
                            <div className="bg-white dark:bg-slate-700 p-8 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xl animate-fade-in">
                                <div className="flex items-center gap-6 mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress variant="determinate" value={analysisResult.score} size={85} thickness={5} sx={{ color: analysisResult.score > 70 ? '#10b981' : '#f59e0b' }} />
                                        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography variant="h6" component="div" fontWeight="800" sx={{ color: 'text.primary' }}>{analysisResult.score}</Typography>
                                        </Box>
                                    </Box>
                                    <div>
                                        <Typography variant="h5" fontWeight="800" className="text-slate-800 dark:text-white">CV Quality Score</Typography>
                                        <Typography variant="body2" className="text-slate-500 italic mt-1">{analysisResult.summary}</Typography>
                                    </div>
                                </div>
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={0} className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                                            <Typography variant="subtitle2" className="font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-4"><CheckCircleIcon fontSize="small"/> Asset Strategici</Typography>
                                            <List dense>
                                                {analysisResult.strengths.map((s,i) => <ListItem key={i} disableGutters><ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} /></ListItemIcon><ListItemText primary={s} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} /></ListItem>)}
                                            </List>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={0} className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl">
                                            <Typography variant="subtitle2" className="font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-4"><WarningIcon fontSize="small"/> Punti di Debolezza</Typography>
                                            <List dense>
                                                {analysisResult.improvements.map((s,i) => <ListItem key={i} disableGutters><ListItemIcon sx={{ minWidth: 32 }}><WarningIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></ListItemIcon><ListItemText primary={s} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} /></ListItem>)}
                                            </List>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </div>
                        )}
                    </div>
                )}

                {activeTab !== 5 && (
                    <div className="mt-12 flex justify-end border-t border-slate-100 dark:border-slate-700 pt-6">
                        <Button variant="contained" size="large" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 px-10 py-3 text-lg font-bold shadow-indigo-200 shadow-lg transition-transform hover:scale-105 active:scale-95">Salva Tutto</Button>
                    </div>
                )}

            </Paper>
        </Grid>
      </Grid>
    </div>
  );
}