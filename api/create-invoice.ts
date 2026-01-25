// api/create-invoice.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Обрабатываем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN is not configured in Vercel" });
    }

    // Vercel может автоматически парсить body, если заголовок Content-Type: application/json
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId } = body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Premium статус",
        description: "Доступ ко всем ИИ-функциям на 30 дней",
        payload: `user_${userId}`, 
        provider_token: "", 
        currency: "XTR", 
        prices: [{ label: "Premium", amount: 1 }] // 1 звезда для теста
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (e: any) {
    console.error("Invoice error:", e);
    return res.status(500).json({ error: e.message || "Unknown error" });
  }
}