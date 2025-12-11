import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { Message, DecisionData } from '../types';

// --- ИНСТРУКЦИИ ---
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

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) console.error("API Key is missing!");
  return key;
};

// --- НАСТРОЙКИ БЕЗОПАСНОСТИ ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const genAI = new GoogleGenerativeAI(getApiKey());

// <--- ИСПРАВЛЕНИЕ: ИСПОЛЬЗУЕМ ТОЧНУЮ ВЕРСИЮ --->
const MODEL_NAME = "gemini-2.5-flash"; 

// --- ЧАТ ---
export const sendMessageToGemini = async (
  history: Message[], 
  newMessage: string, 
  mode: 'EMOTIONS' | 'REFLECTION'
): Promise<string> => {
  try {
    const systemInstruction = mode === 'EMOTIONS' ? SYSTEM_INSTRUCTION_EMOTION : SYSTEM_INSTRUCTION_REFLECTION;

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: systemInstruction,
      safetySettings: safetySettings
    });

    let chatHistory = history
      .filter(m => m.role !== 'system' && m.type !== 'decision-card')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Исправление ошибки "First content should be user"
    while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(newMessage);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Простите, я не смог соединиться с облаком (Ошибка сети или модели).";
  }
};

// --- АНАЛИЗ РЕШЕНИЙ ---
export const analyzeDecision = async (data: DecisionData): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION_DECISION_ANALYSIS,
      safetySettings: safetySettings
    });

    const prompt = `Topic: ${data.topic}\nPros: ${data.pros.join(', ')}\nCons: ${data.cons.join(', ')}\nPlease analyze this decision.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Decision Error:", error);
    return "Не удалось провести анализ.";
  }
};

// --- УТОЧНЕНИЕ РЕШЕНИЙ ---
export const refineDecision = async (
  currentData: DecisionData, 
  userInput: string
): Promise<{ text: string; data: DecisionData }> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" },
      safetySettings: safetySettings
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
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const response = JSON.parse(text);

    return {
      text: response.analysis || "Данные обновлены.",
      data: response.updatedData || currentData
    };
  } catch (error) {
    console.error("Refine Error:", error);
    return { text: "Ошибка обновления данных.", data: currentData };
  }
};

// --- ДИАГНОСТИКА: ПРОВЕРКА ДОСТУПНЫХ МОДЕЛЕЙ ---
export const checkAvailableModels = async () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  try {
    console.log("Проверяем доступные модели...");
    // Делаем прямой запрос к Google, минуя библиотеки
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("ОШИБКА КЛЮЧА:", data.error);
    } else {
      console.log("=== СПИСОК ДОСТУПНЫХ МОДЕЛЕЙ ===");
      console.log(data.models?.map((m: any) => m.name)); // Выведет список имен
      console.log("================================");
    }
  } catch (e) {
    console.error("Ошибка проверки:", e);
  }
};

// Запускаем проверку сразу при загрузке файла (для теста)
checkAvailableModels();
