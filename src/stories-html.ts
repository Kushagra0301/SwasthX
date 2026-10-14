// AMP Web Story renderer — builds a complete, valid amp-story HTML document
// per story. Design: Warm Editorial (light ivory art, ink serif headlines,
// caption-length text over an ivory scrim), visual-first with subtle Ken
// Burns zoom on the art and gentle animate-in text entrances, payoff +
// single page-attachment CTA on the final page. GA4
// (amp-story-auto-analytics, extension v0.1) and AdSense auto ads
// (amp-story-auto-ads as the FIRST child of <amp-story>) are wired into
// every story.
import { STORIES, type Story } from './content-stories'

const BASE = 'https://swasthx.in'
const GA_ID = 'G-LMGJ6SW4ZL'
const AD_CLIENT = 'ca-pub-1777408629299540'
const AD_SLOT = '7814102251'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function artImg(story: Story, art: 1 | 2 | 3, cls: string) {
  return `<amp-img src="${BASE}/stories/${story.slug}/art${art}.jpg" width="720" height="1280" layout="fill" alt="" class="${cls}"></amp-img>`
}

function storyHtml(story: Story): string {
  const url = `${BASE}/stories/${story.slug}/`
  const total = story.pages.length + 2
  const pages: string[] = []

  pages.push(`<amp-story-page id="cover">
      <amp-story-grid-layer template="fill">${artImg(story, 1, 'kb kb-a')}</amp-story-grid-layer>
      <amp-story-grid-layer template="fill"><div class="scrim scrim-cover"></div></amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="layer layer-cover">
        <p class="brand" animate-in="fade-in">SwasthX · वेब स्टोरी</p>
        <h1 animate-in="fly-in-bottom" animate-in-duration="0.7s">${esc(story.title)}</h1>
        <p class="cover-q" animate-in="fade-in" animate-in-delay="0.35s">${esc(story.coverQ)}</p>
        <p class="hint" animate-in="fade-in" animate-in-delay="0.6s">आगे बढ़ने के लिए टैप करें ›</p>
      </amp-story-grid-layer>
    </amp-story-page>`)

  story.pages.forEach((p, i) => {
    const kb = i % 2 === 0 ? 'kb kb-a' : 'kb kb-b'
    pages.push(`<amp-story-page id="p${i + 1}">
      <amp-story-grid-layer template="fill">${artImg(story, p.art, kb)}</amp-story-grid-layer>
      <amp-story-grid-layer template="fill"><div class="scrim"></div></amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="layer layer-body">
        <p class="step" animate-in="fade-in">${i + 2} / ${total}</p>
        ${p.h ? `<h2 animate-in="fly-in-bottom" animate-in-duration="0.6s">${esc(p.h)}</h2>` : ''}
        <p class="txt" animate-in="fade-in" animate-in-delay="0.25s">${esc(p.text)}</p>
      </amp-story-grid-layer>
    </amp-story-page>`)
  })

  const absHref = story.attachment.href.startsWith('http') ? story.attachment.href : BASE + story.attachment.href
  pages.push(`<amp-story-page id="final">
      <amp-story-grid-layer template="fill">${artImg(story, 3, 'kb kb-b')}</amp-story-grid-layer>
      <amp-story-grid-layer template="fill"><div class="scrim"></div></amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="layer layer-final">
        <p class="step" animate-in="fade-in">सार</p>
        <p class="payoff" animate-in="fly-in-bottom" animate-in-duration="0.6s">${esc(story.payoff)}</p>
        <p class="brand-sm" animate-in="fade-in" animate-in-delay="0.3s">SwasthX — पेट, बाल और शरीर की कमियों की जानकारी, जड़ से</p>
      </amp-story-grid-layer>
      <amp-story-page-attachment layout="nodisplay" href="${absHref}" cta-text="${esc(story.attachment.cta)}"></amp-story-page-attachment>
    </amp-story-page>`)

  return `<!doctype html>
<html amp lang="hi">
<head>
<meta charset="utf-8">
<title>${esc(story.title)} — SwasthX वेब स्टोरी</title>
<link rel="canonical" href="${url}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<meta name="description" content="${esc(story.desc)}">
<meta name="theme-color" content="#FAF6EE">
<meta property="og:type" content="article">
<meta property="og:site_name" content="SwasthX">
<meta property="og:title" content="${esc(story.title)}">
<meta property="og:description" content="${esc(story.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}/stories/${story.slug}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="675">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(story.title)}">
<meta name="twitter:description" content="${esc(story.desc)}">
<meta name="twitter:image" content="${BASE}/stories/${story.slug}/og.jpg">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
<script async custom-element="amp-story-auto-ads" src="https://cdn.ampproject.org/v0/amp-story-auto-ads-0.1.js"></script>
<script async custom-element="amp-story-auto-analytics" src="https://cdn.ampproject.org/v0/amp-story-auto-analytics-0.1.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Tiro+Devanagari+Hindi&family=Noto+Sans+Devanagari:wght@400;600&display=swap" rel="stylesheet">
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
<style amp-custom>
  amp-story { font-family: 'Noto Sans Devanagari', sans-serif; background: #FAF6EE; }
  amp-img img { object-fit: cover; }
  .kb { animation: kbz 18s ease-in-out infinite alternate; }
  .kb-b { animation-name: kbz2; }
  @keyframes kbz { from { transform: scale(1.03); } to { transform: scale(1.16) translate(-1.6%, -2.2%); } }
  @keyframes kbz2 { from { transform: scale(1.15) translate(1.4%, 1.8%); } to { transform: scale(1.03); } }
  .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(250,246,238,0) 38%, rgba(250,246,238,0.80) 64%, rgba(250,246,238,0.97) 100%); }
  .scrim-cover { background: linear-gradient(180deg, rgba(250,246,238,0.34) 0%, rgba(250,246,238,0.05) 32%, rgba(250,246,238,0.78) 62%, rgba(250,246,238,0.98) 100%); }
  .layer { padding: 12% 8.5% 13%; justify-content: flex-end; }
  .layer-cover { padding-bottom: 15%; }
  .layer-final { justify-content: center; padding-bottom: 20%; }
  .brand { color: #C05621; font-size: 13px; letter-spacing: 2.5px; font-weight: 600; margin: 0 0 14px; }
  .brand-sm { color: #9C4218; font-size: 13.5px; line-height: 1.6; margin: 22px 0 0; }
  h1 { font-family: 'Tiro Devanagari Hindi', 'Playfair Display', serif; color: #1C1917; font-size: 38px; line-height: 1.32; font-weight: 400; margin: 0 0 16px; }
  .cover-q { color: #44403C; font-family: 'Tiro Devanagari Hindi', serif; font-size: 20px; line-height: 1.55; margin: 0 0 18px; }
  .hint { color: rgba(28,25,23,0.55); font-size: 13px; letter-spacing: 1px; margin: 0; }
  .step { color: #B45309; font-size: 12.5px; letter-spacing: 2px; font-weight: 600; margin: 0 0 12px; }
  h2 { font-family: 'Tiro Devanagari Hindi', 'Playfair Display', serif; color: #1C1917; font-size: 30px; line-height: 1.35; font-weight: 400; margin: 0 0 12px; }
  .txt { color: rgba(28,25,23,0.92); font-size: 18px; line-height: 1.68; margin: 0; }
  .payoff { font-family: 'Tiro Devanagari Hindi', serif; color: #1C1917; font-size: 23px; line-height: 1.6; margin: 0; }
</style>
</head>
<body>
<amp-story standalone supports-landscape title="${esc(story.title)}" publisher="SwasthX" publisher-logo-src="${BASE}/publisher-logo.png" poster-portrait-src="${BASE}/stories/${story.slug}/poster.jpg" poster-landscape-src="${BASE}/stories/${story.slug}/og.jpg">
<amp-story-auto-ads>
<script type="application/json">
{"ad-attributes": {"type": "adsense", "data-ad-client": "${AD_CLIENT}", "data-ad-slot": "${AD_SLOT}"}}
</script>
</amp-story-auto-ads>
<amp-story-auto-analytics gtag-id="${GA_ID}"></amp-story-auto-analytics>
${pages.join('\n')}
</amp-story>
</body>
</html>`
}

export const STORY_PATHS: string[] = STORIES.map((s) => `/stories/${s.slug}`)
export const STORY_MANIFEST = STORIES.map((s) => ({ slug: s.slug, motif: s.motif, glyph: s.glyph }))
export function renderStory(slug: string): string | null {
  const story = STORIES.find((s) => s.slug === slug)
  return story ? storyHtml(story) : null
}
