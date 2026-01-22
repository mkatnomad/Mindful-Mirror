
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, DecisionData, Archetype } from '../types';

const SYSTEM_INSTRUCTION_RPG_QUEST = `
Ты — Мастер Игры в мире психологического фэнтези. 
Твой игрок — архетип [ИМЯ_АРХЕТИПА]. 
Создай короткую, яркую игровую ситуацию (1-2 предложения), требующую морального выбора. 
Избегай запутанных слов, пиши понятно, но атмосферно.
Предложи 2 варианта действий (А и Б). 
Формат ответа строго: СЦЕНАРИЙ|||ВАРИАНТ_А|||ВАРИАНТ_Б
Язык: Русский.
`;

const SYSTEM_INSTRUCTION_RPG_CHOICE = `
Ты — Мастер Игры. Игрок сделал выбор.
Опиши краткое последствия этого шага (1 предложение). 
Придумай название полученного ментального артефакта (1-2 слова, например "Осколок Истины"). 
Формат ответа строго: ПОСЛЕДСТВИЕ|||АРТЕФАКТ
Язык: Русский.
`;

export const generateRPGQuest = async (archetype: Archetype): Promise<{ scene: string; optA: string; optB: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Архетип игрока: ${archetype.name}. Описание: ${archetype.description}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION_RPG_QUEST }
    });
    const parts = (response.text || "").split('|||');
    return { 
      scene: parts[0]?.trim() || "Перед вами развилка в тумане осознанности.", 
      optA: parts[1]?.trim() || "Шагнуть в неизвестность", 
      optB: parts[2]?.trim() || "Оглядеться в поисках знаков" 
    };
  } catch (error) {
    console.error("RPG Quest Error:", error);
    return { scene: "Мастер временно недоступен. Путь окутан туманом.", optA: "Ждать", optB: "Вернуться позже" };
  }
};

export const processRPGChoice = async (archetype: Archetype, choice: string): Promise<{ outcome: string; artifact: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Архетип: ${archetype.name}. Выбор: ${choice}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION_RPG_CHOICE }
    });
    const parts = (response.text || "").split('|||');
    return { 
      outcome: parts[0]?.trim() || "Ваш выбор укрепил вашу внутреннюю опору.", 
      artifact: parts[1]?.trim() || "Свет Сознания" 
    };
  } catch (error) {
    console.error("RPG Choice Error:", error);
    return { outcome: "Ваш опыт стал ценнее.", artifact: "Мудрость" };
  }
};

export const sendMessageToGemini = async (history: Message[], newMessage: string, mode: 'EMOTIONS' | 'REFLECTION'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'gemini-2.5-flash-lite';
  const systemInstruction = mode === 'EMOTIONS' ? "Ты эмпатичный психолог-собеседник. Поддерживай пользователя." : "Ты помощник в глубокой рефлексии. Задавай наводящие вопросы.";
  const chat = ai.chats.create({ model: modelId, config: { systemInstruction } });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "...";
};

export const analyzeDecision = async (data: DecisionData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Проанализируй решение: ${data.topic}. Плюсы: ${data.pros.join(', ')}. Минусы: ${data.cons.join(', ')}. Дай совет в 3-4 предложениях.`;
  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
  return result.text || "...";
};

export const refineDecision = async (currentData: DecisionData, userInput: string): Promise<{ text: string; data: DecisionData }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `Обнови список аргументов. Ввод пользователя: ${userInput}. Данные: ${JSON.stringify(currentData)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updatedData: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['topic', 'pros', 'cons']
          },
          analysis: { type: Type.STRING }
        },
        required: ['updatedData', 'analysis']
      }
    }
  });
  const response = JSON.parse(result.text || "{}");
  return { text: response.analysis, data: response.updatedData };
};
