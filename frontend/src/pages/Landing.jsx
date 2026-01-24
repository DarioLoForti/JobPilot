import { Container, Typography, Button, Box, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      
      {/* HERO SECTION */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
          Prendi il comando della tua <br />
          <span style={{ color: '#1976d2' }}>Carriera Professionale</span>
        </Typography>
        
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Organizza le tue candidature, genera CV in PDF e usa l'AI per scrivere le lettere di presentazione. Tutto in un'unica dashboard.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
                variant="contained" 
                size="large" 
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 50 }}
                onClick={() => navigate('/register')}
            >
              Inizia Gratis 🚀
            </Button>
            <Button 
                variant="outlined" 
                size="large" 
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 50 }}
                onClick={() => navigate('/login')}
            >
              Accedi
            </Button>
        </Box>
      </Box>

      {/* FEATURES SECTION */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        
        {/* Feature 1 */}
        <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%', borderRadius: 4 }}>
                <DashboardIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>Kanban Board</Typography>
                <Typography color="text.secondary">
                    Tieni traccia di ogni candidatura: inviata, colloquio, offerta. Non perdere mai un'opportunità.
                </Typography>
            </Paper>
        </Grid>

        {/* Feature 2 */}
        <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%', borderRadius: 4 }}>
                <AutoAwesomeIcon color="secondary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>AI Assistant</Typography>
                <Typography color="text.secondary">
                    Scrivi lettere di presentazione perfette in un click grazie al nostro generatore intelligente.
                </Typography>
            </Paper>
        </Grid>

        {/* Feature 3 */}
        <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%', borderRadius: 4 }}>
                <PictureAsPdfIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>CV Builder</Typography>
                <Typography color="text.secondary">
                    Trasforma il tuo profilo in un CV PDF professionale pronto per essere scaricato e inviato.
                </Typography>
            </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}