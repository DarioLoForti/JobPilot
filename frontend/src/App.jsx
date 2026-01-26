import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import Coach from './pages/Coach';
import JobFinder from './pages/JobFinder';
import Settings from './pages/Settings'; // <--- IMPORT NUOVO (Pagina Impostazioni)
import Navbar from './components/Navbar';
import CookieBanner from './components/CookieBanner';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
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
            
            <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-500 ${mode === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <Toaster position="top-right" toastOptions={{ style: { background: mode === 'dark' ? '#1e293b' : '#fff', color: mode === 'dark' ? '#fff' : '#333' } }} />
            
            <div className="relative z-10">
                <Navbar mode={mode} toggleMode={toggleMode} />
                
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
                    <Route path="/finder" element={<ProtectedRoute><JobFinder /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} /> {/* <--- NUOVA ROTTA */}
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <CookieBanner /> 
            </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;