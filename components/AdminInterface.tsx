
import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Camera, Lock, X, Image as ImageIcon } from 'lucide-react';
import { SiteConfig } from '../types';

interface AdminInterfaceProps {
  config: SiteConfig;
  onSave: (newConfig: SiteConfig) => void;
  onBack: () => void;
}

export const AdminInterface: React.FC<AdminInterfaceProps> = ({ config, onSave, onBack }) => {
  const [editedConfig, setEditedConfig] = useState<SiteConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ABOUT' | 'QUOTES' | 'SECURITY'>('GENERAL');

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер - 2МБ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedConfig({ ...editedConfig, customLogoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setEditedConfig({ ...editedConfig, customLogoUrl: null });
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fade-in relative z-[200]">
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
          { id: 'GENERAL', label: 'Общее' },
          { id: 'ABOUT', label: 'О приложении' },
          { id: 'QUOTES', label: 'Цитаты' },
          { id: 'SECURITY', label: 'Безопасность' }
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
              <label className="block text-sm font-bold text-slate-700 mb-4">Логотип (About)</label>
              <div className="flex flex-col space-y-4">
                <div className="relative w-full aspect-video bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden">
                  {editedConfig.customLogoUrl ? (
                    <>
                      <img src={editedConfig.customLogoUrl} className="max-w-full max-h-full object-contain p-4" alt="Custom Logo" />
                      <button 
                        onClick={removeLogo}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-rose-500 shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={40} className="mx-auto text-slate-200 mb-1" />
                      <span className="text-xl font-bold italic text-indigo-200 uppercase tracking-tighter">{editedConfig.logoText}</span>
                    </div>
                  )}
                </div>
                
                <label className="w-full flex items-center justify-center space-x-2 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all cursor-pointer">
                  <Camera size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Выбрать изображение</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Текст водяного знака</label>
              <input 
                type="text" 
                value={editedConfig.logoText}
                onChange={(e) => setEditedConfig({ ...editedConfig, logoText: e.target.value })}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500"
                maxLength={4}
              />
              <p className="mt-2 text-[10px] text-slate-400 italic px-1">До 4 символов</p>
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

        {activeTab === 'QUOTES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm border-l-4 border-indigo-500 pl-3 uppercase tracking-wider">Цитаты</h3>
              <button onClick={addQuote} className="text-indigo-600 text-xs font-bold flex items-center space-x-1">
                <Plus size={14} />
                <span>Добавить</span>
              </button>
            </div>
            {editedConfig.quotes.map((q, i) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 relative">
                <textarea 
                  placeholder="Текст цитаты"
                  value={q.text}
                  onChange={(e) => updateQuote(i, 'text', e.target.value)}
                  className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-indigo-500 text-sm italic"
                />
                <input 
                  type="text" 
                  placeholder="Автор"
                  value={q.author}
                  onChange={(e) => updateQuote(i, 'author', e.target.value)}
                  className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-indigo-500 text-xs font-bold"
                />
                <button 
                  onClick={() => removeQuote(i)}
                  className="absolute -top-2 -right-2 bg-white border border-slate-200 text-rose-500 p-1.5 rounded-full shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
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
          </div>
        )}
      </div>
    </div>
  );
};
