import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Typography, Box, Paper } from '@mui/material';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/');
    } else {
      if (userData) setUser(JSON.parse(userData));
    }
  }, [navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom color="primary">
          Ciao, {user?.first_name || 'Pilota'}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Benvenuto nel tuo centro di comando. Da qui controlli tutta la tua ricerca lavoro.
        </Typography>
        
        {/* Pulsantoni Grandi per accesso rapido */}
        <Box sx={{ mt: 6, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              sx={{ p: 3, fontSize: '1.2rem' }}
              onClick={() => navigate('/jobs')}
            >
              📊 Vai ai Miei Lavori
            </Button>

            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ p: 3, fontSize: '1.2rem' }}
              onClick={() => navigate('/profile')}
            >
              👤 Gestisci il mio CV
            </Button>
        </Box>
      </Paper>
    </Container>
  );
}