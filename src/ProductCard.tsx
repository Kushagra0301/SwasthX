import { amazonInSearchUrl, DISCLOSURE } from './affiliate-config'

export interface ProductItem {
  label: string
  query: string
}

// Affiliate product card — search links to Amazon.in with the site tag.
// No prices, no Amazon logos/images, no medical claims in labels.
export function ProductCard({
  items,
  title,
  lang,
}: {
  items: ProductItem[]
  title?: string
  lang?: 'hi' | 'en'
}) {
  if (!items || items.length === 0) return null
  const en = lang === 'en'
  const heading = title ?? (en ? 'Related products — see on Amazon' : 'संबंधित उत्पाद — Amazon पर देखें')
  return (
    <section className="card product-card">
      <h2>{heading}</h2>
      <ul className="product-list">
        {items.map((it, i) => (
          <li key={i}>
            <a
              href={amazonInSearchUrl(it.query)}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
            >
              <span>{it.label}</span>
              <span className="product-cta">{en ? 'View on Amazon.in →' : 'Amazon.in पर देखें →'}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="note product-disclosure">{DISCLOSURE}</p>
    </section>
  )
}
