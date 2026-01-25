
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  if (req.method !== 'POST' || !kvUrl || !kvToken) {
    return res.status(405).send('Method Not Allowed');
  }

  const { type, value } = req.body;

  try {
    const pipeline: any[] = [];

    if (type === 'session') {
      // Use seconds if provided, otherwise fallback to minutes * 60
      const seconds = value.seconds !== undefined ? parseInt(value.seconds) : (parseInt(value.minutes) * 60 || 0);
      const mode = value.mode || 'UNKNOWN';
      
      pipeline.push(['incr', 'global_sessions']);
      // We store raw seconds in the KV now for precision
      pipeline.push(['incrby', 'global_seconds_total', seconds]);
      
      // Segmented statistics in seconds
      pipeline.push(['hincrby', 'stats:sessions', mode, 1]);
      pipeline.push(['hincrby', 'stats:seconds_total', mode, seconds]);
      
    } else if (type === 'journal_entry') {
      const entryType = value.entryType || 'UNKNOWN';
      pipeline.push(['hincrby', 'stats:journal_types', entryType, 1]);
      
    } else if (type === 'test_started') {
      pipeline.push(['incr', 'stats:test_starts']);
      
    } else if (type === 'archetype' || type === 'test_finished') {
      const archName = value.name;
      pipeline.push(['hincrby', 'archetype_counts', archName, 1]);
      pipeline.push(['incr', 'stats:test_finished']);
    }

    if (pipeline.length > 0) {
      await fetch(`${kvUrl}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}` },
        body: JSON.stringify(pipeline)
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("Report event error:", e);
    return res.status(500).json({ success: false });
  }
}
