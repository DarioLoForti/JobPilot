import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { Fab, Tooltip } from '@mui/material'; // 👈 NUOVO IMPORT
import { SupervisorAccount } from '@mui/icons-material'; // 👈 NUOVO IMPORT ICONA

// Importazione Pagine
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import Coach from './pages/Coach';
import JobFinder from './pages/JobFinder';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AuthSuccess from './pages/AuthSuccess'; 

// Importazione Componenti
import Navbar from './components/Navbar';
import CookieBanner from './components/CookieBanner';

// Componente per proteggere le rotte (Redirect se non loggato)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// 🔥 NUOVO COMPONENTE: TASTO "TORNA ADMIN"
// Questo bottone appare SOLO se stai impersonando qualcuno
const AdminRestorer = () => {
  const navigate = useNavigate();
  // Controlla se esiste il backup del token Admin
  const adminBackup = localStorage.getItem("admin_token_backup");

  if (!adminBackup) return null; // Se non c'è backup, non mostrare nulla

  const restoreAdmin = () => {
    // 1. Ripristina il token Admin dal backup
    localStorage.setItem("token", adminBackup);
    
    // 2. Cancella il backup e i dati dell'utente finto
    localStorage.removeItem("admin_token_backup");
    localStorage.removeItem("user"); 
    
    // 3. Ricarica e vai all'admin panel
    window.location.href = "/admin";
  };

  return (
    <Tooltip title="Esci dalla modalità utente e torna Admin">
      <Fab 
        variant="extended"
        onClick={restoreAdmin}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999, // Sopra a tutto
          fontWeight: 'bold',
          color: '#fff',
          boxShadow: '0px 0px 20px rgba(0,0,0,0.5)',
          backgroundColor: '#d50000', // Rosso intenso
          '&:hover': { backgroundColor: '#9b0000' }
        }}
      >
        <SupervisorAccount sx={{ mr: 1 }} />
        TORNA ADMIN
      </Fab>
    </Tooltip>
  );
};

function App() {
  // Gestione Tema (Dark/Light)
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [mode]);

  // Configurazione MUI Theme
  const theme = useMemo(() => createTheme({
      palette: {
        mode,
        primary: { main: '#2563eb' },
        background: { 
            default: mode === 'dark' ? '#0f172a' : '#f1f5f9', 
            paper: mode === 'dark' ? '#1e293b' : '#ffffff' 
        },
        text: {
            primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
            secondary: mode === 'dark' ? '#94a3b8' : '#475569',
        }
      },
      typography: { fontFamily: '"Inter", sans-serif' },
      components: {
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'none' } } }
      }
    }), [mode]);

  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
            
            {/* Sfondo Animato */}
            <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-500 ${mode === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <Toaster position="top-right" toastOptions={{ style: { background: mode === 'dark' ? '#1e293b' : '#fff', color: mode === 'dark' ? '#fff' : '#333' } }} />
            
            <div className="relative z-10">
                <Navbar mode={mode} toggleMode={toggleMode} />
                
                <Routes>
                    {/* Rotte Pubbliche */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Auth Success (Se decidi di riattivare Google) */}
                    <Route path="/auth-success" element={<AuthSuccess />} />
                    
                    {/* Rotte Protette */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
                    <Route path="/finder" element={<ProtectedRoute><JobFinder /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    
                    {/* Rotta Admin */}
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                    {/* Fallback 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* 🔥 IL BOTTONE GALLEGGIANTE (Appare solo se impersoni) */}
                <AdminRestorer />

                <CookieBanner /> 
            </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;