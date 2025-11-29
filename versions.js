import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'versions.json');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]') || [];
    // Remove fullContent from list when returning? We keep it for transparency.
    res.status(200).json(arr);
  } catch (e) {
    res.status(200).json([]);
  }
}