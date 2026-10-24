import type { LandmarkSample, SignEntry } from '../types';
import { starterDictionary } from '../data/signDictionary';

const DICTIONARY_KEY = 'signbridge.dictionary.v1';
const TRANSCRIPT_KEY = 'signbridge.transcript.v1';

export function loadDictionary(): SignEntry[] {
  try {
    const raw = localStorage.getItem(DICTIONARY_KEY);
    if (!raw) return starterDictionary;
    const parsed = JSON.parse(raw) as SignEntry[];
    // Blob URLs cannot survive a page reload. Discard those entries on load.
    return parsed.filter((entry) => !entry.videoUrl.startsWith('blob:'));
  } catch {
    return starterDictionary;
  }
}

export function saveDictionary(entries: SignEntry[]): void {
  try {
    localStorage.setItem(DICTIONARY_KEY, JSON.stringify(entries.filter((entry) => !entry.videoUrl.startsWith('blob:'))));
  } catch {
    // Usually a storage quota or browser privacy setting. The in-memory app still works.
  }
}

export function loadTranscript(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(TRANSCRIPT_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveTranscript(words: string[]): void {
  try { localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(words.slice(-100))); } catch { /* Optional persistence. */ }
}

export function exportSamplesJSON(samples: LandmarkSample[]): void {
  downloadFile(JSON.stringify({ format: 'signbridge-landmarks-v1', exportedAt: new Date().toISOString(), samples }, null, 2), 'signbridge-landmarks.json', 'application/json');
}

export function exportSamplesCSV(samples: LandmarkSample[]): void {
  const maxHands = Math.max(0, ...samples.map((sample) => sample.hands.length));
  const handColumns = Array.from({ length: maxHands }, (_, handIndex) =>
    Array.from({ length: 63 }, (_, index) => `hand${handIndex + 1}_${['x', 'y', 'z'][index % 3]}${Math.floor(index / 3) + 1}`),
  ).flat();
  const header = ['id', 'capturedAt', 'language', 'label', 'handCount', ...handColumns];
  const rows = samples.map((sample) => {
    const values = sample.hands.flatMap((hand) => hand);
    const expected = maxHands * 63;
    while (values.length < expected) values.push('' as unknown as number);
    return [sample.id, sample.capturedAt, sample.language, sample.label, sample.hands.length, ...values];
  });
  const csv = [header, ...rows].map((row) => row.map((value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(',')).join('\n');
  downloadFile(csv, 'signbridge-landmarks.csv', 'text/csv;charset=utf-8');
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
