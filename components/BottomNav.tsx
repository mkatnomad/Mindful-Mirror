
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
        ? (rpgMode ? 'text-red-900' : 'text-indigo-600')
        : (rpgMode ? 'text-red-800/40' : 'text-slate-400')
    }`;

  return (
    <div className="fixed bottom-8 left-0 w-full px-8 z-50 pointer-events-none">
      <div className={`pointer-events-auto flex justify-between items-center h-[72px] max-w-xs mx-auto border rounded-[28px] px-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] transition-all duration-500 ${
        rpgMode 
          ? 'bg-[#fffdfa] border-red-800/50 shadow-[4px_4px_0px_#b91c1c]' 
          : 'bg-white border-white'
      }`}>
        <button className={navItemClass(isHomeActive)} onClick={() => onChangeView('HOME')}>
          <div className={`p-3 rounded-2xl transition-all ${
            isHomeActive 
              ? (rpgMode ? 'bg-red-800 text-white shadow-md' : 'bg-indigo-50 shadow-sm') 
              : 'bg-transparent'
          }`}>
            <Home size={22} strokeWidth={isHomeActive ? 2.5 : 2} />
          </div>
        </button>
        
        <button className={navItemClass(isHistoryActive)} onClick={() => onChangeView('HISTORY')}>
           <div className={`p-3 rounded-2xl transition-all ${
             isHistoryActive 
              ? (rpgMode ? 'bg-red-800 text-white shadow-md' : 'bg-indigo-50 shadow-sm') 
              : 'bg-transparent'
           }`}>
            <History size={22} strokeWidth={isHistoryActive ? 2.5 : 2} />
          </div>
        </button>
        
        <button className={navItemClass(isProfileActive)} onClick={() => onChangeView('PROFILE')}>
          <div className={`p-3 rounded-2xl transition-all ${
            isProfileActive 
              ? (rpgMode ? 'bg-red-800 text-white shadow-md' : 'bg-indigo-50 shadow-sm') 
              : 'bg-transparent'
          }`}>
            <User size={22} strokeWidth={isProfileActive ? 2.5 : 2} />
          </div>
        </button>
      </div>
    </div>
  );
};
