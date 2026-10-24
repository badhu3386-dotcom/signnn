import { useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, Film, Pencil, Plus, Search, Trash2, Upload, Video, X } from 'lucide-react';
import type { Language, SignEntry } from '../types';

interface Props { language: Language; entries: SignEntry[]; onChange: (entries: SignEntry[]) => void; }

export default function SignDictionary({ language, entries, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'selected' | 'all'>('selected');
  const [term, setTerm] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const list = useMemo(() => entries.filter((entry) => (filter === 'all' || entry.language === language) && `${entry.term} ${entry.description}`.toLowerCase().includes(query.toLowerCase())), [entries, filter, language, query]);

  const resetForm = () => {
    setEditingId(null);
    setTerm('');
    setDescription('');
    setVideoUrl('');
    setVideoFile(null);
  };

  const beginAdd = () => {
    resetForm();
    setNotice('');
    setFormOpen((value) => !value);
  };

  const beginEdit = (entry: SignEntry) => {
    setEditingId(entry.id);
    setTerm(entry.term);
    setDescription(entry.description);
    setVideoUrl(entry.source === 'user-upload' ? '' : entry.videoUrl);
    setVideoFile(null);
    setFormOpen(true);
    setNotice('');
  };

  const addEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTerm = term.trim();
    const existing = editingId ? entries.find((item) => item.id === editingId) : undefined;
    if (!cleanTerm || (!videoUrl.trim() && !videoFile && !existing)) {
      setNotice('Enter a sign label and add a video URL or video file.');
      return;
    }
    const cleanedUrl = videoUrl.trim();
    if (!videoFile && cleanedUrl && !/^https?:\/\//i.test(cleanedUrl)) {
      setNotice('Use a valid http:// or https:// video URL.');
      return;
    }
    const resolvedUrl = videoFile ? URL.createObjectURL(videoFile) : cleanedUrl || existing?.videoUrl || '';
    if (!resolvedUrl) { setNotice('A video is required for each sign entry.'); return; }
    const source: SignEntry['source'] = videoFile ? 'user-upload' : cleanedUrl ? 'user-url' : existing?.source ?? 'user-url';
    const entry: SignEntry = {
      id: existing?.id ?? crypto.randomUUID(),
      language: existing?.language ?? language,
      term: cleanTerm,
      description: description.trim(),
      videoUrl: resolvedUrl,
      source,
    };
    if (existing) {
      if (existing.source === 'user-upload' && existing.videoUrl.startsWith('blob:') && existing.videoUrl !== resolvedUrl) URL.revokeObjectURL(existing.videoUrl);
      onChange(entries.map((item) => item.id === existing.id ? entry : item));
    } else {
      onChange([entry, ...entries]);
    }
    const fileOnly = Boolean(videoFile);
    resetForm();
    setFormOpen(false);
    setNotice(fileOnly ? `${existing ? 'Entry updated' : 'Video added'} for this browser session. Uploaded clips do not persist after reload.` : (existing ? 'Dictionary entry updated.' : 'Dictionary entry added and saved locally.'));
  };

  const removeEntry = (entry: SignEntry) => {
    if (entry.source === 'user-upload' && entry.videoUrl.startsWith('blob:')) URL.revokeObjectURL(entry.videoUrl);
    onChange(entries.filter((item) => item.id !== entry.id));
  };

  return <div className="page-stack">
    <div className="hero-strip hero-strip-purple"><div className="hero-icon"><Film size={21} /></div><div><strong>Your sign video library</strong><p>Only add signs that you have verified for the selected sign language.</p></div><div className="hero-language">{language} library</div></div>
    <section className="panel dictionary-toolbar"><div className="search-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search signs or descriptions…" /></div><select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value as 'selected' | 'all')} aria-label="Filter dictionary"><option value="selected">{language} only</option><option value="all">All languages</option></select><button className="button-primary" onClick={beginAdd}><Plus size={17} />Add sign</button></section>
    {notice && <div className="inline-notice" role="status">{notice}</div>}
    {formOpen && <section className="panel add-entry-panel"><div className="panel-head"><div><h2>{editingId ? 'Edit sign entry' : 'Add a verified sign clip'}</h2><p>{editingId ? 'Update this dictionary entry.' : `Entry will be assigned to ${language}.`}</p></div><button className="icon-button" aria-label="Close form" onClick={() => { setFormOpen(false); resetForm(); }}><X size={17} /></button></div><form onSubmit={addEntry} className="dictionary-form"><div className="form-two-col"><div><label htmlFor="sign-term">Word or sign label *</label><input id="sign-term" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="e.g. hello" required /></div><div><label htmlFor="sign-description">Description (optional)</label><input id="sign-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short usage note" /></div></div><div><label htmlFor="sign-url">Video URL</label><input id="sign-url" type="url" value={videoUrl} onChange={(event) => { setVideoUrl(event.target.value); if (event.target.value) setVideoFile(null); }} placeholder="https://example.com/verified-sign.mp4" /></div><div className="upload-zone"><Upload size={18} /><div><strong>Or upload a local video</strong><p>MP4, WebM or a browser-supported video. Upload is temporary for this session.</p></div><input aria-label="Upload sign video" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={(event) => { setVideoFile(event.target.files?.[0] ?? null); if (event.target.files?.length) setVideoUrl(''); }} /></div><div className="form-actions"><button type="button" className="button-secondary" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</button><button type="submit" className="button-primary">{editingId ? <Pencil size={15} /> : <Plus size={15} />}{editingId ? 'Update sign entry' : 'Save sign entry'}</button></div></form></section>}

    <div className="dictionary-intro-row"><div><h2>{filter === 'all' ? 'All sign entries' : `${language} sign entries`}</h2><p>{list.length} {list.length === 1 ? 'entry' : 'entries'} · Add licensed, verified clips from sources you are permitted to use.</p></div><span className="count-chip">{list.length} clips</span></div>
    {list.length ? <div className="dictionary-grid">{list.map((entry) => <article className="dictionary-card" key={entry.id}><div className="dictionary-video">{entry.videoUrl ? <video src={entry.videoUrl} controls preload="metadata" playsInline /> : <div className="dictionary-video-placeholder"><Video size={27} /><span>No video configured</span></div>}<span className="dictionary-language-tag">{entry.language}</span></div><div className="dictionary-card-body"><div className="dictionary-title-row"><div><h3>{entry.term}</h3><p>{entry.description || 'No description added.'}</p></div>{entry.source !== 'starter' && <div className="dictionary-card-actions"><button className="icon-button" title="Edit entry" aria-label={`Edit ${entry.term}`} onClick={() => beginEdit(entry)}><Pencil size={14} /></button><button className="icon-button danger-icon" title="Remove entry" aria-label={`Remove ${entry.term}`} onClick={() => removeEntry(entry)}><Trash2 size={15} /></button></div>}</div><div className="dictionary-card-foot"><span className="source-type">{entry.source === 'user-upload' ? 'Local session upload' : 'User-provided video URL'}</span>{entry.source === 'user-url' && <a href={entry.videoUrl} target="_blank" rel="noreferrer" aria-label={`Open source video for ${entry.term}`}><ExternalLink size={14} /></a>}</div></div></article>)}</div> : <section className="panel empty-state dictionary-empty"><div className="empty-transcript-icon"><Film size={22} /></div><h3>No verified sign clips found</h3><p>The starter dictionary is empty on purpose. Add a video that is verified for {language}, or switch to All languages to browse your saved entries.</p><button className="button-primary" onClick={() => { resetForm(); setFormOpen(true); }}><Plus size={16} />Add your first sign</button></section>}
    <div className="warning-note"><span className="note-symbol">i</span><p><strong>Language matters:</strong> ISL and ASL are distinct languages. Do not reuse a clip for both without verifying that the sign and meaning are appropriate in each language.</p></div>
  </div>;
}
