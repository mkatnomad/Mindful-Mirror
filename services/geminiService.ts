// src/services/geminiService.ts

// Получаем ключ (теперь тут лежит ключ от OpenRouter)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Здесь указываем модель. 
// Для OpenRouter модель Google обычно пишется так: "google/gemini-2.0-flash-lite"
// Если выйдет 2.5, просто поменяй название внутри кавычек.
const MODEL_ID = "gemma-3-12b-it:free"; 

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; content: string }[] = []
): Promise<string> => {
  try {
    if (!API_KEY) {
      console.error("API Key is missing!");
      return "Ошибка: Не найден API ключ. Проверьте настройки Vercel.";
    }

    // 1. Формируем историю переписки для OpenRouter (формат OpenAI)
    // Превращаем твою историю в понятный для OpenRouter формат
    const messages = [
      {
        role: "system",
        content: `Ты — эмпатичный, мудрый и поддерживающий ИИ-психолог и ментор в приложении "Mindful Mirror". 
Твоя цель — помогать пользователю разбираться в чувствах, находить инсайты и поддерживать осознанность.
Отвечай кратко, тепло и по существу. Не пиши длинные лекции. Задавай глубокие вопросы.`
      },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content // В твоем коде это может быть text или content, OpenRouter ждет content
      })),
      { role: "user", content: message }
    ];

    // 2. Делаем запрос на OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        // Эти заголовки просит OpenRouter для статистики (не обязательно, но полезно)
        "HTTP-Referer": "https://mindful-mirror.app", 
        "X-Title": "Mindful Mirror"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: messages,
        temperature: 0.7, // Креативность (0.7 - золотая середина)
        max_tokens: 1000, // Максимальная длина ответа
      })
    });

    // 3. Обрабатываем ответ
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter Error:", errorData);
      throw new Error(`Ошибка OpenRouter: ${response.status}`);
    }

    const data = await response.json();
    
    // Достаем текст ответа
    const reply = data.choices[0]?.message?.content || "Извини, я задумался и не смог сформулировать мысль.";
    
    return reply;

  } catch (error) {
    console.error("Error sending message:", error);
    return "Произошла ошибка связи с космосом (OpenRouter). Попробуй позже.";
  }
};
