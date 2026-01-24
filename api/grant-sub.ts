
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { userId } = req.body;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ success: false, error: "Missing userId or KV config" });
  }

  try {
    // 1. Ставим флаг подписки на 30 дней (2592000 сек)
    await fetch(`${kvUrl}/set/user_sub_${userId}/true/EX/2592000`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    
    // 2. Добавляем в список премиум-пользователей
    await fetch(`${kvUrl}/sadd/premium_users/${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });

    // 3. Отправляем уведомление пользователю
    if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text: "🎁 Вам вручен Premium статус на 30 дней! Перезапустите приложение, чтобы активировать все функции."
          })
        });
    }

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
