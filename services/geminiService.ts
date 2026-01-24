import { Message, DecisionData } from '../types';

// Получаем ключ правильным способом для Vite/Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL = 'gemini-1.5-flash'; // Используем самую стабильную модель

// Вспомогательная функция для запросов (чтобы не дублировать код)
const callGemini = async (prompt: string, systemInstruction?: string) => {
  if (!API_KEY) {
    console.error("API Key is missing!");
    return "Ошибка: Нет API ключа.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return "ИИ временно недоступен. Попробуйте позже.";
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Network Error:", error);
    return "Ошибка сети.";
  }
};

// --- RPG КВЕСТЫ (ПУТЬ ГЕРОЯ) ---

const SYSTEM_INSTRUCTION_RPG_QUEST = `
Ты — Мастер Игры в мире психологического фэнтези. 
Твоя задача — создать короткую ситуацию выбора для игрока.
Формат ответа строго: СЦЕНАРИЙ|||ВАРИАНТ_А|||ВАРИАНТ_Б
Сценарий должен быть коротким (1-2 предложения), атмосферным.
Варианты должны быть краткими действиями.
Язык: Русский.
`;

const SYSTEM_INSTRUCTION_RPG_CHOICE = `
Ты — Мастер Игры. Игрок сделал выбор.
Опиши кратко (1 предложение) позитивное психологическое последствие этого выбора.
Придумай название полученного ментального артефакта (1-2 слова, красиво).
Формат ответа строго: ПОСЛЕДСТВИЕ|||АРТЕФАКТ
Язык: Русский.
`;

export const generateRPGQuest = async (archetype: string): Promise<{ scene: string; optA: string; optB: string }> => {
  const prompt = `Игрок: архетип ${archetype}. Создай ситуацию выбора.`;
  const text = await callGemini(prompt, SYSTEM_INSTRUCTION_RPG_QUEST);
  
  const parts = text.split('|||');
  return { 
    scene: parts[0]?.trim() || "Туман рассеивается, и вы видите развилку.", 
    optA: parts[1]?.trim() || "Пойти налево", 
    optB: parts[2]?.trim() || "Пойти направо" 
  };
};

export const processRPGChoice = async (archetype: string, choice: string): Promise<{ outcome: string; artifact: string }> => {
  const prompt = `Игрок (${archetype}) выбрал: ${choice}. Опиши результат и награду.`;
  const text = await callGemini(prompt, SYSTEM_INSTRUCTION_RPG_CHOICE);
  
  const parts = text.split('|||');
  return { 
    outcome: parts[0]?.trim() || "Вы чувствуете прилив сил.", 
    artifact: parts[1]?.trim() || "Осколок Света" 
  };
};

// --- ОБЫЧНЫЙ ЧАТ И СОВЕТЫ ---

export const sendMessageToGemini = async (message: string, history: any[] = []): Promise<string> => {
  // Для простоты в этом примере отправляем только последнее сообщение + контекст
  // В полноценной версии можно собирать всю историю в contents
  const systemInstruction = "Ты — эмпатичный ИИ-ментор. Отвечай кратко, мудро и тепло.";
  return await callGemini(message, systemInstruction);
};

export const analyzeDecision = async (data: DecisionData): Promise<string> => {
  const prompt = `Проанализируй решение: ${data.topic}. Плюсы: ${data.pros.join(', ')}. Минусы: ${data.cons.join(', ')}. Дай совет.`;
  return await callGemini(prompt);
};

export const refineDecision = async (currentData: DecisionData, userInput: string): Promise<{ text: string; data: DecisionData }> => {
  // Упрощенная версия для стабильности
  const prompt = `Пользователь уточнил: "${userInput}". Текущие плюсы: ${currentData.pros}. Текущие минусы: ${currentData.cons}. Как это меняет картину?`;
  const text = await callGemini(prompt);
  
  // В "безопасной" версии мы просто возвращаем текст и старые данные, 
  // чтобы не усложнять парсинг JSON, который часто ломается.
  return { text: text, data: currentData };
};
