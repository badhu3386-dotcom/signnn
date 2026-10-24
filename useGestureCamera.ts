import { useCallback, useEffect, useRef, useState } from 'react';
import type { GestureRecognizer } from '@mediapipe/tasks-vision';
import type { GesturePrediction } from '../types';
import { createGestureRecognizer, parseGestureResult } from '../services/gestureService';

export function useGestureCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const lastUiUpdateRef = useRef(0);
  const startRequestRef = useRef(0);
  const [status, setStatus] = useState('Camera is off');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const [hands, setHands] = useState<number[][]>([]);

  const stop = useCallback(() => {
    startRequestRef.current += 1;
    activeRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    recognizerRef.current?.close();
    recognizerRef.current = null;
    setRunning(false);
    setLoading(false);
    setStatus('Camera is off');
    setPrediction(null);
    setHands([]);
  }, []);

  const start = useCallback(async () => {
    if (activeRef.current || loading) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera access requires a supported browser and HTTPS or localhost.');
      return;
    }
    const requestId = ++startRequestRef.current;
    setLoading(true);
    setStatus('Requesting camera permission…');
    let pendingStream: MediaStream | null = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      pendingStream = stream;
      if (requestId !== startRequestRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      if (!videoRef.current) throw new Error('Camera preview is not ready.');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      lastVideoTimeRef.current = -1;

      setStatus('Loading hand-tracking model…');
      const recognizer = await createGestureRecognizer();
      if (requestId !== startRequestRef.current) { recognizer.close(); stream.getTracks().forEach((track) => track.stop()); return; }
      recognizerRef.current = recognizer;
      activeRef.current = true;
      setLoading(false);
      setRunning(true);
      setStatus('Camera active · generic gesture demo');

      const loop = () => {
        if (!activeRef.current) return;
        const video = videoRef.current;
        const currentRecognizer = recognizerRef.current;
        if (video && currentRecognizer && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          try {
            const result = currentRecognizer.recognizeForVideo(video, performance.now());
            const next = parseGestureResult(result);
            const now = performance.now();
            if (now - lastUiUpdateRef.current > 120) {
              setPrediction(next);
              setHands(next?.hands ?? []);
              lastUiUpdateRef.current = now;
            }
          } catch (error) {
            console.error('Gesture recognition frame failed:', error);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (error) {
      if (requestId !== startRequestRef.current) { pendingStream?.getTracks().forEach((track) => track.stop()); return; }
      console.error(error);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      recognizerRef.current?.close();
      recognizerRef.current = null;
      activeRef.current = false;
      setLoading(false);
      setRunning(false);
      setStatus(error instanceof Error ? error.message : 'Could not start the camera or load the model. Check permission and internet access.');
    }
  }, [loading]);

  useEffect(() => () => {
    startRequestRef.current += 1;
    activeRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recognizerRef.current?.close();
  }, []);

  return { videoRef, status, running, loading, prediction, hands, start, stop };
}
