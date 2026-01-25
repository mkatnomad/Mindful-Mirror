
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

    const [all, prem, sess, secs, archs, segSess, segSecs, jTypes, tStarts, tFinished] = await Promise.all([
      fetchKV('scard/all_users'),
      fetchKV('scard/premium_users'),
      fetchKV('get/global_sessions'),
      fetchKV('get/global_seconds_total'),
      fetchKV('hgetall/archetype_counts'),
      fetchKV('hgetall/stats:sessions'),
      fetchKV('hgetall/stats:seconds_total'),
      fetchKV('hgetall/stats:journal_types'),
      fetchKV('get/stats:test_starts'),
      fetchKV('get/stats:test_finished')
    ]);

    const parseHash = (raw: any) => {
      const data = raw.result || [];
      const result: Record<string, number> = {};
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i += 2) {
          result[data[i]] = parseInt(data[i+1]) || 0;
        }
      } else {
        Object.entries(data).forEach(([k, v]) => {
          result[k] = parseInt(v as string) || 0;
        });
      }
      return result;
    };

    return res.status(200).json({ 
      total: all.result || 0, 
      premium: prem.result || 0,
      sessions: parseInt(sess.result) || 0,
      totalSeconds: parseInt(secs.result) || 0,
      archetypes: parseHash(archs),
      segmentedSessions: parseHash(segSess),
      segmentedSeconds: parseHash(segSecs),
      journalTypes: parseHash(jTypes),
      testStarts: parseInt(tStarts.result) || 0,
      testFinished: parseInt(tFinished.result) || 0
    });
  } catch (e) {
    return res.status(500).json({ total: 0, premium: 0, sessions: 0, minutes: 0, archetypes: {} });
  }
}
