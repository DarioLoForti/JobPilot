import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function Navbar({ mode, toggleMode }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const token = localStorage.getItem('token');
  
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    console.error("Errore parsing user navbar", e);
  }

  const [isOpen, setIsOpen] = useState(false);

  const hideOnPaths = ['/', '/login', '/register'];
  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsOpen(false);
    navigate('/');
  };

  const handleNav = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const navLink = "text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer";
  const mobileLink = "block w-full text-left px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg";
  const btnPrimary = "bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 transition-transform active:scale-95";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleNav(token ? (user?.is_admin ? '/admin' : '/dashboard') : '/')}>
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
              JobPilot {user?.is_admin && <span className="text-xs text-red-500 ml-1 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">ADMIN</span>}
            </span>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={toggleMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
              {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </button>

            {token ? (
                <>
                    {/* 🔥 LOGICA SEPARATA: ADMIN vs UTENTE NORMALE */}
                    {user?.is_admin ? (
                        /* MENU SOLO PER ADMIN */
                        <>
                           <button 
                                onClick={() => handleNav('/admin')} 
                                className={`${navLink} text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg`}
                            >
                                <AdminPanelSettingsIcon fontSize="small"/> Pannello di Controllo
                            </button>
                        </>
                    ) : (
                        /* MENU UTENTE CLASSICO */
                        <>
                            <button onClick={() => handleNav('/dashboard')} className={navLink}>Dashboard</button>
                            <button onClick={() => handleNav('/jobs')} className={navLink}>Jobs</button>
                            <button onClick={() => handleNav('/finder')} className={`${navLink} flex items-center gap-1 text-blue-600 dark:text-cyan-400`}>
                                <SearchIcon fontSize="small"/> Cerca
                            </button>
                            <button onClick={() => handleNav('/coach')} className={navLink}>Coach</button>
                            <button onClick={() => handleNav('/profile')} className={navLink}>Profilo</button>
                            <button onClick={() => handleNav('/settings')} className={navLink}>Impostazioni</button>
                        </>
                    )}
                    
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
                    <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Esci</button>
                </>
            ) : (
                <>
                    <button onClick={() => handleNav('/login')} className={navLink}>Accedi</button>
                    <button onClick={() => handleNav('/register')} className={btnPrimary}>Inizia Gratis</button>
                </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleMode} className="p-2 text-slate-600 dark:text-slate-400">
                {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-700 dark:text-slate-200">
              {isOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] absolute w-full left-0 px-4 py-4 shadow-xl flex flex-col gap-2">
            {token ? (
                <>
                   {user?.is_admin ? (
                        /* MOBILE ADMIN */
                        <button onClick={() => handleNav('/admin')} className={`${mobileLink} bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-200`}>
                            🛡️ SuperAdmin Control
                        </button>
                   ) : (
                        /* MOBILE USER */
                        <>
                            <button onClick={() => handleNav('/dashboard')} className={mobileLink}>📊 Dashboard</button>
                            <button onClick={() => handleNav('/jobs')} className={mobileLink}>📋 Jobs</button>
                            <button onClick={() => handleNav('/finder')} className={`${mobileLink} bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300`}>🔍 Cerca con AI</button>
                            <button onClick={() => handleNav('/coach')} className={mobileLink}>🧠 Coach</button>
                            <button onClick={() => handleNav('/profile')} className={mobileLink}>👤 Profilo</button>
                            <button onClick={() => handleNav('/settings')} className={mobileLink}>⚙️ Impostazioni</button>
                        </>
                   )}
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                    <button onClick={handleLogout} className={`${mobileLink} text-red-600 dark:text-red-400`}>🚪 Logout</button>
                </>
            ) : (
                <>
                    <button onClick={() => handleNav('/login')} className={mobileLink}>Accedi</button>
                    <button onClick={() => handleNav('/register')} className="w-full mt-2 bg-blue-600 text-white py-3 rounded-lg font-bold">Inizia Gratis</button>
                </>
            )}
        </div>
      )}
    </nav>
  );
}