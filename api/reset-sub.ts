
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  const { userId } = req.query;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ success: false, error: "Missing parameters or KV config" });
  }

  try {
    // 1. Удаляем основной ключ подписки
    const delSub = await fetch(`${kvUrl}/del/user_sub_${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    
    // 2. Удаляем из списка премиум-пользователей
    const delPrem = await fetch(`${kvUrl}/srem/premium_users/${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });

    if (delSub.ok && delPrem.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await delSub.text();
      return res.status(500).json({ success: false, error: errorText });
    }
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
