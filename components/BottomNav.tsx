
import React from 'react';
import { Home, History, User } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const isHomeActive = currentView === 'HOME' || currentView === 'CHAT';
  const isHistoryActive = currentView === 'HISTORY' || currentView === 'READ_HISTORY';
  const isProfileActive = currentView === 'PROFILE' || currentView === 'SETTINGS' || currentView === 'ABOUT' || currentView === 'RANKS_INFO';

  const navItemClass = (active: boolean) => 
    `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
      active
        ? 'text-indigo-600' 
        : 'text-slate-400 hover:text-slate-500'
    }`;

  return (
    <div className="fixed bottom-8 left-0 w-full px-8 z-50 pointer-events-none">
      <div className="pointer-events-auto flex justify-between items-center h-[72px] max-w-xs mx-auto bg-white border-white rounded-[28px] border shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] px-2">
        <button className={navItemClass(isHomeActive)} onClick={() => onChangeView('HOME')}>
          <div className={`p-3 rounded-2xl transition-all ${isHomeActive ? 'bg-indigo-50 shadow-sm' : 'bg-transparent'}`}>
            <Home size={22} strokeWidth={isHomeActive ? 2.5 : 2} />
          </div>
        </button>
        
        <button className={navItemClass(isHistoryActive)} onClick={() => onChangeView('HISTORY')}>
           <div className={`p-3 rounded-2xl transition-all ${isHistoryActive ? 'bg-indigo-50 shadow-sm' : 'bg-transparent'}`}>
            <History size={22} strokeWidth={isHistoryActive ? 2.5 : 2} />
          </div>
        </button>
        
        <button className={navItemClass(isProfileActive)} onClick={() => onChangeView('PROFILE')}>
          <div className={`p-3 rounded-2xl transition-all ${isProfileActive ? 'bg-indigo-50 shadow-sm' : 'bg-transparent'}`}>
            <User size={22} strokeWidth={isProfileActive ? 2.5 : 2} />
          </div>
        </button>
      </div>
    </div>
  );
};
