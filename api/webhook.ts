
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_ID = 379881747;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  const body = req.body;

  // 1. Обработка предварительного запроса оплаты
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
  if (!message) return res.status(200).send('OK');

  const userId = message.from.id;
  const host = req.headers.host || 'mindful-mirror.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appUrl = `${protocol}://${host}`;

  // 2. АДМИН-ФУНКЦИИ
  if (userId === ADMIN_ID) {
    // Команда статистики
    if (message.text === '/stats') {
      const resp = await fetch(`${kvUrl}/scard/all_users`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      const data = await resp.json();
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: `📊 Всего пользователей в базе: ${data.result || 0}`
        })
      });
      return res.status(200).send('OK');
    }

    // Команда рассылки (нужно ответить /broadcast на сообщение)
    if (message.text === '/broadcast' && message.reply_to_message) {
      const targetMessage = message.reply_to_message;
      
      // Получаем список всех пользователей
      const usersResp = await fetch(`${kvUrl}/smembers/all_users`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      const usersData = await usersResp.json();
      const userIds = usersData.result || [];

      let successCount = 0;
      let failCount = 0;

      // Отправляем уведомление админу о начале
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: `🚀 Начинаю рассылку на ${userIds.length} пользователей...`
        })
      });

      // Цикл рассылки
      for (const id of userIds) {
        try {
          const sendResp = await fetch(`https://api.telegram.org/bot${token}/copyMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: id,
              from_chat_id: ADMIN_ID,
              message_id: targetMessage.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: "🚀 Открыть Mindful Mirror", web_app: { url: appUrl } }]]
              }
            })
          });
          if (sendResp.ok) successCount++;
          else failCount++;
        } catch (e) {
          failCount++;
        }
        // Небольшая пауза, чтобы не превысить лимиты Telegram (30 сообщений в секунду)
        if (successCount % 20 === 0) await new Promise(r => setTimeout(r, 500));
      }

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: `✅ Рассылка завершена!\nУспешно: ${successCount}\nОшибок: ${failCount}`
        })
      });
      return res.status(200).send('OK');
    }
  }

  // 3. ОБЫЧНЫЕ КОМАНДЫ
  if (message.text === '/start') {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: "Ваше персональное зеркало осознанности готово к работе. Нажмите кнопку ниже, чтобы начать свой путь самопознания.",
        reply_markup: {
          inline_keyboard: [[{ text: "🚀 Открыть приложение", web_app: { url: appUrl } }]]
        }
      })
    });
  }

  // 4. ОБРАБОТКА ПЛАТЕЖЕЙ
  if (message.successful_payment) {
    const payload = message.successful_payment.invoice_payload;
    if (kvUrl && kvToken) {
      const pipeline: any[] = [];
      if (payload.startsWith('energy_')) {
        pipeline.push(['incrby', `user_energy_bonus_${userId}`, 10]);
        pipeline.push(['incr', 'stats:total_energy_sales']);
        pipeline.push(['sadd', 'set:energy_buyers', userId.toString()]);
        
        await fetch(`${kvUrl}/pipeline`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(pipeline)
        });
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: userId, text: "⚡️ Заряды получены! +10 Решений добавлено в ваш профиль." })
        });
      } else {
        pipeline.push(['set', `user_sub_${userId}`, 'true', 'EX', 2592000]);
        pipeline.push(['sadd', 'premium_users', userId.toString()]);
        pipeline.push(['incr', 'stats:total_premium_ever']);
        
        await fetch(`${kvUrl}/pipeline`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(pipeline)
        });
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: userId, text: "✨ Оплата прошла успешно! Ваш Premium статус активирован." })
        });
      }
    }
  }

  return res.status(200).send('OK');
}
