import { useEffect, useState } from 'react';
import { 
  Container, Typography, TextField, Button, Grid, Card, CardContent, 
  Chip, Box, Alert, MenuItem 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  
  // Stato per il form di aggiunta
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    status: 'APPLIED',
    notes: ''
  });

  // Funzione per caricare i lavori dal Backend
  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    try {
      const response = await fetch('/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        setError('Impossibile caricare i lavori');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  // Carica i lavori appena si apre la pagina
  useEffect(() => {
    fetchJobs();
  }, []);

  // Funzione per inviare il nuovo lavoro
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Pulisci il form e ricarica la lista
        setFormData({ companyName: '', jobTitle: '', status: 'APPLIED', notes: '' });
        fetchJobs(); 
      } else {
        setError('Errore nel salvataggio');
      }
    } catch (err) {
      setError('Errore server');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        📋 Le mie Candidature
      </Typography>

      {/* --- FORM DI AGGIUNTA --- */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 6, p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Aggiungi Nuova</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth label="Nome Azienda" required
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth label="Posizione (es. Frontend Dev)" required
              value={formData.jobTitle}
              onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              select fullWidth label="Stato"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <MenuItem value="WISHLIST">Desiderata</MenuItem>
              <MenuItem value="APPLIED">Candidato</MenuItem>
              <MenuItem value="INTERVIEW">Colloquio</MenuItem>
              <MenuItem value="OFFER">Offerta</MenuItem>
              <MenuItem value="REJECTED">Rifiutato</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth label="Note (opzionale)"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" size="large">Salva Candidatura</Button>
          </Grid>
        </Grid>
      </Box>

      {/* --- LISTA LAVORI --- */}
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} key={job.id}>
            <Card elevation={3}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    {job.company_name}
                  </Typography>
                  <Typography color="text.secondary">
                    {job.job_title}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Note: {job.notes || 'Nessuna nota'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip 
                    label={job.status} 
                    color={job.status === 'OFFER' ? 'success' : job.status === 'REJECTED' ? 'error' : 'primary'} 
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}