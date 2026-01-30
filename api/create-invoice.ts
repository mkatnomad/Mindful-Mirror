
// api/create-invoice.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN is not configured in Vercel" });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId, type } = body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const itemType = type === 'energy' ? 'energy' : 'premium';
    const invoiceConfig = itemType === 'energy' ? {
      title: "10 Зарядов Решений",
      description: "Дополнительная энергия для глубокого анализа ситуаций",
      payload: `energy_${userId}`,
      amount: 99 // 2 звезды за пак энергии
    } : {
      title: "Premium статус на 30 дней",
      description: "Безлимитный доступ ко всем функциям на 30 дней",
      payload: `user_${userId}`,
      amount: 349 // 1 звезда за премиум (тестовая цена)
    };

    const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: invoiceConfig.title,
        description: invoiceConfig.description,
        payload: invoiceConfig.payload, 
        provider_token: "", 
        currency: "XTR", 
        prices: [{ label: invoiceConfig.title, amount: invoiceConfig.amount }]
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
