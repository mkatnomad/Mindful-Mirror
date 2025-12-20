import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Plus, X, Lightbulb, Heart, Target, Search, Trash2 } from 'lucide-react';
import { Reorder, useDragControls, motion } from 'framer-motion';
import { JournalEntry, JournalEntryType } from '../types';

interface JournalInterfaceProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry, isNew: boolean, durationSeconds: number) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateOrder: (entries: JournalEntry[]) => void;
  onBack: () => void;
}

const TYPE_CONFIG: Record<JournalEntryType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
  placeholder: string;
}> = {
  INSIGHT: {
    label: 'Инсайт',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    gradient: 'from-amber-50 to-orange-50',
    placeholder: 'Какая идея пришла к вам? Что вы осознали?'
  },
  GRATITUDE: {
    label: 'Благодарность',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    gradient: 'from-rose-50 to-pink-50',
    placeholder: 'За что вы благодарны? Кому вы хотите сказать спасибо?'
  },
  INTENTION: {
    label: 'Намерение',
    icon: Target,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    gradient: 'from-indigo-50 to-blue-50',
    placeholder: 'Какое действие вы хотите совершить? Как вы примените свои знания?'
  }
};

const JournalCard: React.FC<{ 
  entry: JournalEntry; 
  onEdit: (entry: JournalEntry) => void; 
  onDelete: (id: string) => void;
}> = ({ 
  entry, 
  onEdit,
  onDelete
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
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.disableVerticalSwipes?.();
        window.Telegram.WebApp.HapticFeedback?.impactOccurred('medium');
      }

      // Начинаем перетаскивание мгновенно
      dragControls.start(event);
    }, 400); // Оптимальное время для Mini App
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingActive.current) return;

    const dx = Math.abs(event.clientX - startPosRef.current.x);
    const dy = Math.abs(event.clientY - startPosRef.current.y);

    // Если палец сдвинулся больше чем на 10px до срабатывания таймера — это скролл
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
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.enableVerticalSwipes?.();
    }

    setIsLongPressed(false);
    startPosRef.current = null;
    
    // Сброс флага с задержкой
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
        boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)"
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
           relative rounded-[24px] p-5 bg-gradient-to-br ${config.gradient} 
           border border-white/70 shadow-sm
           transition-all duration-300 transform-gpu
           ${isLongPressed ? 'ring-2 ring-indigo-500/50 scale-[1.03] shadow-2xl z-[1000]' : 'active:scale-[0.98]'}
        `}
      >
        <div className="flex items-center justify-between mb-2 pointer-events-none">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/50">
              <Icon size={12} className={config.color} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-semibold opacity-70">
                  {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  className="delete-btn pointer-events-auto w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
            </div>
        </div>
        <p className="text-slate-700 text-[14px] leading-relaxed font-medium pointer-events-none">
          {previewText}
        </p>
      </div>
    </Reorder.Item>
  );
};

export const JournalInterface: React.FC<JournalInterfaceProps> = ({ entries, onSaveEntry, onDeleteEntry, onUpdateOrder, onBack }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<JournalEntryType>('INSIGHT');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<JournalEntryType | 'ALL'>('ALL');
  
  const startTimeRef = useRef<number>(0);

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
    startTimeRef.current = Date.now();
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;
    const isNew = editingId === null;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
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
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-fade-in">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => setIsEditorOpen(false)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
          <X size={24} />
        </button>
        <span className="font-bold text-slate-800">{editingId ? 'Редактировать' : 'Новая запись'}</span>
        <button 
          onClick={handleSave} 
          disabled={!content.trim()} 
          className={`font-bold text-sm transition-colors ${content.trim() ? 'text-indigo-600' : 'text-slate-300'}`}
        >
          Готово
        </button>
      </div>

      {/* Category Selector */}
      <div className="flex p-4 space-x-2 bg-slate-50/50 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {(Object.keys(TYPE_CONFIG) as JournalEntryType[]).map((type) => {
          const config = TYPE_CONFIG[type];
          const isSelected = selectedType === type;
          const Icon = config.icon;
          return (
            <button 
              key={type} 
              onClick={() => setSelectedType(type)} 
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all min-w-[120px]
                ${isSelected ? 'bg-white shadow-md text-slate-800 ring-1 ring-black/5' : 'text-slate-400 hover:bg-white/50'}
              `}
            >
              <Icon size={16} className={isSelected ? config.color : ''} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex-1 p-6">
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder={TYPE_CONFIG[selectedType].placeholder} 
          className="w-full h-full resize-none text-lg text-slate-700 placeholder:text-slate-300 focus:outline-none leading-relaxed" 
          autoFocus 
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      {isEditorOpen && renderEditor()}

      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20 px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="ml-2 text-xl font-bold text-slate-800 tracking-tight">Дневник</h2>
            </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
           <div className="relative flex-1">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Поиск по заметкам..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:bg-white transition-all"
             />
           </div>
           <div className="flex space-x-1 overflow-x-auto no-scrollbar max-w-[140px]">
              <button 
                onClick={() => setActiveFilter(activeFilter === 'INSIGHT' ? 'ALL' : 'INSIGHT')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeFilter === 'INSIGHT' ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}
              >
                <Lightbulb size={14} />
              </button>
              <button 
                onClick={() => setActiveFilter(activeFilter === 'GRATITUDE' ? 'ALL' : 'GRATITUDE')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeFilter === 'GRATITUDE' ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}
              >
                <Heart size={14} />
              </button>
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
                 onEdit={(e) => {
                    setEditingId(e.id);
                    setSelectedType(e.type);
                    setContent(e.content);
                    startTimeRef.current = Date.now();
                    setIsEditorOpen(true);
                 }}
                 onDelete={onDeleteEntry}
               />
             ))}
          </Reorder.Group>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-4">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <Search size={32} />
             </div>
             <p className="text-sm font-medium">Ничего не найдено</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 right-6 z-30">
        <button 
          onClick={openNewEntry} 
          className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
