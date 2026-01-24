
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  const body = req.body;

  // 1. Обработка pre_checkout_query (Telegram спрашивает, все ли ок перед списанием)
  if (body.pre_checkout_query) {
    await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pre_checkout_query_id: body.pre_checkout_query.id,
        ok: true
      })
    });
    return res.status(200).send('OK');
  }

  // 2. Обработка успешного платежа
  const message = body.message;
  if (message?.successful_payment) {
    const userId = message.from.id;
    
    // Сохраняем в Upstash Redis на 30 дней (2592000 секунд)
    if (kvUrl && kvToken) {
      await fetch(`${kvUrl}/set/user_sub_${userId}/true/EX/2592000`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
    }

    // Опционально: отправляем пользователю сообщение в боте
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: "✨ Оплата прошла успешно! Ваш Premium статус активирован на 30 дней."
      })
    });
  }

  return res.status(200).send('OK');
}
