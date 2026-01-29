import { useState, useEffect, useMemo } from 'react';
import { 
  TextField, Button, Paper, Typography, 
  Chip, Slider, FormControlLabel, Switch, CircularProgress, 
  Box, Avatar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Autocomplete, Tooltip, Dialog, DialogContent, IconButton
} from '@mui/material';
import { 
  Search, LocationOn, Bolt, OpenInNew, 
  Cancel, WorkOutline, BookmarkBorder, 
  LinkedIn, Google, Sort as SortIcon, Business, Public, Language,
  Handshake, ContentCopy, Close, Send, AutoAwesome, Lightbulb
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function JobFinder() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [sortBy, setSortBy] = useState('match_desc');
  
  // Stati per Icebreaker (Networking)
  const [openIcebreaker, setOpenIcebreaker] = useState(false);
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);
  const [icebreakerMessages, setIcebreakerMessages] = useState([]);
  const [selectedJobForIce, setSelectedJobForIce] = useState(null);

  // 🔥 STATI PER I SUGGERIMENTI AI
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Autocomplete
  const [cityOptions, setCityOptions] = useState([]);
  const [cityInputValue, setCityInputValue] = useState('');

  const [filters, setFilters] = useState({
    query: '',
    location: '',
    remoteOnly: false,
    minMatch: 0,
    experience: 'all',
    jobType: 'all',
    datePosted: 'month'
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser || storedUser === "undefined") localStorage.removeItem('user');
    } catch (e) { localStorage.removeItem('user'); }
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      if (cityInputValue.length < 2) { setCityOptions([]); return; }
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityInputValue}&addressdetails=1&limit=5`);
        const data = await response.json();
        const formattedLocations = data.map((item) => {
            const addr = item.address;
            const mainName = addr.city || addr.town || addr.village || addr.state || addr.county || item.name;
            const country = addr.country;
            if (item.class === 'place' || item.class === 'boundary') {
                return mainName && country ? `${mainName}, ${country}` : item.display_name;
            }
            return null;
        }).filter(Boolean);
        setCityOptions([...new Set(formattedLocations)]);
      } catch (error) { console.error(error); }
    };
    const timeoutId = setTimeout(() => fetchLocations(), 400);
    return () => clearTimeout(timeoutId);
  }, [cityInputValue]);

  const handleSearch = async () => {
    if (!filters.query && !filters.location) return toast.error("Inserisci almeno un criterio!");
    setLoading(true);
    setResults([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(filters)
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if(data.length > 0) toast.success(`${data.length} offerte trovate!`);
        else toast.error("Nessuna offerta trovata con questi filtri.");
      } else {
        const err = await res.json();
        if (res.status === 429) toast.error("Limite ricerche giornaliero raggiunto. Riprova domani!");
        else toast.error(err.error || "Errore ricerca.");
      }
    } catch (error) { toast.error("Errore di connessione."); } 
    finally { setLoading(false); }
  };

  // 🔥 FUNZIONE PER CHIEDERE ALL'AI
  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/ai/suggest-roles", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            setSuggestions(data.suggestions);
            toast.success("Ecco i ruoli adatti a te!");
        } else {
            toast.error("Impossibile recuperare suggerimenti");
        }
    } catch (error) {
        toast.error("Errore AI");
    } finally {
        setLoadingSuggestions(false);
    }
  };

  // Quando clicchi su un chip suggerito
  const handleSuggestionClick = (role) => {
      setFilters(prev => ({ ...prev, query: role }));
      // Opzionale: Lanciare subito la ricerca? Per ora solo setto il campo.
      toast(`Cerca per: ${role}`, { icon: '🔍' });
  };

  const handleSaveJob = async (job) => {
    setSavingId(job.id);
    const token = localStorage.getItem('token');
    
    const realLink = job.link || generateSmartLink(job.title, job.company, 'linkedin');
    const sourceInfo = getJobSource(realLink);

    const jobData = {
        company: job.company,
        position: job.title,
        job_link: realLink,
        job_description: job.description || "Descrizione importata da JSearch",
        status: 'wishlist',
        notes: `Compatibilità AI: ${job.matchScore}%\nFonte: ${sourceInfo.name}\nMotivo Match: ${job.explainability || "N/A"}`
    };

    try {
        const res = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(jobData)
        });
        if (res.ok) toast.success("Salvato in 'Da Inviare'! 📝");
        else toast.error("Errore nel salvataggio.");
    } catch (error) { toast.error("Errore di rete."); } 
    finally { setSavingId(null); }
  };

  // --- ICEBREAKER ---
  const handleOpenIcebreaker = async (job) => {
    setSelectedJobForIce(job);
    setOpenIcebreaker(true);
    setIcebreakerLoading(true);
    setIcebreakerMessages([]);

    try {
        const token = localStorage.getItem('token');
        const keywords = (job.skills_found && job.skills_found.length > 0) 
            ? job.skills_found.join(", ") 
            : job.title;
        
        const res = await fetch('/api/ai/icebreaker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                company: job.company, 
                position: job.title,
                keywords: keywords
            })
        });

        if (res.ok) {
            const data = await res.json();
            setIcebreakerMessages(data);
        } else {
            toast.error("Impossibile generare messaggi.");
        }
    } catch (e) {
        toast.error("Errore AI.");
    } finally {
        setIcebreakerLoading(false);
    }
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Copiato negli appunti!");
  };

  const sortedResults = useMemo(() => {
      let processed = results.filter(job => job.matchScore >= filters.minMatch);
      if (sortBy === 'match_desc') {
          processed.sort((a, b) => b.matchScore - a.matchScore);
      } else if (sortBy === 'match_asc') {
          processed.sort((a, b) => a.matchScore - b.matchScore);
      }
      return processed;
  }, [results, sortBy, filters.minMatch]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-500 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 border-amber-500 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400';
    return 'text-slate-500 border-slate-300 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
  };

  const getJobSource = (url) => {
      if (!url || url === "#") return { name: 'Web', icon: <Public fontSize="small"/>, color: 'bg-slate-100 text-slate-600' };
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('linkedin')) return { name: 'LinkedIn', icon: <LinkedIn fontSize="small"/>, color: 'bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/20' };
      if (lowerUrl.includes('indeed')) return { name: 'Indeed', icon: <Language fontSize="small"/>, color: 'bg-[#003A9B]/10 text-[#003A9B] border-[#003A9B]/20' };
      if (lowerUrl.includes('glassdoor')) return { name: 'Glassdoor', icon: <Language fontSize="small"/>, color: 'bg-[#0CAA41]/10 text-[#0CAA41] border-[#0CAA41]/20' };
      try {
        const hostname = new URL(url).hostname.replace('www.', '').replace('.com', '').replace('.it', '');
        const cleanName = hostname.charAt(0).toUpperCase() + hostname.slice(1);
        return { name: cleanName, icon: <Business fontSize="small"/>, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
      } catch (e) {
        return { name: 'Web', icon: <Public fontSize="small"/>, color: 'bg-slate-100 text-slate-600' };
      }
  };

  const generateSmartLink = (title, company, platform) => {
      const query = encodeURIComponent(`${title} ${company}`);
      if (platform === 'linkedin') return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
      if (platform === 'google') return `https://www.google.com/search?q=${query}+jobs&ibp=htl;jobs`;
      return '#';
  };

  const selectStyle = "bg-slate-50 dark:bg-black/20 rounded-xl text-slate-900 dark:text-white border-slate-200 dark:border-white/10";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-[#0f172a]">
      
      <Box className="text-center mb-12 pt-4">
        <Typography variant="h2" className="font-black mb-2 text-slate-900 dark:text-white tracking-tight">
          AI Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400">Hunter</span>
        </Typography>
        <Typography className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          Cerca offerte reali su LinkedIn e Indeed e analizzale con l'AI.
        </Typography>
      </Box>

      {/* SEARCH PANEL */}
      <Paper className="glass-panel p-6 md:p-8 rounded-[2rem] mb-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
        
        {/* Griglia Input Principale */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4">
          <div className="md:col-span-5">
            <TextField fullWidth placeholder="Ruolo (es. React Developer)" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} className="input-glass" InputProps={{ startAdornment: <InputAdornment position="start"><Search className="text-slate-400"/></InputAdornment> }} />
          </div>
          <div className="md:col-span-4">
            <Autocomplete freeSolo options={cityOptions} inputValue={cityInputValue} onInputChange={(e, val) => { setCityInputValue(val); setFilters({...filters, location: val}); }}
                renderInput={(params) => (<TextField {...params} placeholder="Dove? (Città)" fullWidth className="input-glass" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start" className="pl-2"><LocationOn className="text-slate-400" /></InputAdornment>) }} />)}
                PaperComponent={({ children }) => <Paper className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xl mt-2">{children}</Paper>}
            />
          </div>
          <div className="md:col-span-3">
            <Button fullWidth variant="contained" size="large" onClick={handleSearch} disabled={loading} className="h-[56px] btn-neon rounded-xl font-bold text-lg shadow-lg">
              {loading ? <CircularProgress size={24} color="inherit" /> : "Cerca Offerte"}
            </Button>
          </div>
        </div>

        {/* 🔥 SEZIONE SUGGERIMENTI AI */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button 
                size="small" 
                onClick={fetchAiSuggestions} 
                disabled={loadingSuggestions}
                startIcon={loadingSuggestions ? <CircularProgress size={16} /> : <AutoAwesome />}
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 font-bold rounded-full normal-case px-4"
            >
                {loadingSuggestions ? "Analizzo il tuo profilo..." : "Consigliami ruoli adatti"}
            </Button>

            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-2 animate-fade-in">
                    {suggestions.map((item, idx) => (
                        <Tooltip key={idx} title={item.reason} arrow>
                            <Chip 
                                icon={<Lightbulb className="text-yellow-500" style={{ fontSize: 16 }} />}
                                label={item.role} 
                                onClick={() => handleSuggestionClick(item.role)}
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"
                                variant="outlined"
                            />
                        </Tooltip>
                    ))}
                </div>
            )}
        </div>

        {/* Filtri Avanzati */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <FormControl fullWidth size="small" className="input-glass"><InputLabel>Esperienza</InputLabel><Select value={filters.experience} label="Esperienza" onChange={(e) => setFilters({...filters, experience: e.target.value})} className={selectStyle}><MenuItem value="all">Tutti</MenuItem><MenuItem value="entry">Junior</MenuItem><MenuItem value="mid">Mid</MenuItem><MenuItem value="senior">Senior</MenuItem></Select></FormControl>
            <FormControl fullWidth size="small" className="input-glass"><InputLabel>Tipo</InputLabel><Select value={filters.jobType} label="Tipo" onChange={(e) => setFilters({...filters, jobType: e.target.value})} className={selectStyle}><MenuItem value="all">Tutti</MenuItem><MenuItem value="fulltime">Full-time</MenuItem><MenuItem value="contract">Freelance</MenuItem></Select></FormControl>
            <FormControl fullWidth size="small" className="input-glass"><InputLabel>Data</InputLabel><Select value={filters.datePosted} label="Data" onChange={(e) => setFilters({...filters, datePosted: e.target.value})} className={selectStyle}><MenuItem value="today">Oggi</MenuItem><MenuItem value="3days">3 Giorni</MenuItem><MenuItem value="week">Settimana</MenuItem><MenuItem value="month">Mese</MenuItem></Select></FormControl>
            <div className="flex items-center justify-center bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 px-4"><FormControlLabel control={<Switch checked={filters.remoteOnly} onChange={(e) => setFilters({...filters, remoteOnly: e.target.checked})} color="primary" />} label={<Typography className="font-bold text-slate-600 dark:text-slate-300 text-sm">Remoto</Typography>} className="m-0" /></div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <Typography className="font-bold text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2"><Bolt className="text-yellow-500" fontSize="small" /> AI Match Minimo ({filters.minMatch}%):</Typography>
            <div className="flex-1 w-full md:w-auto px-4"><Slider value={filters.minMatch} onChange={(e, v) => setFilters({...filters, minMatch: v})} valueLabelDisplay="auto" step={10} marks min={0} max={100} sx={{ color: '#22d3ee' }} /></div>
        </div>
      </Paper>

      {/* HEADER RISULTATI */}
      {results.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <Typography className="font-bold text-slate-600 dark:text-slate-300">Mostrando {sortedResults.length} di {results.length} opportunità</Typography>
              <div className="flex items-center gap-3"><SortIcon className="text-slate-400" /><FormControl size="small" className="min-w-[180px]"><Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${selectStyle} h-10`} displayEmpty><MenuItem value="match_desc">Compatibilità (Alta)</MenuItem><MenuItem value="match_asc">Compatibilità (Bassa)</MenuItem></Select></FormControl></div>
          </div>
      )}

      {/* RESULTS LIST */}
      {loading ? (
          <div className="text-center py-20"><CircularProgress size={60} thickness={4} className="text-blue-500 mb-4" /><Typography className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Scansionando il web in tempo reale...</Typography></div>
      ) : (
          <div className="grid grid-cols-1 gap-4">
              {sortedResults.length === 0 && results.length > 0 && (
                  <div className="text-center py-10 opacity-60"><Cancel fontSize="large" className="mb-2"/><Typography>Nessun risultato supera il filtro di compatibilità.</Typography><Button onClick={() => setFilters({...filters, minMatch: 0})} className="mt-2 text-blue-500">Rimuovi Filtro</Button></div>
              )}

              {sortedResults.map((job) => {
                  const source = getJobSource(job.link);
                  return (
                    <Paper key={job.id} className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row gap-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none hover:border-indigo-400/30 transition-all">
                        <div className="flex gap-4 flex-1">
                            <Avatar className="w-16 h-16 rounded-2xl font-bold text-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border border-slate-300 dark:from-slate-800 dark:to-slate-900 dark:text-white dark:border-white/10">
                                {job.logo ? <img src={job.logo} alt="logo" className="w-full h-full object-cover rounded-2xl"/> : (job.company ? job.company[0] : 'J')}
                            </Avatar>
                            <div className="flex-1">
                                <Typography variant="h5" className="font-bold text-slate-900 dark:text-white">{job.title}</Typography>
                                <Typography className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 text-sm"><WorkOutline style={{fontSize: 16}}/> {job.company} <span className="w-1 h-1 bg-slate-400 rounded-full mx-1"></span> {job.location}</Typography>
                                
                                <div className="mt-3 flex gap-2 flex-wrap items-center">
                                    <Chip label={source.name} size="small" icon={source.icon} className={`${source.color} font-bold text-xs border border-transparent`} />
                                    {job.type && <Chip label={job.type} size="small" className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-white/10" />}
                                </div>

                                <div className="flex gap-2 mt-4 flex-wrap">
                                    {/* PULSANTE CANDIDATURA REALE */}
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        href={job.link} 
                                        target="_blank" 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg normal-case" 
                                        startIcon={<OpenInNew />}
                                    >
                                        Candidati Ora
                                    </Button>

                                    <Tooltip title="Genera messaggio per Recruiter">
                                        <Button 
                                            size="small" 
                                            onClick={() => handleOpenIcebreaker(job)}
                                            className="bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 font-bold rounded-lg normal-case dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-500/30" 
                                            startIcon={<Handshake />}
                                        >
                                            Connect
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:items-end justify-between gap-4 md:w-80 md:border-l border-slate-100 dark:border-white/10 md:pl-6">
                            <div className="flex items-center gap-4 w-full justify-between md:justify-end">
                                <div className="text-right">
                                    <Typography variant="caption" className="text-slate-400 block uppercase tracking-wider font-bold">Compatibilità</Typography>
                                    <Typography variant="h4" className={`font-black ${getScoreColor(job.matchScore).split(' ')[0]}`}>{job.matchScore > 0 ? job.matchScore + '%' : 'N/A'}</Typography>
                                </div>
                                <div className={`relative w-12 h-12 rounded-full border-4 flex items-center justify-center ${getScoreColor(job.matchScore)}`}><Bolt fontSize="medium" className="text-current" /></div>
                            </div>
                            
                            <div className="w-full">
                                {/* Visualizzazione Intelligente: Se ci sono skill le mostro, altrimenti mostro la spiegazione */}
                                <div className="mb-4 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    {job.skills_found && job.skills_found.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {job.skills_found.slice(0, 3).map(s => <span key={s} className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200">✓ {s}</span>)}
                                        </div>
                                    ) : (
                                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400 italic leading-tight block text-right">
                                            "{job.explainability || "Clicca per dettagli..."}"
                                        </Typography>
                                    )}
                                </div>

                                <Button fullWidth variant="outlined" size="small" onClick={() => handleSaveJob(job)} disabled={savingId === job.id} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5 font-bold py-2" startIcon={savingId === job.id ? <CircularProgress size={18} color="inherit"/> : <BookmarkBorder/>}>
                                    {savingId === job.id ? "Salvataggio..." : "Salva in Dashboard"}
                                </Button>
                            </div>
                        </div>
                    </Paper>
                  );
              })}
          </div>
      )}

      {/* MODALE ICEBREAKER (NETWORKING AI) */}
      <Dialog 
        open={openIcebreaker} 
        onClose={() => setOpenIcebreaker(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "rounded-3xl glass-panel bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white" }}
      >
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10">
              <div>
                  <Typography variant="h5" className="font-bold flex items-center gap-2">
                      <Handshake className="text-purple-500"/> Networking Assistant
                  </Typography>
                  <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
                      Messaggi generati per: <b>{selectedJobForIce?.company}</b>
                  </Typography>
              </div>
              <IconButton onClick={() => setOpenIcebreaker(false)}><Close /></IconButton>
          </div>
          
          <DialogContent className="p-6">
              {icebreakerLoading ? (
                  <div className="text-center py-10">
                      <CircularProgress className="text-purple-500 mb-4" />
                      <Typography>L'AI sta scrivendo i messaggi perfetti per te...</Typography>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {icebreakerMessages.map((msg, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col h-full">
                              <div className="mb-2">
                                  <Chip label={msg.type} size="small" className={`font-bold ${index === 0 ? 'bg-blue-100 text-blue-700' : index === 1 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`} />
                              </div>
                              <Typography className="text-sm italic mb-4 flex-1 text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                  "{msg.text}"
                              </Typography>
                              <Button 
                                  variant="outlined" 
                                  size="small" 
                                  startIcon={<ContentCopy />} 
                                  onClick={() => copyToClipboard(msg.text)}
                                  className="mt-auto border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
                              >
                                  Copia
                              </Button>
                          </div>
                      ))}
                  </div>
              )}
          </DialogContent>
      </Dialog>

    </div>
  );
}