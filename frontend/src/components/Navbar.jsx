import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export default function Navbar({ mode, toggleMode }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isOpen, setIsOpen] = useState(false); // Stato per il menu mobile

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsOpen(false);
    navigate('/');
  };

  const handleNav = (path) => {
    setIsOpen(false); // Chiude il menu dopo il click
    navigate(path);
  };

  // Classi CSS riutilizzabili
  const navLink = "text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer";
  const mobileLink = "block w-full text-left px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg";
  const btnPrimary = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/30 transition-transform active:scale-95";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LOGO */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav(token ? '/dashboard' : '/')}>
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
              JobPilot
            </span>
          </div>

          {/* MENU DESKTOP (Nascosto su Mobile) */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={toggleMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
                {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </button>

            {token ? (
                <>
                    <button onClick={() => handleNav('/dashboard')} className={navLink}>Dashboard</button>
                    <button onClick={() => handleNav('/jobs')} className={navLink}>Jobs</button>
                    {/* ✨ NUOVO LINK COACH */}
                    <button onClick={() => handleNav('/coach')} className={navLink}>AI Coach</button>
                    <button onClick={() => handleNav('/profile')} className={navLink}>Profilo</button>
                    
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
                    <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-500">Logout</button>
                </>
            ) : (
                <>
                    <button onClick={() => handleNav('/login')} className={navLink}>Accedi</button>
                    <button onClick={() => handleNav('/register')} className={btnPrimary}>Inizia Gratis</button>
                </>
            )}
          </div>

          {/* BOTTONE HAMBURGER (Visibile solo su Mobile) */}
          <div className="md:hidden flex items-center gap-4">
             {/* Dark Mode anche su mobile */}
            <button onClick={toggleMode} className="p-2 text-slate-600 dark:text-slate-400">
                {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </button>
            
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-700 dark:text-slate-200 focus:outline-none">
              {isOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* MENU MOBILE A TENDINA */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 absolute w-full left-0 px-4 py-4 shadow-xl flex flex-col gap-2">
            {token ? (
                <>
                    <button onClick={() => handleNav('/dashboard')} className={mobileLink}>📊 Dashboard</button>
                    <button onClick={() => handleNav('/jobs')} className={mobileLink}>📋 Jobs</button>
                    {/* ✨ NUOVO LINK COACH MOBILE */}
                    <button onClick={() => handleNav('/coach')} className={mobileLink}>🧠 AI Coach</button>
                    <button onClick={() => handleNav('/profile')} className={mobileLink}>👤 Profilo</button>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                    <button onClick={handleLogout} className={`${mobileLink} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}>🚪 Logout</button>
                </>
            ) : (
                <>
                    <button onClick={() => handleNav('/login')} className={mobileLink}>Accedi</button>
                    <button onClick={() => handleNav('/register')} className="w-full mt-2 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Inizia Gratis 🚀</button>
                </>
            )}
        </div>
      )}
    </nav>
  );
}