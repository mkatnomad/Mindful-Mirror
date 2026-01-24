
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  const { userId } = req.query;

  if (!userId || !kvUrl || !kvToken) {
    return res.status(400).json({ isSubscribed: false });
  }

  try {
    const response = await fetch(`${kvUrl}/get/user_sub_${userId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const data = await response.json();
    
    // Upstash возвращает { result: "true" } или { result: null }
    return res.status(200).json({ isSubscribed: data.result === "true" });
  } catch (e) {
    return res.status(500).json({ isSubscribed: false });
  }
}
