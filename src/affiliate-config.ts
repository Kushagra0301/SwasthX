// Amazon.in Associates — SwasthX affiliate configuration.
// Search links only (no hard-coded ASINs, no prices) so links never rot.
export const AMAZON_IN_TAG = 'kushagra03c9-21'

export const amazonInSearchUrl = (query: string) =>
  `https://www.amazon.in/s?k=${encodeURIComponent(query)}&tag=${AMAZON_IN_TAG}`

// Amazon's required associate disclosure (Hindi + English).
export const DISCLOSURE =
  'एक Amazon Associate के रूप में, SwasthX इस पेज के qualifying purchases से कमाता है। / As an Amazon Associate, SwasthX earns from qualifying purchases.'
