// api/create-invoice.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { userId } = JSON.parse(req.body);
    const token = process.env.TELEGRAM_BOT_TOKEN;

    const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Premium статус",
        description: "Доступ ко всем ИИ-функциям на 30 дней",
        payload: `user_${userId}`, 
        provider_token: "", 
        currency: "XTR", 
        prices: [{ label: "Premium", amount: 1 }] // Для теста поставьте 1 звезду
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}