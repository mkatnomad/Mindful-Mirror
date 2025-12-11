import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { Message, DecisionData } from '../types';

// Инструкции остаются теми же
const SYSTEM_INSTRUCTION_EMOTION = `
You are a deeply empathetic, calm, and supportive AI psychological companion.
Your goal is not just to listen, but to help the user navigate their feelings.
1. Validate their emotion first.
2. Ask a clarifying question OR offer a brief psychological insight/coping technique.
3. Be gentle but proactive.
Keep responses concise (under 4 sentences).
IMPORTANT: You MUST reply in the Russian language.
`;

const SYSTEM_INSTRUCTION_REFLECTION = `
You are a mindful AI assistant helping the user with daily reflection.
Ask about their day, what they learned, and what they are grateful for.
Keep it positive, constructive, and concise.
IMPORTANT: You MUST reply in the Russian language.
`;

const SYSTEM_INSTRUCTION_DECISION_ANALYSIS = `
You are an expert decision-making consultant. 
The user will provide a Topic, Pros, and Cons.
Analyze the balance, identify biases, and offer a framework.
Be concise, wise, and objective.
IMPORTANT: You MUST reply in the Russian language.
`;

// Получение ключа
const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) console.error("API Key is missing!");
  return key;
};

// === НАСТРОЙКА КЛИЕНТА (НОВАЯ БИБЛИОТЕКА) ===
const genAI = new GoogleGenerativeAI(getApiKey());
const MODEL_NAME = "gemini-1.5-flash"; // Самая стабильная и бесплатная модель

export const sendMessageToGemini = async (
  history: Message[], 
  newMessage: string, 
  mode: 'EMOTIONS' | 'REFLECTION'
): Promise<string> => {
  try {
    const systemInstruction = mode === 'EMOTIONS' ? SYSTEM_INSTRUCTION_EMOTION : SYSTEM_INSTRUCTION_REFLECTION;

    // Получаем модель
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: systemInstruction 
    });

    // Преобразуем историю в формат Google
    const chatHistory = history
      .filter(m => m.role !== 'system' && m.type !== 'decision-card')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Запускаем чат
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(newMessage);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Простите, я не смог соединиться с облаком. (Попробуйте позже)";
  }
};

export const analyzeDecision = async (data: DecisionData): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION_DECISION_ANALYSIS
    });

    const prompt = `Topic: ${data.topic}\nPros: ${data.pros.join(', ')}\nCons: ${data.cons.join(', ')}\nPlease analyze this decision.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Decision Error:", error);
    return "Не удалось провести анализ.";
  }
};

export const refineDecision = async (
  currentData: DecisionData, 
  userInput: string
): Promise<{ text: string; data: DecisionData }> => {
  try {
    // Для JSON ответа используем специальную конфигурацию
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    CURRENT DATA:
    Topic: ${currentData.topic}
    Pros: ${JSON.stringify(currentData.pros)}
    Cons: ${JSON.stringify(currentData.cons)}
    USER INPUT: "${userInput}"
    
    TASK: Update data and analyze.
    Return ONLY JSON: { "updatedData": { "topic": "...", "pros": [], "cons": [] }, "analysis": "..." }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const response = JSON.parse(text);

    return {
      text: response.analysis || "Данные обновлены.",
      data: response.updatedData || currentData
    };
  } catch (error) {
    console.error("Refine Error:", error);
    return { text: "Ошибка обновления.", data: currentData };
  }
};
