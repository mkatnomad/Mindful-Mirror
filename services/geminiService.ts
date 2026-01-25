
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

const DECISION_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, description: "Краткий итоговый совет или вывод" },
    balanceA: { type: Type.NUMBER, description: "Процент веса первого варианта (0-100)" },
    balanceB: { type: Type.NUMBER, description: "Процент веса второго варианта или альтернативы (0-100)" },
    hiddenFactor: { type: Type.STRING, description: "Скрытый психологический фактор или инсайт" },
    riskLevel: { type: Type.NUMBER, description: "Уровень риска от 1 до 10" },
    riskDescription: { type: Type.STRING, description: "Почему такой уровень риска" },
    actionStep: { type: Type.STRING, description: "Первый конкретный шаг для пользователя" }
  },
  required: ['verdict', 'balanceA', 'balanceB', 'hiddenFactor', 'riskLevel', 'riskDescription', 'actionStep']
};

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
      model: 'gemini-3-flash-preview',
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
  const modelId = 'gemini-3-flash-preview';
  
  const systemInstruction = mode === 'EMOTIONS' 
    ? "Ты эмпатичный психолог-собеседник. Твоя задача — поддерживать пользователя, помнить контекст беседы (имена, события) и помогать прожить эмоции. Не давай сухих советов, будь человечным." 
    : "Ты мудрый наставник для рефлексии. Помогай пользователю подводить итоги, задавай глубокие наводящие вопросы, опираясь на то, что пользователь рассказывал ранее в этой беседе.";

  // Преобразуем историю сообщений в формат Gemini
  // Ограничиваем историю последними 15 сообщениями для экономии и фокуса
  const geminiHistory = history
    .filter(m => m.role !== 'system' && m.content && m.content.trim() !== '')
    .slice(-15)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  const chat = ai.chats.create({ 
    model: modelId, 
    config: { systemInstruction },
    history: geminiHistory
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "...";
};

export const analyzeDecision = async (data: DecisionData): Promise<DecisionData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let prompt = '';
  
  if (data.decisionType === 'COMPARE') {
    prompt = `Проанализируй выбор между двумя вариантами. 
    Вариант А: ${data.optionA}. Его аргументы: ${data.pros.join(', ')}.
    Вариант Б: ${data.optionB}. Его аргументы: ${data.cons.join(', ')}.
    Сравни их и дай глубокий структурированный совет.`;
  } else {
    prompt = `Проанализируй решение: ${data.topic}. 
    Плюсы: ${data.pros.join(', ')}. 
    Минусы: ${data.cons.join(', ')}. 
    Дай взвешенный структурированный совет.`;
  }

  const result = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: DECISION_ANALYSIS_SCHEMA
    }
  });

  try {
    const analysis = JSON.parse(result.text || "{}");
    return { ...data, analysis };
  } catch (e) {
    console.error("Analysis Parse Error", e);
    return data;
  }
};

export const refineDecision = async (currentData: DecisionData, userInput: string): Promise<{ text: string; data: DecisionData }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Обнови список аргументов и проведи анализ. Ввод пользователя: ${userInput}. Данные: ${JSON.stringify(currentData)}`,
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
              decisionType: { type: Type.STRING },
              optionA: { type: Type.STRING },
              optionB: { type: Type.STRING },
              analysis: DECISION_ANALYSIS_SCHEMA
            },
            required: ['topic', 'pros', 'cons', 'decisionType']
          },
          chatResponse: { type: Type.STRING, description: "Короткая текстовая реакция для чата" }
        },
        required: ['updatedData', 'chatResponse']
      }
    }
  });
  const response = JSON.parse(result.text || "{}");
  return { text: response.chatResponse, data: response.updatedData };
};
