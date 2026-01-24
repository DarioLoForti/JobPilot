import { useEffect, useState } from 'react';
import { 
  TextField, Button, Tabs, Tab, Box, CircularProgress, 
  Avatar 
} from '@mui/material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from '../components/CVDocument'; // Importato UNA sola volta
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  // Form States
  const [formData, setFormData] = useState({ 
    first_name: '', last_name: '', email: '', phone: '', address: '', 
    summary: '', experience: '', education: '', skills: '' 
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            first_name: data.first_name || '', last_name: data.last_name || '',
            email: data.email || '', phone: data.phone || '', address: data.address || '',
            summary: data.summary || '', experience: data.experience || '',
            education: data.education || '', skills: data.skills || ''
          });
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    alert("Profilo aggiornato! ✅");
    window.location.reload(); 
  };

  if (loading) return <div className="flex justify-center mt-20"><CircularProgress /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-6 flex flex-col md:flex-row items-center gap-6">
        <Avatar 
          src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null} 
          sx={{ width: 100, height: 100, fontSize: 40, bgcolor: '#3b82f6' }}
        >
          {user?.first_name?.[0]}
        </Avatar>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</h1>
          <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
        
        {/* PDF DOWNLOAD BUTTON */}
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl">
           <PDFDownloadLink document={<MyDocument data={formData} />} fileName="Mio_CV.pdf">
              {({ loading }) => (
                <Button variant="contained" color="error" disabled={loading}>
                  {loading ? 'Generazione...' : 'Scarica PDF'}
                </Button>
              )}
           </PDFDownloadLink>
        </div>
      </div>

      {/* CONTENT TABS */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} textColor="primary" indicatorColor="primary">
            <Tab label="Dati Personali" />
            <Tab label="CV & Esperienze" />
          </Tabs>
        </Box>

        {/* TAB 1: DATI PERSONALI */}
        <div role="tabpanel" hidden={tabIndex !== 0} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Nome" fullWidth value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                <TextField label="Cognome" fullWidth value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                <TextField label="Email" fullWidth disabled value={formData.email} />
                <TextField label="Telefono" fullWidth value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <TextField label="Indirizzo" fullWidth className="md:col-span-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
        </div>

        {/* TAB 2: CV DATA */}
        <div role="tabpanel" hidden={tabIndex !== 1} className="p-8 space-y-6">
            <TextField label="Sommario Professionale" multiline rows={3} fullWidth value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="Breve descrizione di chi sei..." />
            <TextField label="Esperienza Lavorativa" multiline rows={4} fullWidth value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="Elenco lavori passati..." />
            <TextField label="Istruzione" multiline rows={3} fullWidth value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} placeholder="Lauree, diplomi..." />
            <TextField label="Skills" multiline rows={2} fullWidth value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, SQL..." />
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-end border-t border-slate-200 dark:border-slate-700">
            <Button variant="contained" size="large" onClick={handleSave} sx={{ px: 4 }}>
                Salva Modifiche
            </Button>
        </div>
      </div>
    </div>
  );
}