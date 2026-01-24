import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react'; // <--- Aggiungi useEffect
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pagine
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  // Leggiamo la preferenza salvata o usiamo 'light'
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'light');

  // --- SINCRONIZZAZIONE TAILWIND ---
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
  // ---------------------------------

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                background: { default: '#f8fafc', paper: '#ffffff' }, // Slate-50 / White
                primary: { main: '#2563eb' }, // Blue-600
                text: { primary: '#0f172a', secondary: '#475569' } // Slate-900 / Slate-600
              }
            : {
                background: { default: '#0f172a', paper: '#1e293b' }, // Slate-900 / Slate-800
                primary: { main: '#3b82f6' }, // Blue-500
                text: { primary: '#f8fafc', secondary: '#94a3b8' } // Slate-50 / Slate-400
              }),
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h4: { fontWeight: 700 },
        },
        components: {
          MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } } // Rimuove l'overlay grigio di MUI in dark mode
        }
      }),
    [mode],
  );

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <Navbar mode={mode} toggleMode={toggleMode} />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;