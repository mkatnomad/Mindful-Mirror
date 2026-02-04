import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, X, Lightbulb, Heart, Target, Search, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { JournalEntry, JournalEntryType } from '../types';

interface JournalInterfaceProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry, isNew: boolean, durationSeconds: number) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateOrder: (entries: JournalEntry[]) => void;
  onBack: (totalDuration: number) => void;
  rpgMode?: boolean;
}

const TYPE_CONFIG: Record<JournalEntryType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
  rpgGradient: string;
  placeholder: string;
}> = {
  INSIGHT: {
    label: 'Инсайт',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    gradient: 'from-amber-50 to-orange-50',
    rpgGradient: 'from-amber-100 to-orange-100',
    placeholder: 'Какая искра озарила ваш разум?'
  },
  GRATITUDE: {
    label: 'Благодарность',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    gradient: 'from-rose-50 to-pink-50',
    rpgGradient: 'from-rose-100 to-pink-100',
    placeholder: 'За какие дары судьбы вы благодарны?'
  },
  INTENTION: {
    label: 'Намерение',
    icon: Target,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    gradient: 'from-indigo-50 to-blue-50',
    rpgGradient: 'from-red-100 to-red-200',
    placeholder: 'Какое действие вы готовы совершить?'
  }
};

const JournalCard: React.FC<{ 
  entry: JournalEntry; 
  onEdit: (entry: JournalEntry) => void; 
  onDelete: (id: string) => void;
  rpgMode?: boolean;
}> = ({ 
  entry, 
  onEdit,
  onDelete,
  rpgMode = false
}) => {
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG['INSIGHT'];
  const Icon = config.icon;
  const dragControls = useDragControls();
  
  const [isLongPressed, setIsLongPressed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number, y: number } | null>(null);
  const isDraggingActive = useRef(false);

  const previewText = entry.content.length > 80 
    ? entry.content.slice(0, 80) + '...' 
    : entry.content;

  const handlePointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('.delete-btn')) return;

    startPosRef.current = { x: event.clientX, y: event.clientY };
    isDraggingActive.current = false;
    
    timerRef.current = window.setTimeout(() => {
      setIsLongPressed(true);
      isDraggingActive.current = true;
      
      const tg = window.Telegram?.WebApp;
      if (tg) {
        if (tg.isVersionAtLeast?.('6.1') && tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }
        tg.HapticFeedback?.impactOccurred('medium');
      }

      dragControls.start(event);
    }, 450);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingActive.current) return;

    const dx = Math.abs(event.clientX - startPosRef.current.x);
    const dy = Math.abs(event.clientY - startPosRef.current.y);

    if (dx > 10 || dy > 10) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const tg = window.Telegram?.WebApp;
    if (tg && tg.isVersionAtLeast?.('6.1') && tg.enableVerticalSwipes) {
      tg.enableVerticalSwipes();
    }

    setIsLongPressed(false);
    startPosRef.current = null;
    
    setTimeout(() => {
      isDraggingActive.current = false;
    }, 100);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDraggingActive.current || isLongPressed) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onEdit(entry);
  };

  return (
    <Reorder.Item
      value={entry}
      id={entry.id}
      dragListener={false}
      dragControls={dragControls}
      style={{ 
        borderRadius: '24px',
        touchAction: isLongPressed ? 'none' : 'pan-y',
        position: 'relative',
        zIndex: isLongPressed ? 1000 : 1
      }}
      whileDrag={{ 
        scale: 1.05, 
        zIndex: 1000,
        boxShadow: rpgMode ? "0px 25px 50px -12px rgba(185,28,28,0.4)" : "0px 25px 50px -12px rgba(0,0,0,0.25)"
      }}
      className="relative mb-4 bg-transparent select-none outline-none"
    >
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`
           relative rounded-[24px] p-5 transition-all duration-300 transform-gpu border
           ${rpgMode 
             ? `rpg-card bg-white/60` 
             : `bg-gradient-to-br ${config.gradient} bento-border shadow-sm shadow-slate-200/50`}
           ${isLongPressed ? 'ring-2 ring-red-500/50 scale-[1.03] shadow-2xl z-[1000]' : 'active:scale-[0.98]'}
        `}
      >
        <AnimatePresence>
          {isLongPressed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -left-2 -right-2 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none z-20"
            >
              <motion.div 
                animate={{ x: [-2, 2, -2] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="bg-red-800 text-white rounded-full p-1 shadow-lg"
              >
                <div className="p-1"><ChevronLeft size={16} strokeWidth={3} /></div>
              </motion.div>
              <motion.div 
                animate={{ x: [2, -2, 2] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="bg-red-800 text-white rounded-full p-1 shadow-lg"
              >
                <div className="p-1"><ChevronRight size={16} strokeWidth={3} /></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-2 pointer-events-none">
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full shadow-sm border ${
              rpgMode ? 'bg-red-800 text-white border-red-950' : 'bg-white/60 backdrop-blur-md border-slate-300 shadow-sm'
            }`}>
              <Icon size={12} className={rpgMode ? 'text-white' : config.color} strokeWidth={2.5} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${rpgMode ? 'text-white' : config.color}`}>{config.label}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${rpgMode ? 'text-red-900/60 font-display-fantasy' : 'text-slate-500 font-bold'}`}>
                  {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  className="delete-btn pointer-events-auto w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
            </div>
        </div>
        <p className={`text-[14px] leading-relaxed font-bold pointer-events-none ${
          rpgMode ? 'text-red-950' : 'text-slate-700'
        }`}>
          {previewText}
        </p>
      </div>
    </Reorder.Item>
  );
};

export const JournalInterface: React.FC<JournalInterfaceProps> = ({ entries, onSaveEntry, onDeleteEntry, onUpdateOrder, onBack, rpgMode = false }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<JournalEntryType>('INSIGHT');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<JournalEntryType | 'ALL'>('ALL');
  
  const [activeSeconds, setActiveSeconds] = useState(0);
  const editorStartTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    const tick = () => {
      if (!document.hidden) {
        const now = Date.now();
        const delta = Math.round((now - lastTickRef.current) / 1000);
        if (delta > 0 && delta < 10) {
          setActiveSeconds(prev => prev + delta);
        }
        lastTickRef.current = now;
      } else {
        lastTickRef.current = Date.now();
      }
    };

    const interval = setInterval(tick, 1000);
    const handleVisibilityChange = () => {
      if (!document.hidden) lastTickRef.current = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'ALL' || entry.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [entries, searchQuery, activeFilter]);

  const openNewEntry = () => {
    setEditingId(null);
    setSelectedType('INSIGHT');
    setContent('');
    editorStartTimeRef.current = Date.now();
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;
    const isNew = editingId === null;
    const duration = Math.round((Date.now() - editorStartTimeRef.current) / 1000);
    const entry: JournalEntry = {
      id: editingId || Date.now().toString(),
      date: isNew ? Date.now() : (entries.find(e => e.id === editingId)?.date || Date.now()),
      type: selectedType,
      content: content.trim()
    };
    onSaveEntry(entry, isNew, duration);
    setIsEditorOpen(false);
  };

  const renderEditor = () => (
    <div className={`absolute inset-0 z-[100] flex flex-col animate-fade-in transition-all duration-500 ${
      rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white'
    }`}>
      <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 transition-all duration-500 ${
        rpgMode ? 'bg-white/50 border-red-800/20' : 'bg-white/80 border-slate-200'
      }`}>
        <button onClick={() => setIsEditorOpen(false)} className={`p-2 -ml-2 rounded-full transition-colors ${
          rpgMode ? 'text-red-800 hover:bg-red-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
        }`}>
          <X size={24} />
        </button>
        <span className={`font-black uppercase tracking-tighter ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
          {editingId ? (rpgMode ? 'Правка свитков' : 'Редактировать') : (rpgMode ? 'Новое заклятие' : 'Новая запись')}
        </span>
        <button 
          onClick={handleSave} 
          disabled={!content.trim()} 
          className={`font-black uppercase tracking-widest text-xs transition-colors ${
            content.trim() 
              ? (rpgMode ? 'text-red-800 font-display-fantasy' : 'text-indigo-600') 
              : 'text-slate-300'
          }`}
        >
          {rpgMode ? 'Запечатлеть' : 'Готово'}
        </button>
      </div>

      <div className={`flex p-4 space-x-2 border-b overflow-x-auto no-scrollbar transition-all duration-500 ${
        rpgMode ? 'bg-white/20 border-red-800/10' : 'bg-slate-50/50 border-slate-200'
      }`}>
        {(Object.keys(TYPE_CONFIG) as JournalEntryType[]).map((type) => {
          const config = TYPE_CONFIG[type];
          const isSelected = selectedType === type;
          const Icon = config.icon;
          return (
            <button 
              key={type} 
              onClick={() => setSelectedType(type)} 
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all min-w-[120px]
                ${isSelected 
                  ? (rpgMode ? 'rpg-button font-display-fantasy shadow-none' : 'bg-slate-900 text-white shadow-md ring-1 ring-black/5') 
                  : (rpgMode ? 'text-red-800/50 hover:bg-red-800/10' : 'text-slate-500 hover:bg-white/50')}
              `}
            >
              <Icon size={16} strokeWidth={isSelected ? 3 : 2} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-6">
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder={TYPE_CONFIG[selectedType].placeholder} 
          className={`w-full h-full resize-none text-lg focus:outline-none leading-relaxed transition-all duration-500 ${
            rpgMode ? 'bg-transparent text-red-950 placeholder:text-red-900/30' : 'bg-transparent text-slate-800 placeholder:text-slate-400'
          }`} 
          autoFocus 
        />
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full relative overflow-hidden transition-all duration-500 ${
      rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-transparent'
    }`}>
      {isEditorOpen && renderEditor()}

      <div className={`sticky top-0 z-20 px-6 py-4 transition-all duration-500 ${
        rpgMode ? 'bg-white/50 border-b border-red-800/20' : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <button onClick={() => onBack(activeSeconds)} className={`p-2 -ml-2 rounded-full ${rpgMode ? 'text-red-950' : 'text-white'}`}>
                  <ArrowLeft size={20} />
                </button>
                <h2 className={`ml-2 text-xl font-black uppercase tracking-tighter ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-white shadow-sm'}`}>
                  {rpgMode ? 'Свитки мудрости' : 'Дневник'}
                </h2>
            </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
           <div className="relative flex-1">
             <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${rpgMode ? 'text-red-800/50' : 'text-white/60'}`} />
             <input 
               type="text" 
               placeholder={rpgMode ? "Искать в летописи..." : "Поиск..."}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className={`w-full border rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none transition-all ${
                 rpgMode 
                   ? 'bg-white/60 border-red-800/20 text-red-950 placeholder:text-red-900/20 focus:border-red-800' 
                   : 'bg-white/10 bento-border border-white/40 text-white placeholder:text-white/60 focus:bg-white/20'
               }`}
             />
           </div>
           <div className="flex space-x-1 overflow-x-auto no-scrollbar max-w-[140px] bg-white/10 rounded-xl p-1 border border-white/10 shadow-sm">
              {(['INSIGHT', 'GRATITUDE', 'INTENTION'] as JournalEntryType[]).map(type => (
                <button 
                  key={type}
                  onClick={() => setActiveFilter(activeFilter === type ? 'ALL' : type)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                    activeFilter === type 
                      ? (rpgMode ? 'bg-red-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm') 
                      : (rpgMode ? 'bg-white/40 text-red-800/50 border border-red-800/10' : 'text-white/40')
                  }`}
                >
                  {React.createElement(TYPE_CONFIG[type].icon, { size: 14, strokeWidth: activeFilter === type ? 2.5 : 2 })}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="flex-1 p-5 pb-24 overflow-y-auto scroll-smooth">
        {filteredEntries.length > 0 ? (
          <Reorder.Group 
            axis="y" 
            values={filteredEntries} 
            onReorder={onUpdateOrder} 
            className="flex flex-col"
          >
             {filteredEntries.map((entry) => (
               <JournalCard 
                 key={entry.id} 
                 entry={entry} 
                 rpgMode={rpgMode}
                 onEdit={(e) => {
                    setEditingId(e.id);
                    setSelectedType(e.type);
                    setContent(e.content);
                    editorStartTimeRef.current = Date.now();
                    setIsEditorOpen(true);
                 }}
                 onDelete={onDeleteEntry}
               />
             ))}
          </Reorder.Group>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-4">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${rpgMode ? 'bg-white/40 text-red-800/30' : 'bg-white/10 text-white'}`}>
                <Sparkles size={32} />
             </div>
             <p className={`text-sm font-bold uppercase tracking-widest ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-white'}`}>
               {rpgMode ? 'Тишина в залах' : 'Ничего не найдено'}
             </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 right-6 z-30">
        <button 
          onClick={openNewEntry} 
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${
            rpgMode 
              ? 'rpg-button shadow-red-900/40' 
              : 'bg-white text-indigo-600 shadow-lg shadow-white/10'
          }`}
        >
          {rpgMode ? <Sparkles size={28} /> : <Plus size={28} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
};