
import React from 'react';
import { Home, History, User } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  rpgMode?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, rpgMode = false }) => {
  const isHomeActive = currentView === 'HOME' || currentView === 'CHAT';
  const isHistoryActive = currentView === 'HISTORY' || currentView === 'READ_HISTORY';
  const isProfileActive = currentView === 'PROFILE' || currentView === 'SETTINGS' || currentView === 'ABOUT' || currentView === 'RANKS_INFO';

  const navItemClass = (active: boolean) => 
    `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
      active
        ? (rpgMode ? 'text-white' : 'text-indigo-600')
        : (rpgMode ? 'text-slate-500' : 'text-slate-400')
    }`;

  return (
    <div className="fixed bottom-6 left-0 w-full px-8 z-50 pointer-events-none">
      <div className={`pointer-events-auto flex justify-between items-center h-[72px] max-w-xs mx-auto rounded-[36px] px-2 transition-all duration-500 backdrop-blur-2xl ${
        rpgMode 
          ? 'bg-slate-900/90 border-slate-700 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.4)]' 
          : 'bg-white/90 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]'
      }`}>
        <button className={navItemClass(isHomeActive)} onClick={() => onChangeView('HOME')}>
          <div className={`p-3 rounded-full transition-all ${
            isHomeActive 
              ? (rpgMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white shadow-md ring-1 ring-black/5') 
              : 'bg-transparent'
          }`}>
            <Home size={22} strokeWidth={isHomeActive ? 3 : 2} />
          </div>
        </button>
        
        <button className={navItemClass(isHistoryActive)} onClick={() => onChangeView('HISTORY')}>
           <div className={`p-3 rounded-full transition-all ${
             isHistoryActive 
              ? (rpgMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white shadow-md ring-1 ring-black/5') 
              : 'bg-transparent'
           }`}>
            <History size={22} strokeWidth={isHistoryActive ? 3 : 2} />
          </div>
        </button>
        
        <button className={navItemClass(isProfileActive)} onClick={() => onChangeView('PROFILE')}>
          <div className={`p-3 rounded-full transition-all ${
            isProfileActive 
              ? (rpgMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white shadow-md ring-1 ring-black/5') 
              : 'bg-transparent'
          }`}>
            <User size={22} strokeWidth={isProfileActive ? 3 : 2} />
          </div>
        </button>
      </div>
    </div>
  );
};