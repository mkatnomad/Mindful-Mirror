
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  const { userId } = req.query;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ isSubscribed: false });
  }

  try {
    // 1. Проверяем подписку
    const subResp = await fetch(`${kvUrl}/get/user_sub_${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const subData = await subResp.json();
    const isSubscribed = subData.result === "true";

    // 2. Регистрируем пользователя в общем списке (для статистики)
    await fetch(`${kvUrl}/sadd/all_users/${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });

    return res.status(200).json({ isSubscribed });
  } catch (e) {
    return res.status(500).json({ isSubscribed: false });
  }
}
