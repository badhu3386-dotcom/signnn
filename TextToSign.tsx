import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleHelp, Film, Mic, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { Language, SignEntry } from '../types';

interface Props { language: Language; entries: SignEntry[]; onOpenDictionary: () => void; }

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export default function TextToSign({ language, entries, onOpenDictionary }: Props) {
  const [text, setText] = useState('HELLO');
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()).filter(Boolean), [text]);
  const sequence = words.map((word) => ({ word, entry: entries.find((item) => item.language === language && item.term.toLowerCase() === word) ?? null }));
  const safeIndex = Math.min(index, Math.max(0, sequence.length - 1));
  useEffect(() => () => {
    if (speechRef.current) {
      speechRef.current.onend = null;
      speechRef.current.onerror = null;
      speechRef.current.onresult = null;
      speechRef.current.stop();
    }
  }, []);

  const toggleSpeechInput = () => {
    if (listening) { speechRef.current?.stop(); setListening(false); return; }
    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setSpeechNotice('Speech input is not supported in this browser. You can still type your message.'); return; }
    try {
      const recognition = new Recognition();
      speechRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1]?.[0]?.transcript?.trim();
        if (transcript) { setText(transcript); setIndex(0); setIsPlaying(false); setSpeechNotice('Speech captured. Review your text before playing signs.'); }
      };
      recognition.onerror = (event) => { setSpeechNotice(`Speech input error: ${event.error}. You can type your message instead.`); setListening(false); };
      recognition.onend = () => setListening(false);
      recognition.start();
      setListening(true);
      setSpeechNotice('Listening… speak clearly. Your browser may process speech through its speech service; review the text before proceeding.');
    } catch { setListening(false); setSpeechNotice('Could not start speech input. Check microphone permissions.'); }
  };
  const current = sequence[safeIndex];

  return <div className="page-stack">
    <div className="hero-strip hero-strip-purple"><div className="hero-icon"><Volume2 size={21} /></div><div><strong>Give words a visual voice</strong><p>Play verified sign clips for words in your message. Available signs depend on your dictionary.</p></div><div className="hero-language">{language} library</div></div>
    <div className="text-sign-grid">
      <section className="panel text-entry-panel">
        <div className="panel-head"><div><h2>Your message</h2><p>Enter a word or a short sentence.</p></div></div>
        <div className="text-label-row"><label htmlFor="message-text">Text to convert</label><button className={`button-secondary speech-button ${listening ? 'is-listening' : ''}`} onClick={toggleSpeechInput}><Mic size={14} />{listening ? 'Stop listening' : 'Speak message'}</button></div>
        <textarea id="message-text" value={text} onChange={(event) => { setText(event.target.value); setIndex(0); setIsPlaying(false); }} placeholder="Type a message…" rows={5} />
        <p className="speech-privacy-note">Speech recognition availability and processing depend on your browser. Type your message instead if you do not want to use its speech service.</p>
        {speechNotice && <div className="inline-notice speech-notice" role="status">{speechNotice}</div>}
        <div className="input-foot"><span>{words.length} words</span><button className="text-button" onClick={() => { setText(''); setIndex(0); setIsPlaying(false); }}>Clear text</button></div>
        <div className="feature-checks"><div><span className="check-bullet">✓</span><span>Matches clips from the selected language only</span></div><div><span className="check-bullet">✓</span><span>Highlights words that have no matching video</span></div><div><span className="check-bullet">✓</span><span>Matches clips from your configured dictionary</span></div></div>
        <button className="button-primary full-width" onClick={() => { setIndex(0); setIsPlaying(false); }}><Film size={17} />Prepare sign sequence</button>
      </section>
      <section className="panel sign-player-panel">
        <div className="panel-head"><div><h2>Sign playback</h2><p>{sequence.length ? `Word ${safeIndex + 1} of ${sequence.length}` : 'Ready for your message'}</p></div><span className="mini-tag">{language}</span></div>
        <div className="sign-video-wrap">
          {current?.entry ? <video key={current.entry.id} className="sign-video" controls playsInline src={current.entry.videoUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}>Your browser does not support video playback.</video> : <div className="sign-empty"><div className="sign-empty-icon"><Film size={30} /></div><span className="eyebrow">{current ? 'SIGN CLIP UNAVAILABLE' : 'NO MESSAGE'}</span><h3>{current ? `No ${language} clip for “${current.word}”` : 'Your sign sequence will appear here'}</h3><p>{current ? 'Add a verified video for this word in the Sign Dictionary to enable playback.' : 'Enter a word above to check your sign dictionary.'}</p><button className="button-secondary" onClick={onOpenDictionary}>Open sign dictionary <ArrowRight size={15} /></button></div>}
        </div>
        <div className="current-word-row"><div><span className="eyebrow">CURRENT WORD</span><strong>{current?.word ?? '—'}</strong><span className="word-availability">{current?.entry ? 'Clip available' : current ? 'Needs a clip' : 'Waiting for text'}</span></div><span className={`availability-dot ${current?.entry ? 'available' : ''}`} /></div>
        <div className="player-controls"><button className="icon-button" aria-label="Previous word" onClick={() => { setIndex((value) => Math.max(0, value - 1)); setIsPlaying(false); }} disabled={safeIndex === 0}><ArrowLeft size={17} /></button><button className="button-primary play-button" onClick={() => { const video = document.querySelector<HTMLVideoElement>('.sign-video'); if (video) { if (video.paused) void video.play(); else video.pause(); } else setIsPlaying(false); }} disabled={!current?.entry}><span>{isPlaying ? <Pause size={16} /> : <Play size={16} />}</span>{isPlaying ? 'Pause clip' : 'Play sign'}</button><button className="icon-button" aria-label="Next word" onClick={() => { setIndex((value) => Math.min(sequence.length - 1, value + 1)); setIsPlaying(false); }} disabled={safeIndex >= sequence.length - 1}><ArrowRight size={17} /></button><button className="icon-button" aria-label="Reset sequence" onClick={() => { setIndex(0); setIsPlaying(false); }}><RotateCcw size={16} /></button></div>
        <div className="divider" />
        <div className="sequence-heading"><strong>Word sequence</strong><span>Tap a word to view its clip</span></div>
        <div className="word-sequence">{sequence.length ? sequence.map((item, i) => <button key={`${i}-${item.word}`} onClick={() => { setIndex(i); setIsPlaying(false); }} className={`sequence-word ${i === safeIndex ? 'sequence-active' : ''} ${item.entry ? 'sequence-available' : 'sequence-missing'}`}><span>{item.word}</span><small>{item.entry ? 'Clip ready' : 'Missing clip'}</small></button>) : <div className="sequence-empty"><CircleHelp size={15} />Type a message to create a word sequence.</div>}</div>
      </section>
    </div>
    <div className="warning-note"><CircleHelp size={16} /><p><strong>Translation note:</strong> Playing isolated word clips consecutively is not the same as generating fluent sign-language grammar. This tool is a dictionary-based demonstration.</p></div>
  </div>;
}
