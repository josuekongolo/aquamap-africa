import { HashRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import Knowledge from './pages/Knowledge';
import Suppliers from './pages/Suppliers';
import Admin from './pages/Admin';

export default function App() {
  return (
    <LangProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </LangProvider>
  );
}
