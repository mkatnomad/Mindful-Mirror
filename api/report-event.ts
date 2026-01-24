
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  if (req.method !== 'POST' || !kvUrl || !kvToken) {
    return res.status(405).send('Method Not Allowed');
  }

  const { type, value, userId } = req.body;

  try {
    if (type === 'session') {
      const minutes = parseInt(value.minutes) || 0;
      await fetch(`${kvUrl}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}` },
        body: JSON.stringify([
          ['incr', 'global_sessions'],
          ['incrby', 'global_minutes', minutes]
        ])
      });
    } else if (type === 'archetype') {
      const archName = value.name;
      // Проверяем, не менял ли пользователь архетип раньше (упрощенно - просто инкрементируем)
      await fetch(`${kvUrl}/hincrby/archetype_counts/${archName}/1`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
}
