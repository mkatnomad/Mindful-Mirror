import { GoogleGenAI, GenerateContentResponse, Type, Schema } from "@google/genai";
import { Message, DecisionData } from '../types';

const SYSTEM_INSTRUCTION_EMOTION = `
You are a deeply empathetic, calm, and supportive AI psychological companion.
Your goal is not just to listen, but to help the user navigate their feelings.
1. Validate their emotion first.
2. Ask a clarifying question OR offer a brief psychological insight/coping technique (e.g., breathing, reframing, grounding).
3. Be gentle but proactive in helping them feel better.
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
Your task is to:
1. Analyze the balance between Pros and Cons.
2. Identify any potential cognitive biases (e.g., fear of missing out, sunk cost).
3. Offer a specific framework or perspective to help them decide (e.g., "How would you feel about this in 10 minutes, 10 months, 10 years?", or "What is the worst-case scenario?").
4. Give a gentle recommendation or a question that cuts to the core of the issue.
Be concise, wise, and objective.
IMPORTANT: You MUST reply in the Russian language.
`;

// --- ВАЖНО: Мы используем import.meta.env для Vite ---
const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.error("API Key is missing! Check Vercel Environment Variables.");
  }
  return key;
};

export const sendMessageToGemini = async (
  history: Message[], 
  newMessage: string, 
  mode: 'EMOTIONS' | 'REFLECTION'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const modelId = 'gemini-1.5-flash'; // <--- ИЗМЕНИЛ ЗДЕСЬ (было 2.0)
    const systemInstruction = mode === 'EMOTIONS' ? SYSTEM_INSTRUCTION_EMOTION : SYSTEM_INSTRUCTION_REFLECTION;

    const apiHistory = history
      .filter(m => m.role !== 'system' && m.type !== 'decision-card')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: apiHistory
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: newMessage
    });

    return result.text || "Я слушаю...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Простите, я не смог соединиться с облаком. Проверьте интернет или API ключ.";
  }
};

export const analyzeDecision = async (data: DecisionData): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `
      Topic: ${data.topic}
      Pros: ${data.pros.join(', ')}
      Cons: ${data.cons.join(', ')}
      
      Please analyze this decision.
    `;

    const chat = ai.chats.create({
      model: 'gemini-1.5-flash', // <--- ИЗМЕНИЛ ЗДЕСЬ (было 2.0)
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_DECISION_ANALYSIS,
      }
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: prompt
    });

    return result.text || "Я проанализировал ваши данные, но мне нужно чуть больше времени.";
  } catch (error) {
    console.error("Gemini Decision Analysis Error:", error);
    return "Не удалось провести анализ. Попробуйте еще раз.";
  }
};

export const refineDecision = async (
  currentData: DecisionData, 
  userInput: string
): Promise<{ text: string; data: DecisionData }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // We want the model to act as a data processor AND advisor.
    const prompt = `
    CURRENT DATA:
    Topic: ${currentData.topic}
    Pros: ${JSON.stringify(currentData.pros)}
    Cons: ${JSON.stringify(currentData.cons)}

    USER INPUT: "${userInput}"

    TASK:
    1. Update the Pros and Cons lists based on the User Input. The user might want to add, remove, or modify items. Use your best judgment to interpret their request.
    2. Provide a fresh analysis of the decision based on the UPDATED data.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        updatedData: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        },
        analysis: { type: Type.STRING }
      }
    };

    const chat = ai.chats.create({
      model: 'gemini-1.5-flash', // <--- ИЗМЕНИЛ ЗДЕСЬ (было 2.0)
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const result = await chat.sendMessage({
      message: prompt
    });

    const jsonText = result.text || "{}";
    const response = JSON.parse(jsonText);

    return {
      text: response.analysis || "Данные обновлены.",
      data: response.updatedData || currentData
    };
  } catch (error) {
    console.error("Refine Decision Error:", error);
    return {
      text: "Извините, я не смог обновить данные. Попробуйте сформулировать иначе.",
      data: currentData
    };
  }
};
