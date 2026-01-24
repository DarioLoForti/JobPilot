import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Navbar from './components/Navbar'; // <--- Importiamo il componente

function App() {
  return (
    <BrowserRouter>
      {/* La Navbar va QUI, dentro il Router ma fuori dalle Routes */}
      {/* Così rimane fissa mentre le pagine sotto cambiano */}
      <Navbar /> 
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;