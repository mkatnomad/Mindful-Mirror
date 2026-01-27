import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Camera, Lock, X, Image as ImageIcon, Gift, RefreshCcw, BarChart3, Users, Clock, Flame, Star, PieChart, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { SiteConfig } from '../types';

interface AdminInterfaceProps {
  config: SiteConfig;
  stats: any;
  onSave: (newConfig: SiteConfig) => void;
  onBack: () => void;
  onGift: (userId: string) => void;
  onReset: () => void;
}

export const AdminInterface: React.FC<AdminInterfaceProps> = ({ config, stats, onSave, onBack, onGift, onReset }) => {
  const [editedConfig, setEditedConfig] = useState<SiteConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'STATS' | 'GENERAL' | 'DESIGN' | 'ABOUT' | 'QUOTES' | 'SECURITY' | 'GIFT'>('STATS');
  const [giftId, setGiftId] = useState('');

  const handleSave = () => {
    onSave(editedConfig);
    alert('Настройки успешно сохранены!');
  };

  const addQuote = () => {
    setEditedConfig({
      ...editedConfig,
      quotes: [...editedConfig.quotes, { text: '', author: '' }]
    });
  };

  const removeQuote = (index: number) => {
    setEditedConfig({
      ...editedConfig,
      quotes: editedConfig.quotes.filter((_, i) => i !== index)
    });
  };

  const updateQuote = (index: number, field: 'text' | 'author', value: string) => {
    const newQuotes = [...editedConfig.quotes];
    newQuotes[index] = { ...newQuotes[index], [field]: value };
    setEditedConfig({ ...editedConfig, quotes: newQuotes });
  };

  const updateAboutParagraph = (index: number, value: string) => {
    const newParagraphs = [...editedConfig.aboutParagraphs];
    newParagraphs[index] = value;
    setEditedConfig({ ...editedConfig, aboutParagraphs: newParagraphs });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'customLogoUrl' | 'customWatermarkUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер - 2МБ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedConfig({ ...editedConfig, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'customLogoUrl' | 'customWatermarkUrl') => {
    setEditedConfig({ ...editedConfig, [field]: null });
  };

  const renderSegmentedStat = (label: string, data: Record<string, number>, colorMap: Record<string, string>, isTime: boolean = false) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</h4>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {Object.entries(data).map(([key, val]) => (
            <div 
              key={key} 
              style={{ width: `${(val / total) * 100}%` }} 
              className={`${colorMap[key] || 'bg-slate-300'} h-full transition-all`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2">
           {Object.entries(data).map(([key, val]) => (
             <div key={key} className="flex items-center justify-between text-[11px] font-bold">
               <div className="flex items-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${colorMap[key] || 'bg-slate-300'}`} />
                 <span className="text-slate-500">{key === 'DECISION' ? 'Решения' : key === 'EMOTIONS' ? 'Состояния' : key === 'REFLECTION' ? 'Дневник' : key}</span>
               </div>
               <span className="text-slate-800">
                 {isTime ? `${Math.round(val / 60)} мин` : val} ({Math.round((val / total) * 100)}%)
               </span>
             </div>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] animate-fade-in relative z-[200]">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50">
            <ArrowLeft size={20} />
          </button>
          <h2 className="ml-2 text-lg font-bold text-slate-800">Админ-панель</h2>
        </div>
        <button 
          onClick={handleSave}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 active:scale-95 transition-all"
        >
          <Save size={16} />
          <span>Сохранить</span>
        </button>
      </div>

      <div className="flex p-4 space-x-2 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'STATS', label: 'Аналитика' },
          { id: 'GENERAL', label: 'Общее' },
          { id: 'DESIGN', label: 'Брендинг' },
          { id: 'ABOUT', label: 'Контент' },
          { id: 'QUOTES', label: 'Цитаты' },
          { id: 'SECURITY', label: 'Доступ' },
          { id: 'GIFT', label: 'Дары' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {activeTab === 'STATS' && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <Users className="text-indigo-500 mb-3" size={24} />
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Всего</p>
                   <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <Star className="text-amber-500 mb-3" size={24} fill="currentColor" />
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Premium</p>
                   <p className="text-3xl font-black text-slate-800">{stats.premium}</p>
                </div>
             </div>

             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center space-x-2">
                   <TrendingUp size={14} className="text-indigo-500" />
                   <span>Воронка теста архетипов</span>
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Начали тест</span>
                      <span>{stats.testStarts || 0}</span>
                   </div>
                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full w-full" />
                   </div>
                   <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Завершили</span>
                      <span>{stats.testFinished || 0} ({stats.testStarts ? Math.round((stats.testFinished / stats.testStarts) * 100) : 0}%)</span>
                   </div>
                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all" 
                        style={{ width: `${stats.testStarts ? (stats.testFinished / stats.testStarts) * 100 : 0}%` }} 
                      />
                   </div>
                </div>
             </div>

             {renderSegmentedStat("Распределение сессий", stats.segmentedSessions || {}, {
               'DECISION': 'bg-amber-400',
               'EMOTIONS': 'bg-rose-500',
               'REFLECTION': 'bg-emerald-500'
             })}

             {renderSegmentedStat("Время в разделах (честные мин)", stats.segmentedSeconds || {}, {
               'DECISION': 'bg-amber-400',
               'EMOTIONS': 'bg-rose-500',
               'REFLECTION': 'bg-emerald-500'
             }, true)}

             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center space-x-2">
                   <BookOpen size={14} className="text-emerald-500" />
                   <span>Типы записей Дневника</span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                   {['INSIGHT', 'GRATITUDE', 'INTENTION'].map(type => {
                     const count = (stats.journalTypes || {})[type] || 0;
                     const total = Object.values(stats.journalTypes || {}).reduce((a: any, b: any) => a + b, 0) || 1;
                     return (
                       <div key={type} className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                            {type === 'INSIGHT' ? 'Инсайт' : type === 'GRATITUDE' ? 'Благод.' : 'Намер.'}
                          </p>
                          <p className="text-lg font-black text-slate-800">{count}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{Math.round((count / (total as number)) * 100)}%</p>
                       </div>
                     );
                   })}
                </div>
             </div>

             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center space-x-2">
                   <Flame size={14} className="text-orange-500" />
                   <span>Популярные архетипы</span>
                </h3>
                <div className="space-y-3">
                   {Object.entries(stats.archetypes || {}).sort((a: any,b: any) => b[1] - a[1]).map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-700">{name}</span>
                         <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{count as number}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'GENERAL' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Название приложения</label>
              <input 
                type="text" 
                value={editedConfig.appTitle}
                onChange={(e) => setEditedConfig({ ...editedConfig, appTitle: e.target.value })}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500"
                placeholder="Mindful Mirror"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Текст водяного знака (по умолчанию)</label>
              <input 
                type="text" 
                value={editedConfig.logoText}
                onChange={(e) => setEditedConfig({ ...editedConfig, logoText: e.target.value })}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500"
                maxLength={4}
              />
              <p className="mt-2 text-[10px] text-slate-400 italic px-1">До 4 символов. Будет показан, если не загружено изображение.</p>
            </div>
          </div>
        )}

        {activeTab === 'DESIGN' && (
          <div className="space-y-8">
            <h3 className="font-bold text-slate-800 text-sm border-l-4 border-indigo-500 pl-3 uppercase tracking-wider">Визуальные элементы</h3>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Логотип ("О приложении")</label>
              <div className="relative group w-full aspect-video bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-indigo-200">
                {editedConfig.customLogoUrl ? (
                  <>
                    <img src={editedConfig.customLogoUrl} className="max-w-[120px] max-h-[120px] object-contain" alt="Current Logo" />
                    <button onClick={() => removeImage('customLogoUrl')} className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-full shadow-lg hover:bg-rose-50"><Trash2 size={18} /></button>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm text-slate-400 font-medium">PNG на прозрачном фоне</p>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, 'customLogoUrl')} />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ABOUT' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-sm border-l-4 border-indigo-500 pl-3 uppercase tracking-wider">Описание</h3>
            {editedConfig.aboutParagraphs.map((p, i) => (
              <div key={i} className="relative">
                <textarea 
                  value={p}
                  onChange={(e) => updateAboutParagraph(i, e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 min-h-[100px] text-sm text-slate-600 leading-relaxed"
                />
                <button 
                  onClick={() => {
                    const next = editedConfig.aboutParagraphs.filter((_, idx) => idx !== i);
                    setEditedConfig({ ...editedConfig, aboutParagraphs: next });
                  }}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 p-1"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => setEditedConfig({ ...editedConfig, aboutParagraphs: [...editedConfig.aboutParagraphs, ''] })}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold flex items-center justify-center space-x-2"
            >
              <Plus size={16} />
              <span>Добавить абзац</span>
            </button>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-sm border-l-4 border-indigo-500 pl-3 uppercase tracking-wider">Безопасность</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Админ-пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={editedConfig.adminPasscode}
                  onChange={(e) => setEditedConfig({ ...editedConfig, adminPasscode: e.target.value })}
                  className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500"
                  placeholder="0000"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
               <button onClick={onReset} className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold flex items-center justify-center space-x-2 border border-rose-100">
                 <RefreshCcw size={16} />
                 <span>Сбросить текущий статус (тест)</span>
               </button>
            </div>
          </div>
        )}

        {activeTab === 'GIFT' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-bold text-slate-800 text-sm border-l-4 border-indigo-500 pl-3 uppercase tracking-wider">Вручить дар</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telegram User ID</label>
              <input 
                type="text" 
                value={giftId}
                onChange={(e) => setGiftId(e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="379881747"
              />
            </div>
            <button 
              onClick={() => { onGift(giftId); setGiftId(''); }}
              className="w-full py-5 rounded-[24px] bg-blue-600 text-white shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all"
            >
              <Gift size={20} />
              <span className="font-bold">Активировать статус</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};