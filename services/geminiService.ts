import { Message, DecisionData } from '../types';

// Получаем ключ (Убедись, что в Vercel это ключ от OpenRouter: sk-or-v1...)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Модель на OpenRouter (бесплатная и быстрая)
const MODEL = 'deepseek/deepseek-r1-0528:free'; 
// Или попрбуй: 'deepseek/deepseek-r1:free'

const SITE_URL = 'https://mindful-mirror.app'; // Для статистики OpenRouter
const SITE_NAME = 'Mindful Mirror';

// Универсальная функция запроса к OpenRouter
const callOpenRouter = async (messages: any[], temperature = 0.7) => {
  if (!API_KEY) {
    console.error("API Key is missing!");
    return "Ошибка: Нет API ключа. Проверьте настройки Vercel.";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);
      return `Ошибка OpenRouter: ${response.status}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";

  } catch (error) {
    console.error("Network Error:", error);
    return "Ошибка сети. Проверьте интернет.";
  }
};

// --- ЧАТ И СОВЕТЫ ---

export const sendMessageToGemini = async (message: string, history: any[] = []): Promise<string> => {
  const messages = [
    {
      role: "system",
      content: "Ты — эмпатичный ИИ-ментор и психолог в приложении Mindful Mirror. Твоя цель — поддерживать, направлять и помогать пользователю разобраться в себе. Отвечай тепло, мудро и кратко (если не просят длинного ответа)."
    },
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  return await callOpenRouter(messages);
};

export const analyzeDecision = async (data: DecisionData): Promise<string> => {
  const prompt = `Проанализируй решение: "${data.topic}".\nПлюсы: ${data.pros.join(', ')}.\nМинусы: ${data.cons.join(', ')}.\nДай взвешенный совет и перспективу.`;
  return await callOpenRouter([{ role: "user", content: prompt }]);
};

export const refineDecision = async (currentData: DecisionData, userInput: string): Promise<{ text: string; data: DecisionData }> => {
  // Для простоты пока возвращаем только текстовый анализ, 
  // так как JSON-режим в бесплатных моделях OpenRouter может работать нестабильно.
  const prompt = `У нас есть решение: "${currentData.topic}".\nПлюсы: ${currentData.pros.join(', ')}.\nМинусы: ${currentData.cons.join(', ')}.\n\nПользователь говорит: "${userInput}".\n\nОбнови анализ ситуации с учетом этого.`;
  const text = await callOpenRouter([{ role: "user", content: prompt }]);
  
  return { text, data: currentData };
};

// --- RPG КВЕСТЫ (ПУТЬ ГЕРОЯ) ---

export const generateRPGQuest = async (archetype: string): Promise<{ scene: string; optA: string; optB: string }> => {
  const prompt = `
    Ты — Мастер Игры. Игрок — архетип "${archetype}".
    Создай короткую ситуацию выбора (фэнтези/психология).
    Формат ответа строго: СЦЕНАРИЙ|||ВАРИАНТ_А|||ВАРИАНТ_Б
    Сценарий: 1-2 предложения. Варианты: краткие действия.
  `;
  const text = await callOpenRouter([{ role: "user", content: prompt }], 0.9);
  
  const parts = text.split('|||');
  return { 
    scene: parts[0]?.trim() || "Вы стоите на перепутье. Туман сгущается.", 
    optA: parts[1]?.trim() || "Идти вперед", 
    optB: parts[2]?.trim() || "Ждать знака" 
  };
};

export const processRPGChoice = async (archetype: string, choice: string): Promise<{ outcome: string; artifact: string }> => {
  const prompt = `
    Игрок (${archetype}) выбрал: "${choice}".
    Опиши позитивное последствие (1 предложение) и выдай ментальный артефакт (название).
    Формат ответа строго: ПОСЛЕДСТВИЕ|||АРТЕФАКТ
  `;
  const text = await callOpenRouter([{ role: "user", content: prompt }], 0.9);
  
  const parts = text.split('|||');
  return { 
    outcome: parts[0]?.trim() || "Вы почувствовали прилив сил.", 
    artifact: parts[1]?.trim() || "Осколок Света" 
  };
};
