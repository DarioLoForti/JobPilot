import { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Tabs, Tab, TextField, Button, 
  Grid, Card, CardContent, IconButton, Chip, Alert, Paper, Avatar 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
// Import per il PDF
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CvDocument } from '../components/CvDocument';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const [tabIndex, setTabIndex] = useState(0);
  const [profile, setProfile] = useState({ experiences: [], educations: [], skills: [] });
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const [expForm, setExpForm] = useState({ company: '', role: '', startDate: '', description: '' });
  const [eduForm, setEduForm] = useState({ school: '', degree: '', field: '', startDate: '' });
  const [skillForm, setSkillForm] = useState({ name: '', level: 3 });

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchProfile(); 
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/users/upload-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert("Foto profilo caricata! 📸");
      } else {
        setError("Errore caricamento foto");
      }
    } catch (err) { setError("Errore di connessione"); }
  };

  const handleAdd = async (type, data, resetForm) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/profile/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchProfile();
        resetForm();
      } else {
        setError('Errore nel salvataggio');
      }
    } catch (err) { setError('Errore di connessione'); }
  };

  // --- MODIFICATO: CANCELLAZIONE DIRETTA ---
  const handleDelete = async (id, type) => {
    const token = localStorage.getItem('token');
    
    // RIMOSSO: if(!window.confirm("Sei sicuro?")) return;
    
    await fetch(`/api/profile/${id}?type=${type}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfile();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <Avatar 
            src={user?.profile_picture} 
            alt={user?.first_name}
            sx={{ width: 100, height: 100, border: '4px solid #fff', boxShadow: 3, mb: 1 }}
          />
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="upload-button-file"
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="upload-button-file">
            <Button variant="outlined" size="small" component="span" sx={{ fontSize: '0.7rem' }}>
              Cambia Foto
            </Button>
          </label>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography color="text.secondary">
                {user?.email}
            </Typography>
        </Box>
        
        <PDFDownloadLink 
          document={<CvDocument user={user} profile={profile} />} 
          fileName={`CV_${user?.last_name || 'JobPilot'}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <Button variant="contained" color="success" size="large" disabled={loading}>
              {loading ? 'Generazione...' : '📄 Scarica PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered variant="fullWidth">
          <Tab icon={<BusinessIcon />} label="Esperienza" />
          <Tab icon={<SchoolIcon />} label="Istruzione" />
          <Tab icon={<StarIcon />} label="Skills" />
        </Tabs>

        {/* TAB 1: ESPERIENZA */}
        <TabPanel value={tabIndex} index={0}>
          <Box component="form" sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd('experience', expForm, () => setExpForm({ company: '', role: '', startDate: '', description: '' }));
            }}>
            <Typography variant="h6" gutterBottom>Aggiungi Esperienza</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Azienda" required value={expForm.company} onChange={e => setExpForm({...expForm, company: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Ruolo" required value={expForm.role} onChange={e => setExpForm({...expForm, role: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Data Inizio" InputLabelProps={{ shrink: true }} required value={expForm.startDate} onChange={e => setExpForm({...expForm, startDate: e.target.value})} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Descrizione attività" value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} /></Grid>
              <Grid item xs={12}><Button type="submit" variant="contained">Salva Esperienza</Button></Grid>
            </Grid>
          </Box>
          {profile.experiences.map(item => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">{item.role} @ {item.company}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dal {new Date(item.start_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{item.description}</Typography>
                </Box>
                <IconButton onClick={() => handleDelete(item.id, 'experience')} color="error"><DeleteIcon /></IconButton>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        {/* TAB 2: ISTRUZIONE */}
        <TabPanel value={tabIndex} index={1}>
          <Box component="form" sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd('education', eduForm, () => setEduForm({ school: '', degree: '', field: '', startDate: '' }));
            }}>
            <Typography variant="h6" gutterBottom>Aggiungi Formazione</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Istituto / Università" required value={eduForm.school} onChange={e => setEduForm({...eduForm, school: e.target.value})} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Titolo (es. Laurea)" value={eduForm.degree} onChange={e => setEduForm({...eduForm, degree: e.target.value})} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Materia (es. Informatica)" value={eduForm.field} onChange={e => setEduForm({...eduForm, field: e.target.value})} /></Grid>
              <Grid item xs={6}><TextField fullWidth type="date" label="Data Inizio" InputLabelProps={{ shrink: true }} value={eduForm.startDate} onChange={e => setEduForm({...eduForm, startDate: e.target.value})} /></Grid>
              <Grid item xs={12}><Button type="submit" variant="contained">Salva Istruzione</Button></Grid>
            </Grid>
          </Box>
          {profile.educations.map(item => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">{item.school}</Typography>
                  <Typography>{item.degree} in {item.field}</Typography>
                  <Typography variant="caption">{new Date(item.start_date).toLocaleDateString()}</Typography>
                </Box>
                <IconButton onClick={() => handleDelete(item.id, 'education')} color="error"><DeleteIcon /></IconButton>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        {/* TAB 3: SKILLS */}
        <TabPanel value={tabIndex} index={2}>
           <Box component="form" sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd('skill', skillForm, () => setSkillForm({ name: '', level: 3 }));
            }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}><TextField fullWidth label="Competenza (es. React, Python)" required value={skillForm.name} onChange={e => setSkillForm({...skillForm, name: e.target.value})} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" inputProps={{ min: 1, max: 5 }} label="Livello (1-5)" value={skillForm.level} onChange={e => setSkillForm({...skillForm, level: e.target.value})} /></Grid>
              <Grid item xs={12}><Button type="submit" variant="contained">Aggiungi Skill</Button></Grid>
            </Grid>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {profile.skills.map(item => (
              <Chip 
                key={item.id} 
                label={`${item.name} (${item.level}/5)`} 
                onDelete={() => handleDelete(item.id, 'skill')}
                color="primary" 
                variant="outlined"
              />
            ))}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}