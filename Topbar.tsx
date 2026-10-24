import { Bell, CircleHelp, Menu } from 'lucide-react';
import type { PageId } from '../types';

const headings: Record<PageId, { title: string; subtitle: string }> = {
  translator: { title: 'Live Translator', subtitle: 'Turn supported gestures into text and spoken words.' },
  'text-to-sign': { title: 'Text to Sign', subtitle: 'Play verified sign clips for typed words.' },
  dictionary: { title: 'Sign Dictionary', subtitle: 'Manage your local library of sign-language video clips.' },
  dataset: { title: 'Dataset Lab', subtitle: 'Capture labelled hand-landmark samples for model training.' },
  about: { title: 'About SignBridge AI', subtitle: 'What this prototype can do—and what it cannot do yet.' },
};

export default function Topbar({ page, onMobileMenu }: { page: PageId; onMobileMenu: () => void }) {
  const heading = headings[page];
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMobileMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="page-heading"><h1>{heading.title}</h1><p>{heading.subtitle}</p></div>
      <div className="topbar-actions">
        <span className="prototype-badge"><span /> MVP Preview</span>
        <button className="icon-button" title="Help" aria-label="Help"><CircleHelp size={18} /></button>
        <button className="icon-button" title="Notifications" aria-label="Notifications"><Bell size={18} /></button>
        <div className="avatar" title="Local prototype">SB</div>
      </div>
    </header>
  );
}
