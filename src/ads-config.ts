// AdSense configuration (owner account pub-1777408629299540).
export const AD_CLIENT = 'ca-pub-1777408629299540'
export const AD_UNITS = {
  display: '7814102251', // SX Display (responsive)
  inArticle: '1691547030', // SX InArticle
  multiplex: '4637274573', // SX Multiplex
} as const
export type AdKind = keyof typeof AD_UNITS
