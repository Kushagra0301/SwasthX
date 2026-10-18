import { SX_TOOLS } from './content-tools'
import { SX_ARTICLES } from './content-articles'

export const BASE = 'https://swasthx.in'
export const BRAND = 'SwasthX'

export interface RouteDef {
  path: string
  title: string
  description: string
  type: 'home' | 'tool' | 'article' | 'tools-hub' | 'cluster' | 'legal'
  slug?: string
  cluster?: string
}

export const CLUSTER_META: Record<string, { hi: string; en: string; tagHi: string; tagEn: string }> = {
  gut: { hi: 'पेट की सेहत', en: 'Gut Health', tagHi: 'एसिडिटी, गैस, कब्ज़ और पेट फूलने की असली वजहें — सरल भाषा में।', tagEn: 'Acidity, gas, constipation and bloating — the real causes, in simple words.' },
  hair: { hi: 'बालों की सेहत', en: 'Hair Health', tagHi: 'बाल झड़ना, रूसी और सफेद बाल — वजह पहले, उपाय बाद में।', tagEn: 'Hair fall, dandruff and greying — causes first, remedies after.' },
  deficiency: { hi: 'शरीर की कमियाँ', en: 'Deficiencies', tagHi: 'Vitamin D, B12, iron की कमी — लक्षण, जांच और खाने से पूर्ति।', tagEn: 'Vitamin D, B12 and iron deficiency — signs, tests and food sources.' },
}

export const ROUTES: RouteDef[] = [
  {
    path: '/', type: 'home',
    title: 'SwasthX — बीमारी की जड़ तक | पेट, बाल और विटामिन की कमी की सही जानकारी',
    description: 'रोज़ का health tip, पेट-बाल-कमी की जड़ से जानकारी, और मुफ़्त tools: BMI, Vitamin D/B12 कमी checker, lab report reader, period calculator. सरल हिंदी में, sources के साथ।',
  },
  {
    path: '/tools', type: 'tools-hub',
    title: 'सभी Health Tools — BMI, कमी Checker, Report Reader | SwasthX',
    description: 'SwasthX के सभी मुफ़्त tools: BMI (भारतीय मानक), BMR, TDEE, protein, पानी, period व ovulation calculator, due date, कमी risk checker और lab report reader।',
  },
  ...SX_TOOLS.map<RouteDef>((t) => ({
    path: `/tools/${t.slug}`,
    type: 'tool',
    slug: t.slug,
    title: `${t.nameHi} | SwasthX`,
    description: `${t.tagHi} मुफ़्त और तुरंत — आपकी जानकारी ब्राउज़र में ही रहती है।`,
  })),
  ...(['gut', 'hair', 'deficiency'] as const).map<RouteDef>((c) => ({
    path: `/${c}`,
    type: 'cluster',
    cluster: c,
    title: `${CLUSTER_META[c].hi} — ${CLUSTER_META[c].tagHi} | SwasthX`,
    description: CLUSTER_META[c].tagHi,
  })),
  ...SX_ARTICLES.map<RouteDef>((a) => ({
    path: `/${a.cluster}/${a.slug}`,
    type: 'article',
    slug: a.slug,
    title: `${a.titleHi} | SwasthX`,
    description: a.metaDescHi,
  })),
  {
    path: '/about', type: 'legal', slug: 'about',
    title: 'SwasthX के बारे में',
    description: 'SwasthX एक स्वतंत्र हिंदी स्वास्थ्य-जानकारी site है — पेट, बाल और शरीर की कमियों की जड़ से, sources के साथ जानकारी। यह चिकित्सा सलाह नहीं है।',
  },
  {
    path: '/privacy-policy', type: 'legal', slug: 'privacy',
    title: 'Privacy Policy | SwasthX',
    description: 'SwasthX पर tools आपके ब्राउज़र में चलते हैं — health जानकारी कहीं भेजी या रखी नहीं जाती।',
  },
  {
    path: '/disclaimer', type: 'legal', slug: 'disclaimer',
    title: 'चिकित्सा अस्वीकरण (Medical Disclaimer) | SwasthX',
    description: 'SwasthX की जानकारी शैक्षणिक है — यह किसी बीमारी का निदान या इलाज नहीं है। तकलीफ़ हो तो डॉक्टर से मिलें।',
  },
  {
    path: '/terms', type: 'legal', slug: 'terms',
    title: 'उपयोग की शर्तें (Terms of Use) | SwasthX',
    description: 'SwasthX का उपयोग करने की शर्तें — जानकारी केवल शैक्षणिक है, यह चिकित्सा सलाह नहीं है; उचित उपयोग, बौद्धिक संपदा और दायित्व की सीमाएं।',
  },
  {
    path: '/contact', type: 'legal', slug: 'contact',
    title: 'संपर्क करें (Contact) | SwasthX',
    description: 'SwasthX से संपर्क की जानकारी — व्यक्तिगत चिकित्सा प्रश्नों के लिए डॉक्टर से मिलें; गलती सुधार, गोपनीयता और विज्ञापन संबंधी जानकारी यहाँ है।',
  },
]
