
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  if (!kvUrl || !kvToken) {
    return res.status(500).json({ total: 0, premium: 0, sessions: 0, minutes: 0, archetypes: {} });
  }

  try {
    const fetchKV = async (cmd: string) => {
      const r = await fetch(`${kvUrl}/${cmd}`, { headers: { Authorization: `Bearer ${kvToken}` } });
      return r.json();
    };

    const [all, prem, sess, mins, archs] = await Promise.all([
      fetchKV('scard/all_users'),
      fetchKV('scard/premium_users'),
      fetchKV('get/global_sessions'),
      fetchKV('get/global_minutes'),
      fetchKV('hgetall/archetype_counts')
    ]);

    // Обработка формата hgetall (он может возвращать массив или объект)
    const archetypesRaw = archs.result || [];
    const archetypes: Record<string, number> = {};
    if (Array.isArray(archetypesRaw)) {
      for (let i = 0; i < archetypesRaw.length; i += 2) {
        archetypes[archetypesRaw[i]] = parseInt(archetypesRaw[i+1]) || 0;
      }
    } else {
      Object.entries(archetypesRaw).forEach(([k, v]) => {
        archetypes[k] = parseInt(v as string) || 0;
      });
    }

    return res.status(200).json({ 
      total: all.result || 0, 
      premium: prem.result || 0,
      sessions: parseInt(sess.result) || 0,
      minutes: parseInt(mins.result) || 0,
      archetypes
    });
  } catch (e) {
    return res.status(500).json({ total: 0, premium: 0, sessions: 0, minutes: 0, archetypes: {} });
  }
}
