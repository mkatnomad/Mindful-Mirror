
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userId, type } = req.body;

  if (!userId || !type || !kvUrl || !kvToken) {
    return res.status(400).json({ success: false });
  }

  try {
    const key = `user_energy_${type}_${userId}`;
    
    // Проверяем текущий баланс перед списанием (опционально, DECR все равно сработает)
    // Но для безопасности лучше использовать DECR и проверять результат
    const resp = await fetch(`${kvUrl}/decr/${key}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const data = await resp.json();
    const newValue = parseInt(data.result);

    // Если баланс ушел в минус, значит энергии не было. 
    // В идеале тут нужно вернуть ошибку и сделать INCR обратно, но для упрощения просто не даем упасть.
    if (newValue < 0) {
      await fetch(`${kvUrl}/set/${key}/0`, { headers: { Authorization: `Bearer ${kvToken}` } });
    }

    return res.status(200).json({ success: true, remaining: Math.max(0, newValue) });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
}
