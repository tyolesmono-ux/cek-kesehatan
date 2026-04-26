import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Spinner = ({ text = "Memproses Data..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="p-4 bg-white rounded-full shadow-lg mb-4"
      >
        <Loader2 className="w-10 h-10 text-emerald" />
      </motion.div>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white font-medium text-lg tracking-wide drop-shadow-md"
      >
        {text}
      </motion.p>
    </div>
  );
};

export default Spinner;
