
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  const body = req.body;

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

  const message = body.message;
  if (message?.successful_payment) {
    const userId = message.from.id;
    const payload = message.successful_payment.invoice_payload;
    
    if (kvUrl && kvToken) {
      if (payload.startsWith('energy_')) {
        // Зачисляем энергию (накапливаем бонус для клиента)
        await fetch(`${kvUrl}/incrby/user_energy_bonus_${userId}/10`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text: "⚡️ Заряды получены! +10 Решений добавлено в ваш профиль."
          })
        });
      } else {
        // Обычная подписка Premium
        await fetch(`${kvUrl}/set/user_sub_${userId}/true/EX/2592000`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        await fetch(`${kvUrl}/sadd/premium_users/${userId}`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text: "✨ Оплата прошла успешно! Ваш Premium статус активирован."
          })
        });
      }
    }
  }

  return res.status(200).send('OK');
}
