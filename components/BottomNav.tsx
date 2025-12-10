import React from 'react';
import { Home, History, User } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const navItemClass = (view: ViewState) => 
    `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
      currentView === view || (currentView === 'CHAT' && view === 'HOME')
        ? 'text-indigo-600' 
        : 'text-slate-400 hover:text-slate-500'
    }`;

  return (
    <div className="fixed bottom-8 left-0 w-full px-8 z-50 pointer-events-none">
      <div className="pointer-events-auto flex justify-between items-center h-[72px] max-w-xs mx-auto bg-white rounded-[28px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] px-2">
        <button 
          className={navItemClass('HOME')}
          onClick={() => onChangeView('HOME')}
        >
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'HOME' ? 'bg-indigo-50 shadow-sm' : 'bg-transparent'}`}>
            <Home size={22} strokeWidth={currentView === 'HOME' ? 2.5 : 2} />
          </div>
        </button>
        
        <button 
          className={navItemClass('HISTORY')}
          onClick={() => onChangeView('HISTORY')}
        >
           <div className={`p-3 rounded-2xl transition-all ${currentView === 'HISTORY' ? 'bg-indigo-50 shadow-sm' : 'bg-transparent'}`}>
            <History size={22} strokeWidth={currentView === 'HISTORY' ? 2.5 : 2} />
          </div>
        </button>
        
        <button 
          className={navItemClass('PROFILE')}
          onClick={() => onChangeView('PROFILE')}
        >
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'PROFILE' ? 'bg-indigo-50 shadow-sm' : 'bg-transparent'}`}>
            <User size={22} strokeWidth={currentView === 'PROFILE' ? 2.5 : 2} />
          </div>
        </button>
      </div>
    </div>
  );
};