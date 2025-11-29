import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_FILE = path.join(process.cwd(), 'data', 'versions.json');

function loadVersions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function saveVersions(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// Normalize text -> array of words (lowercased, basic punctuation removed)
function tokenize(text) {
  if (!text) return [];
  return text
    .replace(/[.,\\/#!$%\\^&\\*;:{}=\\-_`~()\\[\\]"]/g, '')
    .replace(/\\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
}

// produce counts map
function counts(arr) {
  const m = {};
  arr.forEach(w => m[w] = (m[w] || 0) + 1);
  return m;
}

// get added and removed words between old and new (multiset difference)
function diffWords(oldText, newText) {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  const oldCounts = counts(oldTokens);
  const newCounts = counts(newTokens);

  const added = [];
  const removed = [];

  // check new - old for additions
  for (const w of Object.keys(newCounts)) {
    const diff = newCounts[w] - (oldCounts[w] || 0);
    for (let i=0;i<diff;i++) if (diff>0) added.push(w);
  }
  // check old - new for removals
  for (const w of Object.keys(oldCounts)) {
    const diff = oldCounts[w] - (newCounts[w] || 0);
    for (let i=0;i<diff;i++) if (diff>0) removed.push(w);
  }
  // unique lists (optional) - here we return unique words as arrays
  return {
    addedWords: Array.from(new Set(added)),
    removedWords: Array.from(new Set(removed))
  };
}

function formatTimestamp(d = new Date()) {
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { newContent } = req.body || {};
  const versions = loadVersions();
  const last = versions.length > 0 ? versions[versions.length - 1] : null;
  const oldContent = last ? (last.fullContent || '') : '';

  const oldLength = (oldContent || '').length;
  const newLength = (newContent || '').length;

  const { addedWords, removedWords } = diffWords(oldContent, newContent);

  const entry = {
    id: uuidv4(),
    timestamp: formatTimestamp(new Date()),
    addedWords,
    removedWords,
    oldLength,
    newLength,
    fullContent: newContent
  };

  versions.push(entry);
  try {
    saveVersions(versions);
    res.status(200).json(entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save' });
  }
}