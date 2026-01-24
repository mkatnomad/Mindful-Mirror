
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  const { userId } = req.query;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ success: false });
  }

  try {
    // Удаляем флаг подписки
    await fetch(`${kvUrl}/del/user_sub_${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    // Удаляем из списка премиум (опционально)
    await fetch(`${kvUrl}/srem/premium_users/${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
}
