
import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, X, Lightbulb, Heart, Target, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { JournalEntry, JournalEntryType } from '../types';

interface JournalInterfaceProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry, isNew: boolean, durationSeconds: number) => void;
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

// Separate component for individual items to use hooks properly
const JournalCard: React.FC<{ 
  entry: JournalEntry; 
  onEdit: (entry: JournalEntry) => void; 
}> = ({ 
  entry, 
  onEdit 
}) => {
  const controls = useDragControls();
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG['INSIGHT'];
  const Icon = config.icon;
  
  // Truncate text to 30 chars
  const previewText = entry.content.length > 30 
    ? entry.content.slice(0, 30) + '...' 
    : entry.content;

  return (
    <Reorder.Item
      value={entry}
      id={entry.id}
      dragListener={false} // Disable dragging by default
      dragControls={controls} // Enable dragging only via controls
      style={{ borderRadius: '24px' }} // Fixes white corners by matching rounded shape
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0px 15px 30px -10px rgba(0,0,0,0.1)",
        zIndex: 50 
      }}
      transition={{ duration: 0.2 }}
      className="relative mb-4 bg-transparent"
    >
      <div 
        onClick={() => onEdit(entry)}
        className={`
           relative rounded-[24px] p-5 bg-gradient-to-br ${config.gradient} 
           border border-white/70 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] 
           hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5
           active:scale-[0.99] transition-all duration-300 group select-none
        `}
      >
        <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/50`}>
              <Icon size={12} className={config.color} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
            </div>
            <div className="flex items-center">
                <span className="text-[10px] text-slate-400 font-semibold mr-1 opacity-70">
                  {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                {/* Drag Handle Area - Large hit area, but visually small */}
                <div 
                  onPointerDown={(e) => controls.start(e)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 h-10 flex items-center justify-center -mr-3 -my-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors touch-none"
                >
                    <GripVertical size={20} />
                </div>
            </div>
        </div>
        <p className="text-slate-700 text-[14px] leading-relaxed font-medium break-words">
          {previewText}
        </p>
      </div>
    </Reorder.Item>
  );
};

export const JournalInterface: React.FC<JournalInterfaceProps> = ({ entries, onSaveEntry, onUpdateOrder, onBack }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<JournalEntryType>('INSIGHT');
  const [content, setContent] = useState('');
  
  // Track time spent in editor
  const startTimeRef = useRef<number>(0);

  const openNewEntry = () => {
    setEditingId(null);
    setSelectedType('INSIGHT');
    setContent('');
    startTimeRef.current = Date.now(); // Start timer
    setIsEditorOpen(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setSelectedType(entry.type);
    setContent(entry.content);
    startTimeRef.current = Date.now(); // Start timer
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;
    
    const isNew = editingId === null;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000); // Duration in seconds
    
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
        <button 
          onClick={() => setIsEditorOpen(false)}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
        >
          <X size={24} />
        </button>
        <span className="font-bold text-slate-800">{editingId ? 'Редактировать' : 'Новая запись'}</span>
        <button 
          onClick={handleSave}
          disabled={!content.trim()}
          className="text-indigo-600 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Сохранить
        </button>
      </div>

      <div className="flex p-4 space-x-2 bg-slate-50/50 overflow-x-auto no-scrollbar">
        {(Object.keys(TYPE_CONFIG) as JournalEntryType[]).map((type) => {
          const config = TYPE_CONFIG[type];
          const isSelected = selectedType === type;
          const Icon = config.icon;
          
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all min-w-[100px]
                ${isSelected 
                  ? 'bg-white shadow-md text-slate-800 ring-1 ring-black/5' 
                  : 'text-slate-400 hover:bg-white/50'}
              `}
            >
              <Icon size={16} className={isSelected ? config.color : ''} />
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
          className="w-full h-full resize-none text-lg text-slate-700 placeholder:text-slate-300 focus:outline-none leading-relaxed"
          autoFocus
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      {isEditorOpen && renderEditor()}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100">
            <ArrowLeft size={20} />
            </button>
            <h2 className="ml-2 text-xl font-bold text-slate-800 tracking-tight">Моё Пространство</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 scroll-smooth">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
              <Target size={32} className="text-indigo-300" />
            </div>
            <div className="max-w-[240px]">
              <h3 className="text-lg font-bold text-slate-700 mb-2">Ваш Дневник</h3>
              <p className="text-slate-500 leading-relaxed">
                Сохраняйте инсайты, благодарите мир и формируйте намерения.
              </p>
            </div>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={entries} 
            onReorder={onUpdateOrder} 
            className="flex flex-col"
          >
             {entries.map((entry) => (
               <JournalCard 
                 key={entry.id} 
                 entry={entry} 
                 onEdit={openEditEntry} 
               />
             ))}
             
             <div className="text-center pt-8 pb-4 opacity-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  <GripVertical size={14} /> Перетаскивание
                </p>
             </div>
          </Reorder.Group>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6 z-30">
        <button
          onClick={openNewEntry}
          className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-400/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
