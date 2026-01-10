// src/services/geminiService.ts

// Получаем ключ
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Модель для OpenRouter
const MODEL_ID = "google/gemini-2.0-flash-lite-preview-02-05:free"; 

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; content: string }[] = []
): Promise<string> => {
  try {
    if (!API_KEY) {
      console.error("API Key is missing!");
      return "Ошибка: Не найден API ключ. Проверьте настройки Vercel.";
    }

    const messages = [
      {
        role: "system",
        content: `Ты — эмпатичный, мудрый и поддерживающий ИИ-психолог и ментор в приложении "Mindful Mirror". 
Твоя цель — помогать пользователю разбираться в чувствах, находить инсайты и поддерживать осознанность.
Отвечай кратко, тепло и по существу. Не пиши длинные лекции. Задавай глубокие вопросы.`
      },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

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
      console.error("OpenRouter Error:", errorData);
      throw new Error(`Ошибка OpenRouter: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Извини, я задумался и не смог сформулировать мысль.";
    
    return reply;

  } catch (error) {
    console.error("Error sending message:", error);
    return "Произошла ошибка связи с космосом. Попробуй позже.";
  }
};
