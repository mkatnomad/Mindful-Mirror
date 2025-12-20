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
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);

  const previewText = entry.content.length > 80 
    ? entry.content.slice(0, 80) + '...' 
    : entry.content;

  const handlePointerDown = (event: React.PointerEvent) => {
    // Ignore if clicking delete button
    if ((event.target as HTMLElement).closest('.delete-btn')) return;

    timerRef.current = window.setTimeout(() => {
      setIsLongPressed(true);
      setIsDraggingActive(true);
      dragStartedRef.current = true;
      dragControls.start(event);
      
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    }, 200); // Set to 200ms (0.2 seconds) as requested
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Small delay to ensure click handler knows it was a drag
    setTimeout(() => {
      setIsLongPressed(false);
      setIsDraggingActive(false);
      dragStartedRef.current = false;
    }, 150);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening editor if we were just dragging or about to drag
    if (dragStartedRef.current || isDraggingActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onEdit(entry);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const confirmText = 'Вы уверены, что хотите удалить эту заметку?';
    const webApp = window.Telegram?.WebApp;
    
    // Version 6.2+ supports showConfirm. Version 6.0+ supports showPopup. 
    // If neither or old version, use native confirm.
    if (webApp && webApp.isVersionAtLeast && webApp.isVersionAtLeast('6.2')) {
      webApp.showConfirm(confirmText, (confirmed: boolean) => {
        if (confirmed) onDelete(entry.id);
      });
    } else if (webApp && webApp.showPopup && webApp.isVersionAtLeast && webApp.isVersionAtLeast('6.0')) {
        webApp.showPopup({
            title: 'Удаление',
            message: confirmText,
            buttons: [
                { id: 'delete', type: 'destructive', text: 'Удалить' },
                { id: 'cancel', type: 'cancel', text: 'Отмена' }
            ]
        }, (buttonId: string) => {
            if (buttonId === 'delete') onDelete(entry.id);
        });
    } else {
      if (window.confirm(confirmText)) {
        onDelete(entry.id);
      }
    }
  };

  return (
    <Reorder.Item
      value={entry}
      id={entry.id}
      dragListener={false}
      dragControls={dragControls}
      style={{ borderRadius: '24px' }}
      whileDrag={{ 
        scale: 1.04, 
        boxShadow: "0px 25px 50px -12px rgba(99, 102, 241, 0.5)",
        zIndex: 50 
      }}
      className="relative mb-4 bg-transparent select-none touch-none"
    >
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
        className={`
           relative rounded-[24px] p-5 bg-gradient-to-br ${config.gradient} 
           border border-white/70 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] 
           transition-all duration-300 group
           ${isLongPressed ? 'ring-2 ring-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.4)] scale-[1.02]' : 'hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)]'}
        `}
      >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/50">
              <Icon size={12} className={config.color} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
            </div>
            
            <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-semibold opacity-70">
                  {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                
                <button 
                  onClick={handleDelete}
                  className="delete-btn w-10 h-10 -mr-2 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors rounded-full hover:bg-white/40 active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
            </div>
        </div>
        <p className="text-slate-700 text-[14px] leading-relaxed font-medium break-words">
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

  const openEditEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setSelectedType(entry.type);
    setContent(entry.content);
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
    setContent('');
    setEditingId(null);
    setIsEditorOpen(false);
  };

  const renderEditor = () => (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={() => setIsEditorOpen(false)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
          <X size={24} />
        </button>
        <span className="font-bold text-slate-800">{editingId ? 'Редактировать' : 'Новая запись'}</span>
        <button onClick={handleSave} disabled={!content.trim()} className="text-indigo-600 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          Сохранить
        </button>
      </div>

      <div className="flex p-4 space-x-2 bg-slate-50/50 overflow-x-auto no-scrollbar">
        {(Object.keys(TYPE_CONFIG) as JournalEntryType[]).map((type) => {
          const config = TYPE_CONFIG[type];
          const isSelected = selectedType === type;
          const Icon = config.icon;
          return (
            <button key={type} onClick={() => setSelectedType(type)} className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all min-w-[100px] ${isSelected ? 'bg-white shadow-md text-slate-800 ring-1 ring-black/5' : 'text-slate-400 hover:bg-white/50'}`}>
              <Icon size={16} className={isSelected ? config.color : ''} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-6">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={TYPE_CONFIG[selectedType].placeholder} className="w-full h-full resize-none text-lg text-slate-700 placeholder:text-slate-300 focus:outline-none leading-relaxed" autoFocus />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      {isEditorOpen && renderEditor()}

      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100">
                <ArrowLeft size={20} />
                </button>
                <h2 className="ml-2 text-xl font-bold text-slate-800 tracking-tight">Моё Пространство</h2>
            </div>
        </div>

        <div className="px-6 pb-4 space-y-4">
          <div className="relative">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Поиск по заметкам..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all"
             />
          </div>

          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
             <button 
               onClick={() => setActiveFilter('ALL')}
               className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
             >
               Все
             </button>
             {(Object.keys(TYPE_CONFIG) as JournalEntryType[]).map(type => (
               <button 
                 key={type}
                 onClick={() => setActiveFilter(type)}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === type ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
               >
                 {TYPE_CONFIG[type].label}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 scroll-smooth">
        {filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
              <Search size={32} className="text-indigo-300" />
            </div>
            <div className="max-w-[240px]">
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                {searchQuery ? 'Ничего не найдено' : 'Ваш Дневник'}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {searchQuery ? 'Попробуйте изменить параметры поиска или фильтра.' : 'Сохраняйте инсайты, благодарите мир и формируйте намерения.'}
              </p>
            </div>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={filteredEntries} 
            onReorder={(newOrder) => {
              if (activeFilter === 'ALL' && !searchQuery) {
                onUpdateOrder(newOrder);
              }
            }} 
            className="flex flex-col"
          >
             {filteredEntries.map((entry) => (
               <JournalCard 
                 key={entry.id} 
                 entry={entry} 
                 onEdit={openEditEntry}
                 onDelete={onDeleteEntry}
               />
             ))}
             
             {activeFilter === 'ALL' && !searchQuery && (
               <div className="text-center pt-8 pb-4 opacity-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Удерживайте для сортировки
                  </p>
               </div>
             )}
          </Reorder.Group>
        )}
      </div>

      <div className="absolute bottom-8 right-6 z-30">
        <button onClick={openNewEntry} className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-400/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
