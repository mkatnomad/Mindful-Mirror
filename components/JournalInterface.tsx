
import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Plus, X, Lightbulb, Heart, Target, Search, Trash2 } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
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

      // Начинаем перетаскивание
      dragControls.start(event);
    }, 450);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingActive.current) return;

    const dx = Math.abs(event.clientX - startPosRef.current.x);
    const dy = Math.abs(event.clientY - startPosRef.current.y);

    // Если палец сдвинулся больше чем на 5px до срабатывания таймера — это скролл
    if (dx > 5 || dy > 5) {
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
    
    // Сбрасываем флаг перетаскивания с задержкой, чтобы не сработал клик
    setTimeout(() => {
      isDraggingActive.current = false;
    }, 100);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDraggingActive.current) {
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
        // 'pan-y' разрешает системный скролл по вертикали
        touchAction: isLongPressed ? 'none' : 'pan-y'
      }}
      whileDrag={{ 
        scale: 1.05, 
        zIndex: 999, // Всегда поверх всех
        boxShadow: "0px 20px 40px rgba(0,0,0,0.15)"
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
           transition-all duration-200
           ${isLongPressed ? 'ring-2 ring-indigo-500 scale-[1.02] shadow-lg' : ''}
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

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      {isEditorOpen && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fade-in">
           <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <button onClick={() => setIsEditorOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            <span className="font-bold text-slate-800">Запись</span>
            <button onClick={handleSave} className="text-indigo-600 font-bold">Ок</button>
          </div>
          <div className="flex-1 p-6">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-full resize-none text-lg outline-none" autoFocus />
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20 px-6 py-4">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500"><ArrowLeft size={20} /></button>
            <h2 className="ml-2 text-xl font-bold text-slate-800">Дневник</h2>
        </div>
        <div className="mt-4">
           <input 
             type="text" 
             placeholder="Поиск..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-sm focus:outline-none"
           />
        </div>
      </div>

      <div className="flex-1 p-5 pb-24 overflow-y-auto">
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
          <div className="h-full flex items-center justify-center opacity-40">Пусто</div>
        )}
      </div>

      <div className="absolute bottom-8 right-6 z-30">
        <button onClick={openNewEntry} className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform">
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
