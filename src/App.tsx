import { useCallback, useEffect, useState } from 'react'
import { Home, ToolsHub, ToolPage, ClusterHub, ArticlePage, LegalPage } from './pages'
import { StoriesIndex } from './pages-stories'
import { DISCLOSURE } from './affiliate-config'
import { SX_TOOLS } from './content-tools'
import { SX_ARTICLES } from './content-articles'

export type Lang = 'hi' | 'en'
const LANG_KEY = 'sx-lang'
const THEME_KEY = 'sx-theme'

function initialLang(): { lang: Lang; chosen: boolean } {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'hi' || saved === 'en') return { lang: saved, chosen: true }
  } catch { /* private mode */ }
  return { lang: 'hi', chosen: false }
}

function initialTheme(): 'light' | 'dark' {
  try {
    const d = document.documentElement.dataset.theme
    if (d === 'dark' || d === 'light') return d
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch { /* ignore */ }
  return 'light'
}

export function Logo({ lang }: { lang: Lang }) {
  return (
    <a className="logo" href="/">
      <span className="logo-leaf" aria-hidden="true"><svg viewBox="0 0 64 64" width="30" height="30" role="img"><path d="M32 54 C12 42 15 18 32 9 C49 18 52 42 32 54 Z" fill="#a84b1d"/><path d="M32 49 L32 16" stroke="#9a4707" strokeWidth="3.5" strokeLinecap="round"/></svg></span>
      <span>
        <span className="logo-name">SwasthX</span>
        <span className="logo-tag" style={{ display: 'block' }}>{lang === 'hi' ? 'बीमारी की जड़ तक' : 'To the root of it'}</span>
      </span>
    </a>
  )
}

export function SiteHeader({ lang, pick, theme, toggleTheme }: { lang: Lang; pick: (l: Lang) => void; theme?: 'light' | 'dark'; toggleTheme?: () => void }) {
  const hi = lang === 'hi'
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])
  const close = () => setMenuOpen(false)
  return (
    <header className="site-header">
      <Logo lang={lang} />
      <nav id="primary-nav" className={menuOpen ? 'nav open' : 'nav'} aria-label="Primary">
        <a href="/gut" onClick={close}>{hi ? 'पेट' : 'Gut'}</a>
        <a href="/hair" onClick={close}>{hi ? 'बाल' : 'Hair'}</a>
        <a href="/deficiency" onClick={close}>{hi ? 'कमियाँ' : 'Deficiencies'}</a>
        <a href="/tools" onClick={close}>Tools</a>
        <a href="/stories" onClick={close}>{hi ? 'स्टोरीज़' : 'Stories'}</a>
      </nav>
      <div className="header-controls">
        <div className="lang-toggle" role="group" aria-label="Language">
          <button className={hi ? 'on' : ''} onClick={() => pick('hi')} aria-pressed={hi}>हिं</button>
          <button className={!hi ? 'on' : ''} onClick={() => pick('en')} aria-pressed={!hi}>EN</button>
        </div>
        {toggleTheme && (
          <button className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        )}
        <button
          className="menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          aria-label={menuOpen ? (hi ? 'मेनू बंद करें' : 'Close menu') : (hi ? 'मेनू खोलें' : 'Open menu')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            {menuOpen
              ? <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              : <path d="M4 7 H20 M4 12 H20 M4 17 H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />}
          </svg>
        </button>
      </div>
    </header>
  )
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const hi = lang === 'hi'
  return (
    <footer className="site-footer">
      <Logo lang={lang} />
      <p className="disclaimer">{hi
        ? 'SwasthX पर दी गई जानकारी शैक्षणिक है — यह किसी बीमारी का निदान या इलाज नहीं है। कोई भी तकलीफ़ हो, या लेख में बताए गए ख़तरे के लक्षण दिखें, तो डॉक्टर से मिलें।'
        : 'Information on SwasthX is educational — it is not a diagnosis or treatment for any condition. If you are unwell, or notice any red-flag symptom described in an article, please see a doctor.'}</p>
      <p className="muted">{DISCLOSURE}</p>
      <p className="muted">© 2026 SwasthX • <a href="/about">{hi ? 'बारे में' : 'About'}</a> • <a href="/privacy-policy">Privacy</a> • <a href="/disclaimer">{hi ? 'अस्वीकरण' : 'Disclaimer'}</a></p>
    </footer>
  )
}

export function pageFor(path: string, lang: Lang, go: (p: string) => void): React.ReactNode {
  const p = path.replace(/\/$/, '') || '/'
  if (p === '/') return <Home lang={lang} go={go} />
  if (p === '/stories') return <StoriesIndex lang={lang} />
  if (p === '/tools') return <ToolsHub lang={lang} />
  let m = p.match(/^\/tools\/([a-z0-9-]+)$/)
  if (m && SX_TOOLS.some((t) => t.slug === m![1])) return <ToolPage lang={lang} slug={m[1]} />
  m = p.match(/^\/(gut|hair|deficiency)$/)
  if (m) return <ClusterHub lang={lang} cluster={m[1]} />
  m = p.match(/^\/(gut|hair|deficiency)\/([a-z0-9-]+)$/)
  if (m) {
    const a = SX_ARTICLES.find((x) => x.slug === m![2] && x.cluster === m![1])
    if (a) return <ArticlePage lang={lang} article={a} />
  }
  if (p === '/about' || p === '/privacy-policy' || p === '/disclaimer') return <LegalPage lang={lang} slug={p.slice(1)} />
  return <Home lang={lang} go={go} />
}

function usePathRoute() {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const on = () => setPath(window.location.pathname)
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  const go = useCallback((p: string) => {
    window.history.pushState({}, '', p)
    setPath(p)
    window.scrollTo({ top: 0 })
  }, [])
  return { path, go }
}

export default function App() {
  const [{ lang, chosen }, setState] = useState(initialLang)
  const [showPopup, setShowPopup] = useState(!chosen)
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)
  const { path, go } = usePathRoute()

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'
  }, [lang])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const pick = (l: Lang) => {
    try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ }
    setState({ lang: l, chosen: true })
    setShowPopup(false)
  }

  return (
    <div className="app">
      {showPopup && (
        <div className="popup-scrim" role="dialog" aria-modal="true" aria-label="Choose language">
          <div className="popup">
            <Logo lang="hi" />
            <h2>अपनी भाषा चुनें · Choose your language</h2>
            <p>SwasthX हिंदी में सबसे अच्छा पढ़ा जाता है।</p>
            <button className="btn btn-primary big" onClick={() => pick('hi')}>हिंदी में पढ़ें</button>
            <button className="btn btn-ghost big" onClick={() => pick('en')}>Continue in English</button>
          </div>
        </div>
      )}
      <SiteHeader lang={lang} pick={pick} theme={theme} toggleTheme={() => setTheme((th) => (th === 'dark' ? 'light' : 'dark'))} />
      {pageFor(path, lang, go)}
      <SiteFooter lang={lang} />
    </div>
  )
}
