import { useEffect } from 'react'
import { AD_CLIENT, AD_UNITS, type AdKind } from './ads-config'

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

export function AdSlot({ kind = 'display' }: { kind?: AdKind }) {
  const id = AD_UNITS[kind]
  useEffect(() => {
    if (!id) return
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch { /* noop */ }
  }, [id])
  if (!id) return <div className="ad-slot" aria-hidden="true" />
  const fmt = kind === 'inArticle' ? 'fluid' : kind === 'multiplex' ? 'autorelaxed' : 'auto'
  return (
    <div className="ad-slot ad-live" role="complementary" aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={id}
        data-ad-format={fmt}
        {...(kind === 'inArticle' ? { 'data-ad-layout': 'in-article' } : { 'data-full-width-responsive': 'true' })}
      />
    </div>
  )
}
