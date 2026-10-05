import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all border outline-none cursor-pointer select-none
        ${isDark 
          ? 'bg-[#161616] hover:bg-[#222222] border-white/10 text-amber-400 hover:border-white/20' 
          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
        } ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Moon size={18} className="text-amber-400 fill-amber-400/20" />
            {showLabel && <span className="text-xs font-semibold text-gray-200">Dark</span>}
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0.5, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Sun size={18} className="text-amber-500 fill-amber-500/20" />
            {showLabel && <span className="text-xs font-semibold text-slate-700">Light</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
