// src/services/geminiService.ts

// Получаем ключ из переменных окружения
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ID модели в OpenRouter. Сейчас стоит бесплатная Gemini.
// Если захочешь GPT-4, просто поменяй эту строчку на "openai/gpt-4o"
const MODEL_ID = "gemini-2.0-flash-lite-001"; 

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; content: string }[] = []
): Promise<string> => {
  try {
    if (!API_KEY) {
      console.error("API Key is missing!");
      return "Ошибка: Не найден API ключ.";
    }

    // --- ВАЖНО: Мы используем fetch, а НЕ GoogleGenerativeAI ---
    
    const messages = [
      {
        role: "system",
        content: `Ты — эмпатичный ИИ-психолог в приложении "Mindful Mirror". Отвечай кратко и тепло.`
      },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Отправляем запрос на OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mindful-mirror.app", 
        "X-Title": "Mindful Mirror"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: messages,
        temperature: 0.7, 
        max_tokens: 1000, 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter Error Details:", errorData);
      throw new Error(`Ошибка OpenRouter: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Ошибка: пустой ответ от нейросети.";
    
    return reply;

  } catch (error) {
    console.error("GLOBAL AI ERROR:", error);
    return "Не удалось связаться с OpenRouter. Проверьте консоль.";
  }
};
