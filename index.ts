export type Language = 'ISL' | 'ASL';

export type PageId = 'translator' | 'text-to-sign' | 'dictionary' | 'dataset' | 'about';

export interface SignEntry {
  id: string;
  language: Language;
  term: string;
  description: string;
  videoUrl: string;
  source: 'starter' | 'user-url' | 'user-upload';
}

export interface LandmarkSample {
  id: string;
  capturedAt: string;
  language: Language;
  label: string;
  /** One flattened [x,y,z,...] vector per detected hand. */
  hands: number[][];
}

export interface GesturePrediction {
  label: string;
  score: number;
  hands: number[][];
}
