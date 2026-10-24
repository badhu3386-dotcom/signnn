import { Accessibility, AudioLines, BookOpen, Camera, Database, Info, Languages, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import type { Language, PageId } from '../types';

interface Props {
  page: PageId;
  onPageChange: (page: PageId) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: PageId; label: string; icon: typeof Camera }[] = [
  { id: 'translator', label: 'Live Translator', icon: Camera },
  { id: 'text-to-sign', label: 'Text to Sign', icon: AudioLines },
  { id: 'dictionary', label: 'Sign Dictionary', icon: BookOpen },
  { id: 'dataset', label: 'Dataset Lab', icon: Database },
  { id: 'about', label: 'About & Help', icon: Info },
];

export default function Sidebar({ page, onPageChange, language, onLanguageChange, collapsed, onToggle }: Props) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark"><Accessibility size={23} /></div>
        {!collapsed && <div className="brand-copy"><strong>SignBridge<span> AI</span></strong><small>COMMUNICATION FOR ALL</small></div>}
        <button className="icon-button sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {!collapsed && <div className="sidebar-label">WORKSPACE</div>}
      <nav className="side-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => onPageChange(id)} title={collapsed ? label : undefined}>
            <Icon size={18} strokeWidth={1.8} />
            {!collapsed && <span>{label}</span>}
            {!collapsed && id === 'translator' && <span className="nav-live-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {!collapsed && <div className="language-box">
          <div className="language-heading"><Languages size={15} /><span>Sign language</span></div>
          <select value={language} onChange={(event) => onLanguageChange(event.target.value as Language)} aria-label="Select sign language">
            <option value="ISL">Indian Sign Language · ISL</option>
            <option value="ASL">American Sign Language · ASL</option>
          </select>
          <p>Recognition vocabularies are kept separate.</p>
        </div>}
        {!collapsed && <div className="sidebar-note"><Sparkles size={15} /><span>Hackathon prototype</span></div>}
      </div>
    </aside>
  );
}
