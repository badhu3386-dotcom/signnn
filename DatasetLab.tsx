import { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Download, FileJson, FileSpreadsheet, Hand, Info, Trash2 } from 'lucide-react';
import type { Language, LandmarkSample } from '../types';
import { useGestureCamera } from '../hooks/useGestureCamera';
import { exportSamplesCSV, exportSamplesJSON } from '../services/storageService';

interface Props { language: Language; }

export default function DatasetLab({ language }: Props) {
  const { videoRef, status, running, loading, hands, start, stop } = useGestureCamera();
  const [label, setLabel] = useState('HELLO');
  const [samples, setSamples] = useState<LandmarkSample[]>([]);
  const [notice, setNotice] = useState('');
  const grouped = useMemo(() => samples.filter((sample) => sample.language === language).reduce<Record<string, number>>((acc, sample) => { acc[sample.label] = (acc[sample.label] ?? 0) + 1; return acc; }, {}), [samples, language]);

  const capture = () => {
    const cleanLabel = label.trim().replace(/\s+/g, '_').toUpperCase();
    if (!cleanLabel) { setNotice('Enter a sign label before capturing.'); return; }
    if (!hands.length || !hands.some((hand) => hand.length === 63)) { setNotice('No complete hand landmarks detected. Put your hand clearly in view and try again.'); return; }
    const sample: LandmarkSample = { id: crypto.randomUUID(), capturedAt: new Date().toISOString(), language, label: cleanLabel, hands: hands.map((hand) => [...hand]) };
    setSamples((previous) => [...previous, sample]);
    setNotice(`Captured sample ${samples.length + 1} for ${cleanLabel}.`);
  };

  return <div className="page-stack">
    <div className="hero-strip hero-strip-orange"><div className="hero-icon"><Hand size={21} /></div><div><strong>Build your training dataset</strong><p>Collect labelled hand-landmark vectors. These exports are training data—not a trained recognition model.</p></div><div className="hero-language">{language} dataset</div></div>
    <div className="dataset-grid">
      <section className="panel dataset-camera-panel">
        <div className="panel-head"><div><h2>Capture station</h2><p>Use a stable, clear hand pose for each sample.</p></div><span className={`live-pill ${running ? 'is-live' : ''}`}><span />{running ? 'LIVE' : 'OFFLINE'}</span></div>
        <div className={`dataset-video ${running ? 'dataset-video-running' : ''}`}><video ref={videoRef} autoPlay muted playsInline aria-label="Dataset collection camera" />{!running && <div className="camera-placeholder"><div className="camera-placeholder-icon"><Camera size={28} /></div><strong>Camera is off</strong><p>Start the camera to collect landmark samples.</p></div>}</div>
        <div className="camera-controls"><button className={running ? 'button-danger' : 'button-primary'} disabled={loading} onClick={() => running ? stop() : void start()}>{running ? <><Camera size={16} />Stop camera</> : <><Camera size={16} />{loading ? 'Starting…' : 'Start camera'}</>}</button><div className="camera-status"><span className={`status-dot ${running ? 'status-green' : ''}`} />{status}</div></div>
        <div className="divider" />
        <label htmlFor="sample-label">Sign label</label><input id="sample-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. HELLO or THANK_YOU" />
        <div className="capture-meta"><span>Language <strong>{language}</strong></span><span>Hands detected <strong>{hands.length}</strong></span></div>
        <button className="button-primary full-width" onClick={capture} disabled={!running || !hands.length}><Hand size={16} />Capture landmark sample</button>
        {notice && <div className="inline-notice" role="status">{notice}</div>}
        <p className="privacy-note"><Info size={14} />Only numerical landmarks are captured. No webcam frame or video is saved by this tool.</p>
      </section>

      <section className="panel dataset-summary-panel">
        <div className="panel-head"><div><h2>Dataset overview</h2><p>Samples created in this session.</p></div><span className="count-chip">{samples.length} samples</span></div>
        <div className="dataset-stats"><div className="dataset-stat"><span>Total samples</span><strong>{samples.length}</strong></div><div className="dataset-stat"><span>Labels</span><strong>{Object.keys(grouped).length}</strong></div></div>
        <div className="dataset-list-head"><strong>Labels in {language}</strong><span>Sample count</span></div>
        {Object.keys(grouped).length ? <div className="label-list">{Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => <div className="label-row" key={name}><span className="label-avatar">{name.slice(0, 1)}</span><strong>{name}</strong><span className="sample-count">{count}</span></div>)}</div> : <div className="empty-state small-empty"><div className="empty-transcript-icon"><FileSpreadsheet size={21} /></div><strong>No samples for {language} yet</strong><p>Start the camera, enter a label and capture hand landmarks.</p></div>}
        <div className="divider" />
        <div className="export-block"><strong>Export training data</strong><p>Capture samples across multiple people and sessions. Export and then train a separate classifier.</p><div className="export-buttons"><button className="button-secondary" onClick={() => exportSamplesJSON(samples)} disabled={!samples.length}><FileJson size={16} />Export JSON</button><button className="button-secondary" onClick={() => exportSamplesCSV(samples)} disabled={!samples.length}><Download size={16} />Export CSV</button></div></div>
        <div className="warning-note"><AlertTriangle size={16} /><p><strong>Model limitation:</strong> a single landmark frame cannot represent moving signs. For dynamic signs, capture frame sequences and preserve their order.</p></div>
      </section>
    </div>
    <section className="panel sample-table-panel"><div className="panel-head"><div><h2>Recent samples</h2><p>Review or remove samples before exporting.</p></div><button className="button-quiet" onClick={() => { setSamples([]); setNotice('All samples removed from this session.'); }} disabled={!samples.length}><Trash2 size={15} />Clear session</button></div>
      {samples.length ? <div className="table-wrap"><table><thead><tr><th>Label</th><th>Language</th><th>Hands</th><th>Captured</th><th /></tr></thead><tbody>{[...samples].reverse().map((sample) => <tr key={sample.id}><td><span className="table-label">{sample.label}</span></td><td>{sample.language}</td><td>{sample.hands.length}</td><td>{new Date(sample.capturedAt).toLocaleTimeString()}</td><td><button className="icon-button danger-icon" aria-label={`Delete ${sample.label} sample`} onClick={() => setSamples((list) => list.filter((item) => item.id !== sample.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <div className="empty-table">No samples captured during this session.</div>}
    </section>
  </div>;
}
