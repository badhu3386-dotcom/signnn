import { useEffect, useState } from 'react';
import { AlertCircle, Camera, Check, CircleStop, Hand, Mic2, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import type { Language } from '../types';
import { useGestureCamera } from '../hooks/useGestureCamera';
import { speakText, stopSpeaking } from '../services/speechService';

interface Props {
  language: Language;
  words: string[];
  onWordsChange: (words: string[]) => void;
}

export default function LiveTranslator({ language, words, onWordsChange }: Props) {
  const { videoRef, status, running, loading, prediction, start, stop } = useGestureCamera();
  const [notice, setNotice] = useState('');
  const [manualWord, setManualWord] = useState('');

  useEffect(() => () => stopSpeaking(), []);

  const addWord = (word: string) => {
    const clean = word.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    onWordsChange([...words, clean]);
    setNotice(`Added “${clean}” to your transcript.`);
  };

  const predictionIsGeneric = Boolean(prediction && prediction.score > 0);

  return (
    <div className="page-stack">
      <div className="hero-strip">
        <div className="hero-icon"><Sparkles size={21} /></div>
        <div><strong>Speak with your hands</strong><p>Start the camera to test the live gesture pipeline. Generic gestures are a demo, not ISL/ASL translation.</p></div>
        <div className="hero-language"><span className="status-dot" /> {language} selected</div>
      </div>

      <div className="translator-grid">
        <section className="panel camera-panel">
          <div className="panel-head"><div><h2>Live camera</h2><p>Position your hand clearly inside the frame.</p></div><span className={`live-pill ${running ? 'is-live' : ''}`}><span />{running ? 'LIVE' : 'OFFLINE'}</span></div>
          <div className={`camera-viewport ${running ? 'camera-running' : ''}`}>
            <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />
            {!running && <div className="camera-placeholder"><div className="camera-placeholder-icon"><Camera size={30} /></div><strong>Your camera preview</strong><p>Camera remains off until you start it.</p></div>}
            {running && <div className="camera-overlay-label"><span className="recording-dot" /> Hand tracking active</div>}
            <div className="camera-corner camera-corner-tl" /><div className="camera-corner camera-corner-tr" /><div className="camera-corner camera-corner-bl" /><div className="camera-corner camera-corner-br" />
          </div>
          <div className="camera-controls">
            {!running ? <button className="button-primary" onClick={() => { setNotice(''); void start(); }} disabled={loading}><Camera size={17} />{loading ? 'Starting camera…' : 'Start camera'}</button> : <button className="button-danger" onClick={stop}><CircleStop size={17} />Stop camera</button>}
            <div className="camera-status"><span className={`status-dot ${running ? 'status-green' : ''}`} /><span>{status}</span></div>
          </div>
          {!running && <p className="privacy-note"><AlertCircle size={14} /> Your webcam is accessed only after you press Start camera. Video is processed locally by the browser.</p>}
        </section>

        <section className="panel result-panel">
          <div className="panel-head"><div><h2>Recognition result</h2><p>Generic MediaPipe gesture demo</p></div><span className="mini-tag">BETA</span></div>
          <div className="prediction-box">
            <div className="prediction-symbol"><Hand size={30} /></div>
            <div className="prediction-copy"><span className="eyebrow">CURRENT PREDICTION</span><h3>{prediction?.label ?? 'Waiting for a hand'}</h3><p>{!running ? 'Start the camera to begin.' : prediction ? (prediction.score > 0 ? 'Generic gesture detected.' : 'Hand landmarks detected; no generic gesture matched.') : 'Move a hand into view.'}</p></div>
          </div>
          <div className="metric-row">
            <div className="metric-card"><span>Model confidence</span><strong>{predictionIsGeneric ? `${Math.round((prediction?.score ?? 0) * 100)}%` : '—'}</strong><div className="confidence-track"><span style={{ width: `${predictionIsGeneric ? Math.round((prediction?.score ?? 0) * 100) : 0}%` }} /></div></div>
            <div className="metric-card"><span>Hands tracked</span><strong>{prediction?.hands.length ?? 0}<small> / 2</small></strong><div className="hand-marks"><span className={(prediction?.hands.length ?? 0) > 0 ? 'mark-on' : ''} /><span className={(prediction?.hands.length ?? 0) > 1 ? 'mark-on' : ''} /></div></div>
          </div>
          <div className="warning-note"><AlertCircle size={16} /><p><strong>Important:</strong> This result is from MediaPipe’s generic gesture classifier. It is not an ISL/ASL word prediction until you train and load a separate language-specific model.</p></div>
          <div className="divider" />
          <div className="manual-confirm"><label htmlFor="manual-word">Add a confirmed word</label><div className="input-action-row"><input id="manual-word" value={manualWord} onChange={(event) => setManualWord(event.target.value)} placeholder="Type a word to add…" onKeyDown={(event) => { if (event.key === 'Enter') { addWord(manualWord); setManualWord(''); } }} /><button className="button-secondary" onClick={() => { addWord(manualWord); setManualWord(''); }}><Check size={15} />Add word</button></div><p>For now, confirm the meaning yourself before adding text to the transcript.</p></div>
          {predictionIsGeneric && <button className="button-secondary full-width" onClick={() => addWord(prediction?.label ?? '')}><Check size={16} />Add generic label to transcript</button>}
        </section>
      </div>

      <section className="panel transcript-panel">
        <div className="panel-head"><div><h2>Conversation transcript</h2><p>Review words before speaking them aloud.</p></div><span className="count-chip">{words.length} {words.length === 1 ? 'word' : 'words'}</span></div>
        <div className={`transcript-content ${words.length ? '' : 'transcript-empty'}`}>
          {words.length ? words.map((word, index) => <span className="transcript-word" key={`${index}-${word}`}>{word}<button aria-label={`Remove ${word}`} onClick={() => onWordsChange(words.filter((_, i) => i !== index))}><X size={12} /></button></span>) : <><div className="empty-transcript-icon"><Mic2 size={21} /></div><strong>Your transcript will appear here</strong><p>Confirm a word or add one manually to build a message.</p></>}
        </div>
        <div className="transcript-actions"><span className="privacy-small">Transcript is saved locally in this browser.</span><div className="button-cluster"><button className="button-secondary" onClick={() => { onWordsChange([]); setNotice('Transcript cleared.'); }} disabled={!words.length}><RotateCcw size={15} />Clear</button><button className="button-primary" onClick={() => { const ok = speakText(words.join(' ')); setNotice(ok ? 'Speaking transcript.' : 'Speech synthesis is not supported in this browser.'); }} disabled={!words.length}><Volume2 size={16} />Speak transcript</button></div></div>
        {notice && <div className="inline-notice" role="status">{notice}</div>}
      </section>
    </div>
  );
}
