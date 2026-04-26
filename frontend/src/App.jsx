import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import FormCekKesehatan from './components/FormCekKesehatan';
import Spinner from './components/Spinner';
import Dashboard from './pages/Dashboard';
import { HeartPulse, LayoutDashboard, ClipboardEdit } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-ash-grey selection:bg-emerald/30 font-sans flex flex-col">
      {/* Background Ornaments */}
      {!isDashboard && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-emerald/5 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-[#50C878]/5 blur-3xl" />
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald" />
            <span className="font-bold text-gray-800 tracking-tight hidden sm:inline">CekKesehatan<span className="text-emerald">.CPNS</span></span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Link 
              to="/" 
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-medium transition-all ${
                !isDashboard ? 'bg-emerald text-white shadow-md shadow-emerald/20' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <ClipboardEdit className="w-4 h-4" /> <span>Isi Form</span>
            </Link>
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-medium transition-all ${
                isDashboard ? 'bg-emerald text-white shadow-md shadow-emerald/20' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

const FormPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-emerald/10 mb-4">
            <HeartPulse className="w-8 h-8 text-emerald" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Monitoring Kesehatan
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Pendataan Pemeriksaan Kesehatan CPNS Kota Surakarta
          </p>
        </div>

        <FormCekKesehatan setIsLoading={setIsLoading} />
        
        <p className="text-center text-xs text-gray-400 mt-8 font-medium tracking-wide">
          © {new Date().getFullYear()} Pemerintah Kota Surakarta
        </p>
      </div>

      {isLoading && <Spinner text="Menyimpan Data..." />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
