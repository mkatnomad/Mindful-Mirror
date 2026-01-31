
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  const body = req.body;

  // Обработка предварительного запроса оплаты
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

  // НОВОЕ: Обработка команды /start
  if (message?.text === '/start') {
    const userId = message.from.id;
    // Определяем хост динамически, чтобы кнопка всегда вела на правильный адрес Vercel
    const host = req.headers.host || 'mindful-mirror.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${protocol}://${host}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: "Ваше персональное зеркало осознанности готово к работе. Нажмите кнопку ниже, чтобы начать свой путь самопознания.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Открыть приложение",
                web_app: { url: appUrl }
              }
            ]
          ]
        }
      })
    });
  }

  // Обработка успешного платежа
  if (message?.successful_payment) {
    const userId = message.from.id;
    const payload = message.successful_payment.invoice_payload;
    
    if (kvUrl && kvToken) {
      const pipeline: any[] = [];

      if (payload.startsWith('energy_')) {
        // 1. Зачисляем энергию пользователю
        pipeline.push(['incrby', `user_energy_bonus_${userId}`, 10]);
        // 2. Общая статистика продаж энергии
        pipeline.push(['incr', 'stats:total_energy_sales']);
        // 3. Список уникальных покупателей энергии
        pipeline.push(['sadd', 'set:energy_buyers', userId.toString()]);
        
        await fetch(`${kvUrl}/pipeline`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(pipeline)
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
        // 1. Обычная подписка Premium на 30 дней
        pipeline.push(['set', `user_sub_${userId}`, 'true', 'EX', 2592000]);
        // 2. Список активных Premium
        pipeline.push(['sadd', 'premium_users', userId.toString()]);
        // 3. Общая статистика Premium за все время
        pipeline.push(['incr', 'stats:total_premium_ever']);
        
        await fetch(`${kvUrl}/pipeline`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(pipeline)
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
