import { renderToString } from 'react-dom/server'
import { pageFor, SiteHeader, SiteFooter } from './App'

export { ROUTES, BASE, BRAND } from './seo'

// Build-time prerender entry. Language defaults to Hindi for static HTML;
// the client popup/toggle handles switching.
export function render(path: string): string {
  const noop = () => {}
  const go = () => {}
  return renderToString(
    <div className="app">
      <SiteHeader lang="hi" pick={noop} />
      {pageFor(path, 'hi', go)}
      <SiteFooter lang="hi" />
    </div>,
  )
}
