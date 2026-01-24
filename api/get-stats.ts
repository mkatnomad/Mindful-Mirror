
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  if (!kvUrl || !kvToken) {
    return res.status(500).json({ total: 0, premium: 0 });
  }

  try {
    // Получаем количество уникальных пользователей
    const allResp = await fetch(`${kvUrl}/scard/all_users`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const allData = await allResp.json();

    // Получаем количество премиум пользователей
    const premResp = await fetch(`${kvUrl}/scard/premium_users`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const premData = await premResp.json();

    return res.status(200).json({ 
      total: allData.result || 0, 
      premium: premData.result || 0 
    });
  } catch (e) {
    return res.status(500).json({ total: 0, premium: 0 });
  }
}
