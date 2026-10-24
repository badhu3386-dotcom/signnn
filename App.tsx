import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LiveTranslator from './pages/LiveTranslator';
import TextToSign from './pages/TextToSign';
import SignDictionary from './pages/SignDictionary';
import DatasetLab from './pages/DatasetLab';
import About from './pages/About';
import type { Language, PageId, SignEntry } from './types';
import { loadDictionary, loadTranscript, saveDictionary, saveTranscript } from './services/storageService';

const pageNames: Record<PageId, string> = {
  translator: 'Live Translator',
  'text-to-sign': 'Text to Sign',
  dictionary: 'Sign Dictionary',
  dataset: 'Dataset Lab',
  about: 'About & Help',
};

export default function App() {
  const [page, setPage] = useState<PageId>('translator');
  const [language, setLanguage] = useState<Language>('ISL');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [words, setWords] = useState<string[]>(() => loadTranscript());
  const [entries, setEntries] = useState<SignEntry[]>(() => loadDictionary());

  useEffect(() => saveTranscript(words), [words]);
  useEffect(() => saveDictionary(entries), [entries]);

  const navigate = (next: PageId) => {
    setPage(next);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-root">
      {mobileNavOpen && <button className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <Sidebar page={page} onPageChange={navigate} language={language} onLanguageChange={setLanguage} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className={`app-main ${collapsed ? 'main-wide' : ''}`}>
        <Topbar page={page} onMobileMenu={() => setMobileNavOpen((value) => !value)} />
        <main className="main-content">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>{pageNames[page]}</strong></div>
          {page === 'translator' && <LiveTranslator language={language} words={words} onWordsChange={setWords} />}
          {page === 'text-to-sign' && <TextToSign language={language} entries={entries} onOpenDictionary={() => navigate('dictionary')} />}
          {page === 'dictionary' && <SignDictionary language={language} entries={entries} onChange={setEntries} />}
          {page === 'dataset' && <DatasetLab language={language} />}
          {page === 'about' && <About />}
          <footer className="app-footer"><div><span className="footer-brand-mark">SB</span><span>SignBridge AI <span className="footer-separator">·</span> Accessibility prototype</span></div><a href="https://github.com/new" target="_blank" rel="noreferrer">Create GitHub repo <ArrowUpRight size={13} /></a></footer>
        </main>
      </div>
    </div>
  );
}
