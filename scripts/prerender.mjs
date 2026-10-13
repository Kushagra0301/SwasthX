// Prerender every route in src/seo.ts to static HTML + sitemap + robots.
// Run after `vite build` (client) and `vite build --ssr` (server bundle).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const { render, ROUTES: routes, BASE, BRAND } = await import(join(root, 'dist-ssr/entry-server.js'))

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const today = new Date().toISOString().slice(0, 10)
const urls = []

for (const r of routes) {
  const html = render(r.path)
  const page = template
    .replace(/<title>.*?<\/title>/, `<title>${r.title}</title>`)
    .replace(/(<meta name="description" content=").*?(")/, `$1${r.description}$2`)
    .replace(
      '</head>',
      `    <link rel="canonical" href="${BASE}${r.path === '/' ? '/' : r.path}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${BRAND}" />
    <meta property="og:title" content="${r.title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${r.description.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${BASE}${r.path === '/' ? '/' : r.path}" />
    <meta property="og:image" content="${BASE}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>`,
    )
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  const out = r.path === '/' ? join(dist, 'index.html') : join(dist, r.path, 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, page)
  urls.push(r.path)
  console.log('prerendered', r.path)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${BASE}${u === '/' ? '/' : u}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`)
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`sitemap: ${urls.length} URLs`)
