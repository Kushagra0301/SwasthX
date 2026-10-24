import type { Lang } from './App'
import { SX_TOOLS, type SxTool } from './content-tools'
import { AdSlot } from './AdSlot'
import { ProductCard } from './ProductCard'
import { SX_ARTICLES, type SxArticle } from './content-articles'
import { SX_TIPS } from './content-tips'
import { CLUSTER_META } from './seo'
import { SxToolBody } from './tools'

const h = (lang: Lang) => lang === 'hi'



const toolCard = (lang: Lang) => (t: SxTool) => (
  <a key={t.slug} className="tool-card" href={`/tools/${t.slug}`}>
    <strong>{h(lang) ? t.nameHi : t.nameEn}</strong>
    <span>{h(lang) ? t.tagHi : t.tagEn}</span>
  </a>
)

const storyCard = (lang: Lang) => (a: SxArticle) => (
  <a key={a.slug} className="story-card" href={`/${a.cluster}/${a.slug}`}>
    <strong>{a.titleHi}</strong>
    <span>{a.metaDescHi}</span>
  </a>
)

function tipOfDay() {
  const now = new Date()
  const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  return SX_TIPS[doy % SX_TIPS.length]
}

export function Home({ lang, go }: { lang: Lang; go: (p: string) => void }) {
  const tip = tipOfDay()
  const topTools = ['deficiency-risk-checker', 'lab-report-reader', 'bmi-calculator', 'period-calculator', 'indian-food-calories', 'protein-calculator']
    .map((s) => SX_TOOLS.find((t) => t.slug === s)!).filter(Boolean)
  return (
    <main className="wrap">
      <section className="hero">
        <h1>{h(lang) ? 'बीमारी की जड़ तक' : 'Health, down to the root'}</h1>
        <p className="hero-sub">{h(lang)
          ? 'पेट, बाल और शरीर की कमियों की सही जानकारी — सरल हिंदी में, sources के साथ। कोई इलाज नहीं बेचा जाता, कोई डर नहीं फैलाया जाता।'
          : 'Straightforward information on gut, hair and deficiencies — in simple language, with sources. Nothing is sold as a cure, and nothing is written to scare you.'}</p>
      </section>

      <div className="feature-grid">
        <div className="tip-card">
          <span className="chip">{h(lang) ? 'आज का Health Tip' : 'Today’s Health Tip'}</span>
          <h2>{tip.titleHi}</h2>
          <p>{tip.bodyHi}</p>
          <p className="note">{h(lang) ? 'रोज़ एक नया tip — कल फिर आएं।' : 'A new tip every day — come back tomorrow.'}</p>
        </div>
        <div className="card">
          <span className="chip">{h(lang) ? 'पहले जांचें' : 'Check first'}</span>
          <h3 style={{ marginTop: '0.6rem' }}>{h(lang) ? 'किस विटामिन की कमी हो सकती है?' : 'Which deficiency could it be?'}</h3>
          <p>{h(lang) ? 'थकान, बाल झड़ना, भूलना — लक्षणों से संभावना जांचें और जानें कौन सी lab test पक्का बताएगी।' : 'Fatigue, hair fall, forgetfulness — check the likely deficiency from symptoms and learn which lab test confirms it.'}</p>
          <button className="btn btn-primary" onClick={() => go('/tools/deficiency-risk-checker')}>{h(lang) ? 'Checker खोलें →' : 'Open the checker →'}</button>
        </div>
      </div>

      <AdSlot />

      <section>
        <h2 className="section-title">{h(lang) ? 'तीन विषय, जड़ से' : 'Three topics, from the root'}</h2>
        <div className="three-col">
          {(['gut', 'hair', 'deficiency'] as const).map((c) => (
            <a key={c} className="tool-card" href={`/${c}`}>
              <strong>{h(lang) ? CLUSTER_META[c].hi : CLUSTER_META[c].en}</strong>
              <span>{h(lang) ? CLUSTER_META[c].tagHi : CLUSTER_META[c].tagEn}</span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">{h(lang) ? 'मुफ़्त Tools' : 'Free tools'} <a href="/tools" style={{ fontSize: '0.95rem' }}>{h(lang) ? 'सभी tools →' : 'All tools →'}</a></h2>
        <div className="three-col">{topTools.map(toolCard(lang))}</div>
      </section>

      <div className="trust-strip">
        <h2>{h(lang) ? 'हमारी तीन कसौटियाँ' : 'Our three rules'}</h2>
        <p>{h(lang)
          ? '1) हर लेख के नीचे sources दिए जाते हैं।  2) "डॉक्टर को कब दिखाएं" हर लेख में साफ़ लिखा होता है।  3) यहाँ कोई इलाज, दवा या ख़ुराक नहीं बताई जाती — जानकारी दी जाती है, ताकि आप सही सवाल पूछ सकें।'
          : '1) Every article lists its sources. 2) Every article states plainly when to see a doctor. 3) We never prescribe a treatment, medicine or dose — we give information, so you can ask the right questions.'}</p>
      </div>

      {(['gut', 'hair', 'deficiency'] as const).map((c) => (
        <section key={c}>
          <h2 className="section-title">{h(lang) ? CLUSTER_META[c].hi : CLUSTER_META[c].en} <a href={`/${c}`} style={{ fontSize: '0.95rem' }}>{h(lang) ? 'सभी लेख →' : 'All articles →'}</a></h2>
          <div className="three-col">{SX_ARTICLES.filter((a) => a.cluster === c).slice(0, 3).map(storyCard(lang))}</div>
        </section>
      ))}
    </main>
  )
}

export function ToolsHub({ lang }: { lang: Lang }) {
  return (
    <main className="wrap">
      <section className="hero">
        <h1>{h(lang) ? 'सभी Health Tools' : 'All Health Tools'}</h1>
        <p className="hero-sub">{h(lang) ? 'सभी tools मुफ़्त हैं और आपके ब्राउज़र में चलते हैं — health जानकारी कहीं भेजी नहीं जाती।' : 'All tools are free and run in your browser — your health inputs are never sent anywhere.'}</p>
      </section>
      <div className="two-col">{SX_TOOLS.map(toolCard(lang))}</div>
    </main>
  )
}

const TOOL_PRODUCTS: Record<string, { label: string; query: string }[]> = {
  'indian-food-calories': [
    { label: 'किचन तौलने की मशीन (weighing scale)', query: 'digital kitchen weighing scale' },
    { label: 'मापने वाले कप और चम्मच का set', query: 'measuring cups and spoons set' },
  ],
  'bmi-calculator': [
    { label: 'शरीर मापने का टेप', query: 'body measuring tape' },
    { label: 'वज़न तौलने की मशीन', query: 'bathroom weighing scale digital' },
  ],
}

export function ToolPage({ lang, slug }: { lang: Lang; slug: string }) {
  const tool = SX_TOOLS.find((t) => t.slug === slug)!
  const related = SX_TOOLS.filter((t) => t.slug !== slug).slice(0, 4)
  return (
    <main className="wrap article">
      <h1>{h(lang) ? tool.nameHi : tool.nameEn}</h1>
      <p className="article-intro">{h(lang) ? tool.tagHi : tool.tagEn}</p>
      <section className="card">
        <SxToolBody slug={slug} lang={lang} />
      </section>
      <AdSlot />
      {TOOL_PRODUCTS[slug] && <ProductCard lang={lang} items={TOOL_PRODUCTS[slug]} />}
      <section>
        <h2 className="section-title">{h(lang) ? 'और tools' : 'More tools'}</h2>
        <div className="two-col">{related.map(toolCard(lang))}</div>
      </section>
    </main>
  )
}

export function ClusterHub({ lang, cluster }: { lang: Lang; cluster: string }) {
  const meta = CLUSTER_META[cluster]
  const tools = SX_TOOLS.filter((t) => t.cluster === cluster)
  const articles = SX_ARTICLES.filter((a) => a.cluster === cluster)
  return (
    <main className="wrap">
      <section className="hero">
        <h1>{h(lang) ? meta.hi : meta.en}</h1>
        <p className="hero-sub">{h(lang) ? meta.tagHi : meta.tagEn}</p>
      </section>
      {tools.length > 0 && (
        <section>
          <h2 className="section-title">{h(lang) ? 'पहले जांचें' : 'Check first'}</h2>
          <div className="two-col">{tools.map(toolCard(lang))}</div>
        </section>
      )}
      <section>
        <h2 className="section-title">{h(lang) ? 'लेख पढ़ें' : 'Read'}</h2>
        <div className="two-col">{articles.map(storyCard(lang))}</div>
      </section>
    </main>
  )
}

export function ArticlePage({ lang, article }: { lang: Lang; article: SxArticle }) {
  const related = SX_ARTICLES.filter((a) => a.cluster === article.cluster && a.slug !== article.slug).slice(0, 3)
  return (
    <main className="wrap article">
      <h1>{article.titleHi}</h1>
      <div className="reviewer-line">
        <span>📋</span>
        <span>{h(lang)
          ? 'यह लेख नीचे दिए गए sources के आधार पर तैयार किया गया है। यह जानकारी शैक्षणिक है — निदान या इलाज के लिए डॉक्टर से मिलें।'
          : 'Prepared from the sources listed below. This is educational information — for diagnosis or treatment, see a doctor.'}</span>
      </div>
      <p className="article-intro">{article.introHi}</p>
      <AdSlot />
      {article.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.h}</h2>
          <p>{s.body}</p>
          {i === 1 && <AdSlot kind="inArticle" />}
        </section>
      ))}
      {article.links && article.links.length > 0 && (
        <section>
          <h2 className="section-title">{h(lang) ? 'इससे जुड़े लेख' : 'Related articles'}</h2>
          <div className="stack">{article.links.map((s) => SX_ARTICLES.find((a) => a.slug === s)!).filter(Boolean).map(storyCard(lang))}</div>
        </section>
      )}
      <div className="redflag-box">
        <h2>{h(lang) ? 'डॉक्टर को कब दिखाएं' : 'When to see a doctor'}</h2>
        <ul className="steps-list">
          {article.redFlagsHi.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      <div className="sources-list">
        <strong>{h(lang) ? 'Sources:' : 'Sources:'}</strong>
        <ul>
          {article.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}
        </ul>
      </div>
      {article.products && article.products.length > 0 && (
        <ProductCard lang={lang} items={article.products} />
      )}
      <section>
        <h2 className="section-title">{h(lang) ? 'इसी विषय पर और' : 'More on this topic'}</h2>
        <div className="stack">{related.map(storyCard(lang))}</div>
      </section>
    </main>
  )
}

const LEGAL: Record<string, { hi: { title: string; body: string[] }; en: { title: string; body: string[] } }> = {
  about: {
    hi: {
      title: 'SwasthX के बारे में',
      body: [
        'SwasthX एक स्वतंत्र हिंदी स्वास्थ्य-जानकारी site है। हम तीन विषयों पर लिखते हैं — पेट की सेहत, बालों की सेहत और शरीर की कमियाँ (Vitamin D, B12, iron) — क्योंकि भारत में सबसे आम शिकायतें इन्हीं से जुड़ी हैं।',
        'हमारा तरीका साधारण है: पहले वजह (जड़) समझाओ, फिर बताओ कि कौन सी जांच से पक्का पता चलता है, और कब डॉक्टर के पास जाना चाहिए। हम कोई इलाज, दवा या ख़ुराक नहीं बताते।',
        'हर लेख के नीचे उसके sources दिए जाते हैं — WHO, ICMR, NIH जैसी संस्थाओं के प्रकाशन। Tools आपके ब्राउज़र में चलते हैं; आपकी health जानकारी हमारे पास आती ही नहीं।',
      ],
    },
    en: {
      title: 'About SwasthX',
      body: [
        'SwasthX is an independent Hindi health-information site covering three topics — gut health, hair health and common deficiencies (Vitamin D, B12, iron) — because most everyday complaints in India trace back to these.',
        'Our method is simple: explain the root cause first, then which test actually confirms it, and when you should see a doctor. We never prescribe treatments, medicines or doses.',
        'Every article lists its sources — publications from bodies like WHO, ICMR and NIH. Tools run in your browser; your health inputs never reach us.',
      ],
    },
  },
  'privacy-policy': {
    hi: {
      title: 'Privacy Policy',
      body: [
        'SwasthX के सभी tools आपके ब्राउज़र में चलते हैं। आप जो भी जानकारी भरते हैं — वज़न, लक्षण, report की values — वह कहीं भेजी या रखी नहीं जाती।',
        'हम page visits की गिनती के लिए सामान्य analytics और विज्ञापनों के लिए Google AdSense का उपयोग करते हैं। AdSense cookies का उपयोग कर सकता है; इसे आप Google की ad settings से नियंत्रित कर सकते हैं।',
        'हम कोई personal data नहीं बेचते।',
      ],
    },
    en: {
      title: 'Privacy Policy',
      body: [
        'Every SwasthX tool runs in your browser. Anything you enter — weight, symptoms, report values — is never sent to or stored by us.',
        'We use basic analytics to count visits and Google AdSense for advertising. AdSense may use cookies, which you can control in Google’s ad settings.',
        'We do not sell personal data.',
      ],
    },
  },
  disclaimer: {
    hi: {
      title: 'चिकित्सा अस्वीकरण',
      body: [
        'SwasthX पर प्रकाशित सारी जानकारी केवल शैक्षणिक उद्देश्य के लिए है। यह किसी बीमारी का निदान (diagnosis), इलाज या चिकित्सा सलाह नहीं है, और डॉक्टर की जगह नहीं ले सकती।',
        'किसी tool का परिणाम "संभावना" मात्र है — पक्का पता केवल उचित जांच और डॉक्टर की राय से चलता है। कोई दवा, supplement या इलाज शुरू/बंद करने से पहले डॉक्टर से सलाह लें।',
        'आपात स्थिति (तेज़ दर्द, खून आना, सांस की तकलीफ़, बेहोशी) में site न पढ़ें — तुरंत अस्पताल जाएं या 112 पर call करें।',
        'पार्टनर लिंक (Affiliate Disclosure): SwasthX के कुछ पेजों पर Amazon.in के affiliate links दिए गए हैं। अगर आप इन links के ज़रिए कुछ खरीदते हैं, तो SwasthX को Amazon से छोटा-सा commission मिल सकता है — आपकी कीमत में कोई अंतर नहीं पड़ता। एक Amazon Associate के रूप में, SwasthX qualifying purchases से कमाता है। हम किसी उत्पाद के असर की गारंटी नहीं देते; खरीदने से पहले उत्पाद की जानकारी खुद भी जांच लें।',
      ],
    },
    en: {
      title: 'Medical Disclaimer',
      body: [
        'Everything published on SwasthX is for education only. It is not a diagnosis, treatment or medical advice, and it cannot replace a doctor.',
        'A tool result is only an indication — certainty comes from proper tests and a doctor’s opinion. Consult a doctor before starting or stopping any medicine or supplement.',
        'In an emergency (severe pain, bleeding, breathing difficulty, fainting), do not read a website — go to a hospital or call 112.',
        'Affiliate Disclosure: Some pages on SwasthX carry affiliate links to Amazon.in. If you buy through these links, SwasthX may earn a small commission from Amazon — at no extra cost to you. As an Amazon Associate, SwasthX earns from qualifying purchases. We do not guarantee any product’s effect; please check the product details yourself before buying.',
      ],
    },
  },
  terms: {
    hi: {
      title: 'उपयोग की शर्तें',
      body: [
        'स्वीकृति: SwasthX (swasthx.in) का उपयोग करते ही आप इन शर्तों से सहमत होते हैं। सहमत न हों, तो कृपया site का उपयोग न करें।',
        'SwasthX क्या है: SwasthX एक स्वतंत्र स्वास्थ्य-जानकारी site है। हम पेट की सेहत, बालों की सेहत और आम कमियों पर शैक्षणिक लेख प्रकाशित करते हैं, और ऐसे मुफ़्त tools देते हैं जो पूरी तरह आपके ब्राउज़र में चलते हैं।',
        'यह चिकित्सा सलाह नहीं है: SwasthX पर कुछ भी चिकित्सा सलाह नहीं है। सारी जानकारी केवल शिक्षा के लिए है — यह किसी बीमारी का निदान, इलाज या नुस्खा नहीं है, और डॉक्टर की जगह नहीं ले सकती। किसी tool का परिणाम "संभावना" मात्र है। हमारा चिकित्सा अस्वीकरण भी पढ़ें, और किसी भी लक्षण या चिंता के लिए डॉक्टर से मिलें।',
        'जानकारी की सटीकता: हमारे लेख प्रकाशित sources (जैसे WHO, ICMR, NIH) पर आधारित हैं, जो हर लेख के नीचे दिए जाते हैं, और समय-समय पर जांचे व update किए जाते हैं। फिर भी जानकारी पुरानी पड़ सकती है, और हम हर पेज के पूर्ण या त्रुटिरहित होने की गारंटी नहीं देते।',
        'उचित उपयोग: कृपया site का उपयोग lawful और सही उद्देश्य से करें — site को बिगाड़ने या बाधित करने का प्रयास न करें, service को ख़राब करने वाली scraping न करें, और हमारी सामग्री को किसी और के लिए चिकित्सा नुस्खे के रूप में प्रस्तुत न करें।',
        'बौद्धिक संपदा: Site की सामग्री, design और tools SwasthX के हैं। आप व्यक्तिगत उपयोग के लिए पढ़ सकते हैं और links share कर सकते हैं; हमारे लेख दोबारा प्रकाशित करने या site का design copy करने के लिए पहले अनुमति आवश्यक है।',
        'बाहरी links, विज्ञापन और affiliate: लेखों में तीसरे पक्ष के sources के links हैं, और कुछ पेजों पर Amazon.in के affiliate links हैं (विवरण अस्वीकरण में है); उन sites पर हमारा नियंत्रण नहीं है। Site पर Google AdSense के विज्ञापन दिखते हैं — विज्ञापन तीसरे पक्ष देते हैं, वे किसी उत्पाद, विशेषकर किसी health उत्पाद, का हमारा समर्थन नहीं हैं।',
        'दायित्व की सीमा: कानून द्वारा अनुमत अधिकतम सीमा तक, SwasthX "जैसा है" (as is) आधार पर उपलब्ध है, और इसकी सामग्री या tools पर भरोसा करके हुए किसी नुक़सान के लिए हम ज़िम्मेदार नहीं हैं। सेहत के फ़ैसले किसी योग्य डॉक्टर के साथ लें।',
        'शर्तों में बदलाव: हम समय-समय पर इन शर्तों को update कर सकते हैं। वर्तमान संस्करण ही लागू होता है, और बदलाव के बाद site का उपयोग जारी रखना आपकी स्वीकृति माना जाएगा।',
        'संपर्क: इन शर्तों के बारे में प्रश्न हो, तो इस site का संपर्क पेज देखें।',
      ],
    },
    en: {
      title: 'Terms of Use',
      body: [
        'Acceptance: By using SwasthX (swasthx.in) you accept these terms. If you do not agree with them, please do not use the site.',
        'What SwasthX is: SwasthX is an independent health-information website. We publish educational articles on gut health, hair health and common deficiencies, and provide free tools that run entirely in your browser.',
        'Not medical advice: Nothing on SwasthX is medical advice. All content is educational only — it is not a diagnosis, treatment or prescription, and it cannot replace a doctor. A tool result is only an indication. Please also read our Medical Disclaimer, and see a doctor for any symptom or concern.',
        'Accuracy of information: Our articles are based on published sources (such as WHO, ICMR and NIH), which are listed under each article, and are reviewed and updated periodically. Even so, information may become out of date, and we do not guarantee that every page is complete or error-free.',
        'Acceptable use: Please use the site lawfully and as intended — do not attempt to disrupt it, scrape it in a way that degrades the service, or present its content as a medical prescription for someone else.',
        'Intellectual property: The site’s content, design and tools belong to SwasthX. You may read the site and share its links for personal use; republishing our articles or copying the site’s design requires prior permission.',
        'External links, advertising and affiliates: Articles link to third-party sources and, on some pages, to products on Amazon.in through affiliate links (see the Disclaimer for the affiliate disclosure); we do not control those sites. The site displays advertising served by Google AdSense — ads are provided by third parties and are not our endorsement of any product, least of all a health product.',
        'Limitation of liability: To the fullest extent permitted by law, SwasthX is provided “as is”, and we are not liable for any loss arising from reliance on its content or tools. Health decisions should be made with a qualified doctor.',
        'Changes to these terms: We may update these terms from time to time. The current version always applies, and continuing to use the site after a change means you accept it.',
        'Contact: For questions about these terms, please see the Contact page on this site.',
      ],
    },
  },
  contact: {
    hi: {
      title: 'संपर्क करें',
      body: [
        'SwasthX एक छोटी, स्वतंत्र स्वास्थ्य-जानकारी site है। हम कोई clinic नहीं चलाते, और हमारी team में कोई ऐसा नहीं है जो किसी व्यक्ति की व्यक्तिगत सेहत का परामर्श दे सके — यह इस site का उद्देश्य भी नहीं है।',
        'व्यक्तिगत स्वास्थ्य प्रश्न: कृपया यहाँ व्यक्तिगत चिकित्सा उत्तर न खोजें। लक्षण या चिंता हो, तो सही संपर्क आपके नज़दीकी डॉक्टर हैं। आपात स्थिति — तेज़ दर्द, खून आना, सांस की तकलीफ़, बेहोशी — में अस्पताल जाएं या 112 पर call करें।',
        'गलती सुधार: किसी लेख में गलती दिखी? हर लेख के नीचे उसके sources (WHO, ICMR, NIH जैसी संस्थाओं के प्रकाशन) दिए जाते हैं, ताकि आप किसी भी दावे को मूल source से जांच सकें। हम अपने पेजों को इन्हीं sources से दोबारा जांचते हैं और गलती मिलते ही उसी पेज पर सुधार करते हैं।',
        'गोपनीयता और विज्ञापन: हमारे tools आपके ब्राउज़र में चलते हैं और आपकी health जानकारी हम तक पहुँचती ही नहीं — Privacy Policy में यह विस्तार से है। विज्ञापन Google AdSense देता है, और ad personalisation को आप Google की ad settings से नियंत्रित कर सकते हैं।',
        'फ़िलहाल SwasthX कोई सार्वजनिक email inbox या message form नहीं चलाता, और इस site के ज़रिए हम संदेश एकत्र नहीं करते। कोई संपर्क माध्यम खुलेगा, तो वह इसी पेज पर घोषित होगा।',
      ],
    },
    en: {
      title: 'Contact Us',
      body: [
        'SwasthX is a small, independent health-information website. We are not a clinic, and nobody on the team can consult on a specific person’s health — that is not what this site is for.',
        'Personal health questions: please do not look for personal medical answers here. If you have symptoms or a worry, the right contact is a doctor near you. In an emergency — severe pain, bleeding, breathing difficulty, fainting — go to a hospital or call 112.',
        'Corrections: spotted a mistake in an article? Every article lists its sources (publications from bodies like WHO, ICMR and NIH) at the bottom, so you can check any claim against the original. We re-check our pages against these sources and correct errors in place when we find them.',
        'Privacy and advertising: our tools run in your browser and your health inputs never reach us — the Privacy Policy explains this in full. Advertising is served by Google AdSense, and you can control ad personalisation in Google’s ad settings.',
        'At present SwasthX does not run a public email inbox or a message form, and we do not collect messages through this site. If a contact channel opens, it will be announced on this page.',
      ],
    },
  },
}

export function LegalPage({ lang, slug }: { lang: Lang; slug: string }) {
  const page = (LEGAL[slug] ?? LEGAL.about)[h(lang) ? 'hi' : 'en']
  return (
    <main className="wrap article">
      <h1>{page.title}</h1>
      {page.body.map((b, i) => <p key={i}>{b}</p>)}
    </main>
  )
}
