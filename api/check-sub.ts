
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_ENERGY = {
  decisions: 5,
  emotions: 3,
  quests: 3
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  const { userId } = req.query;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ isSubscribed: false, energy: DEFAULT_ENERGY });
  }

  try {
    const fetchKV = async (path: string) => {
      const r = await fetch(`${kvUrl}/${path}`, { headers: { Authorization: `Bearer ${kvToken}` } });
      return r.json();
    };

    // 1. Проверяем подписку
    const subData = await fetchKV(`get/user_sub_${userId}`);
    const isSubscribed = subData.result === "true";

    // 2. Проверяем и инициализируем баланс энергии (используем SETNX для атомарности)
    // Если ключа нет, создаем его с дефолтным значением
    await Promise.all([
      fetch(`${kvUrl}/set/user_energy_decisions_${userId}/${DEFAULT_ENERGY.decisions}/NX`, { headers: { Authorization: `Bearer ${kvToken}` } }),
      fetch(`${kvUrl}/set/user_energy_emotions_${userId}/${DEFAULT_ENERGY.emotions}/NX`, { headers: { Authorization: `Bearer ${kvToken}` } }),
      fetch(`${kvUrl}/set/user_energy_quests_${userId}/${DEFAULT_ENERGY.quests}/NX`, { headers: { Authorization: `Bearer ${kvToken}` } })
    ]);

    // 3. Проверяем наличие временных бонусов (от платежей)
    const bonusData = await fetchKV(`get/user_energy_bonus_${userId}`);
    const energyBonus = parseInt(bonusData.result) || 0;

    if (energyBonus > 0) {
      // Прибавляем бонус к основному балансу решений и удаляем бонусный ключ
      await fetch(`${kvUrl}/incrby/user_energy_decisions_${userId}/${energyBonus}`, { headers: { Authorization: `Bearer ${kvToken}` } });
      await fetch(`${kvUrl}/del/user_energy_bonus_${userId}`, { headers: { Authorization: `Bearer ${kvToken}` } });
    }

    // 4. Получаем финальные значения баланса
    const [decisions, emotions, quests] = await Promise.all([
      fetchKV(`get/user_energy_decisions_${userId}`),
      fetchKV(`get/user_energy_emotions_${userId}`),
      fetchKV(`get/user_energy_quests_${userId}`)
    ]);

    // 5. Регистрируем пользователя
    await fetch(`${kvUrl}/sadd/all_users/${userId}`, { headers: { Authorization: `Bearer ${kvToken}` } });

    return res.status(200).json({ 
      isSubscribed, 
      energy: {
        decisions: parseInt(decisions.result) || 0,
        emotions: parseInt(emotions.result) || 0,
        quests: parseInt(quests.result) || 0
      }
    });
  } catch (e) {
    console.error("Check sub error", e);
    return res.status(500).json({ isSubscribed: false, energy: DEFAULT_ENERGY });
  }
}
