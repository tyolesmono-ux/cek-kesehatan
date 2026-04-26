import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginModal = ({ onLoginSuccess, isLoading }) => {
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password || isLoading) return;
    onLoginSuccess(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald" />
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald/10 rounded-full">
            <Lock className="w-8 h-8 text-emerald" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Akses Terbatas</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Masukkan password untuk melihat dashboard pimpinan.</p>
        
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan Password"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all outline-none bg-gray-50/50 hover:bg-white mb-6 text-center tracking-widest disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-emerald hover:bg-[#3fb866] text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald/30 disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Masuk Dashboard"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginModal;
