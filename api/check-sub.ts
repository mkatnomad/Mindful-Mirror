
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  const { userId } = req.query;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ isSubscribed: false, energyBonus: 0 });
  }

  try {
    // 1. Проверяем подписку
    const subResp = await fetch(`${kvUrl}/get/user_sub_${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const subData = await subResp.json();
    const isSubscribed = subData.result === "true";

    // 2. Проверяем наличие бонусов энергии (купленных зарядов)
    const energyResp = await fetch(`${kvUrl}/get/user_energy_bonus_${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const energyData = await energyResp.json();
    const energyBonus = parseInt(energyData.result) || 0;

    // 3. Если бонус есть, забираем его и удаляем из KV, чтобы не зачислить дважды
    if (energyBonus > 0) {
      await fetch(`${kvUrl}/del/user_energy_bonus_${userId}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
    }

    // 4. Регистрируем пользователя в общем списке
    await fetch(`${kvUrl}/sadd/all_users/${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });

    return res.status(200).json({ isSubscribed, energyBonus });
  } catch (e) {
    return res.status(500).json({ isSubscribed: false, energyBonus: 0 });
  }
}
