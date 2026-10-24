import {
  FilesetResolver,
  GestureRecognizer,
  type GestureRecognizerResult,
} from '@mediapipe/tasks-vision';
import type { GesturePrediction } from '../types';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

export async function createGestureRecognizer(): Promise<GestureRecognizer> {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return GestureRecognizer.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

function flattenLandmarks(landmarks: Array<{ x: number; y: number; z: number }>): number[] {
  return landmarks.flatMap((point) => [point.x, point.y, point.z]);
}

export function parseGestureResult(result: GestureRecognizerResult): GesturePrediction | null {
  const hands = (result.landmarks ?? []).map(flattenLandmarks);
  const candidates = result.gestures?.flatMap((handGestures) => handGestures) ?? [];
  const best = [...candidates]
    .filter((candidate) => candidate.categoryName && candidate.categoryName !== 'None')
    .sort((a, b) => b.score - a.score)[0];

  if (!best) return hands.length ? { label: 'Hand detected — no generic gesture', score: 0, hands } : null;
  return { label: best.categoryName.replaceAll('_', ' '), score: best.score, hands };
}
