import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Non mostrare la barra nelle pagine di Login e Registrazione
  if (location.pathname === '/' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        {/* Titolo Cliccabile che porta alla Dashboard */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          JobPilot ✈️
        </Typography>

        {/* Menu di Navigazione */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate('/jobs')}>
            Jobs
          </Button>
          <Button color="inherit" onClick={() => navigate('/profile')}>
            Profilo
          </Button>
          <Button color="warning" onClick={handleLogout} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}