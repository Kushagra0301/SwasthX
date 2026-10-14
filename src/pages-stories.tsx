// Web Stories index (/stories) — the stories themselves are standalone AMP
// pages written by scripts/prerender.mjs from src/content-stories.ts.
import type { Lang } from './App'
import { STORIES } from './content-stories'

export function StoriesIndex({ lang }: { lang: Lang }) {
  const hi = lang === 'hi'
  return (
    <main className="wrap">
      <section>
        <h1 className="section-title" style={{ borderTop: 'none', paddingTop: 0, marginTop: '0.6rem' }}>{hi ? 'वेब स्टोरीज़' : 'Web Stories'}</h1>
        <p className="hero-sub">
          {hi
            ? 'पेट, बाल और शरीर की कमियों की जानकारी — अब विज़ुअल स्टोरी के रूप में। हर स्टोरी छोटी है, पूरी है और टैप करके अपने हिसाब से पढ़ी जा सकती है।'
            : 'Gut, hair and deficiency know-how as visual stories. Every story is short, complete, and read at your own tap pace.'}
        </p>
        <div className="webstories-grid">
          {STORIES.map((s) => (
            <a key={s.slug} className="ws-card" href={`/stories/${s.slug}/`}>
              <img src={`/stories/${s.slug}/poster.jpg`} alt={s.title} width={720} height={960} loading="lazy" />
              <span className="ws-card-body">
                <span className="ws-card-title">{s.title}</span>
                <span className="ws-card-meta">{s.pages.length + 2} {hi ? 'पेज' : 'pages'} · {hi ? 'वेब स्टोरी' : 'Web Story'}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
