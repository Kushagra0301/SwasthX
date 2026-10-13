// SwasthX tools — real working calculators/checkers, bilingual (hi | en).
// YMYL rules baked in: no diagnosis wording, no medicine/dosage/treatment
// advice anywhere; every result ends with an educational disclaimer.
import { useState } from 'react'

type Lang = 'hi' | 'en'
type Sex = 'male' | 'female'

const T = (lang: Lang, hi: string, en: string) => (lang === 'hi' ? hi : en)
const num = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}
const r0 = (n: number) => Math.round(n).toLocaleString('en-IN')
const r1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-IN')

function Disclaimer({ lang }: { lang: Lang }) {
  return (
    <p className="note">
      {T(
        lang,
        'यह जानकारी सिर्फ़ सीखने-समझने के लिए है — यह किसी बीमारी की पहचान या इलाज नहीं है। तकलीफ़ हो या रिपोर्ट में कुछ गड़बड़ लगे तो डॉक्टर से ज़रूर मिलें।',
        'This information is only for learning and understanding — it is not a diagnosis or a treatment. If you have symptoms or an abnormal report, please do see a doctor.',
      )}
    </p>
  )
}

function NumField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        type="number"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  )
}

function SexField({ lang, sex, setSex }: { lang: Lang; sex: Sex; setSex: (s: Sex) => void }) {
  return (
    <label className="field">
      <span>{T(lang, 'लिंग', 'Sex')}</span>
      <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
        <option value="male">{T(lang, 'पुरुष', 'Male')}</option>
        <option value="female">{T(lang, 'महिला', 'Female')}</option>
      </select>
    </label>
  )
}

function ResultGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="result-grid">
      {items.map((it) => (
        <div className="result-item" key={it.label}>
          <span>{it.label}</span>
          <strong>{it.value}</strong>
        </div>
      ))}
    </div>
  )
}

/** Shared age/sex/weight/height state for the body-metric tools. */
function useBody() {
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState('30')
  const [weight, setWeight] = useState('65')
  const [height, setHeight] = useState('170')
  return {
    sex, setSex, age, setAge, weight, setWeight, height, setHeight,
    a: num(age), w: num(weight), h: num(height),
  }
}

function BodyFields({ lang, b, showAge }: { lang: Lang; b: ReturnType<typeof useBody>; showAge?: boolean }) {
  return (
    <>
      <SexField lang={lang} sex={b.sex} setSex={b.setSex} />
      {showAge ? (
        <NumField label={T(lang, 'उम्र (साल)', 'Age (years)')} value={b.age} onChange={b.setAge} min={5} max={100} />
      ) : null}
      <NumField label={T(lang, 'वज़न (किलो)', 'Weight (kg)')} value={b.weight} onChange={b.setWeight} min={20} max={300} step={0.5} />
      <NumField label={T(lang, 'कद (सेमी)', 'Height (cm)')} value={b.height} onChange={b.setHeight} min={100} max={250} />
    </>
  )
}

const validBody = (w: number, h: number) => w >= 20 && w <= 300 && h >= 100 && h <= 250

function bmrCalc(sex: Sex, w: number, h: number, a: number) {
  const base = 10 * w + 6.25 * h - 5 * a
  return sex === 'male' ? base + 5 : base - 161
}

// ---------------- BMI (Indian cut-offs) ----------------
function BmiTool({ lang }: { lang: Lang }) {
  const b = useBody()
  const ok = validBody(b.w, b.h)
  const bmi = ok ? b.w / Math.pow(b.h / 100, 2) : 0
  const cats = [
    { hi: 'वज़न कम है', en: 'Underweight' },
    { hi: 'वज़न सही है', en: 'Healthy weight' },
    { hi: 'वज़न थोड़ा ज़्यादा है', en: 'Overweight' },
    { hi: 'वज़न बहुत ज़्यादा है', en: 'Obese' },
  ]
  const catIdx = bmi < 18.5 ? 0 : bmi < 23 ? 1 : bmi < 25 ? 2 : 3
  const lowW = 18.5 * Math.pow(b.h / 100, 2)
  const highW = 22.9 * Math.pow(b.h / 100, 2)
  return (
    <>
      <div className="tool-form">
        <BodyFields lang={lang} b={b} />
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: 'BMI', value: r1(bmi) },
              { label: T(lang, 'भारतीय मानक के अनुसार', 'As per Indian guidelines'), value: T(lang, cats[catIdx].hi, cats[catIdx].en) },
              { label: T(lang, 'आपके कद के लिए सही वज़न', 'Healthy weight for your height'), value: `${r0(lowW)} – ${r0(highW)} ${T(lang, 'किलो', 'kg')}` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'भारतीयों के लिए BMI की सीमा आम सीमा से थोड़ी अलग रखी गई है — 18.5 से 22.9 सही, 23 से 24.9 थोड़ा ज़्यादा और 25 या उससे ऊपर बहुत ज़्यादा माना जाता है। खिलाड़ियों और भारी मसल्स वालों पर यह हिसाब ठीक नहीं बैठता।',
              'For Indians the BMI bands are kept a little different — 18.5 to 22.9 is healthy, 23 to 24.9 is overweight and 25 or above is obese. This does not fit athletes and very muscular people well.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'सही वज़न और कद भरें।', 'Please enter a valid weight and height.')}</p>
      )}
    </>
  )
}

// ---------------- BMR (Mifflin-St Jeor) ----------------
function BmrTool({ lang }: { lang: Lang }) {
  const b = useBody()
  const ok = validBody(b.w, b.h) && b.a >= 5 && b.a <= 100
  const bmr = ok ? bmrCalc(b.sex, b.w, b.h, b.a) : 0
  return (
    <>
      <div className="tool-form">
        <BodyFields lang={lang} b={b} showAge />
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'आपका BMR', 'Your BMR'), value: `${r0(bmr)} kcal / ${T(lang, 'दिन', 'day')}` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'BMR वह कैलोरी है जो शरीर बिना कुछ किए — सिर्फ़ साँस, दिल और दिमाग़ चलाने में — रोज़ जलाता है। असली रोज़ की ज़रूरत इससे ज़्यादा होती है; वह जानने के लिए TDEE कैलकुलेटर देखें।',
              'BMR is the calories your body burns doing nothing at all — just breathing, heartbeat and brain work. Your real daily need is higher than this; see the TDEE calculator for that.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'सही उम्र, वज़न और कद भरें।', 'Please enter a valid age, weight and height.')}</p>
      )}
    </>
  )
}

// ---------------- TDEE ----------------
const ACTIVITIES: { mult: number; hi: string; en: string }[] = [
  { mult: 1.2, hi: 'बहुत कम — डेस्क की नौकरी, कोई कसरत नहीं', en: 'Very low — desk job, no exercise' },
  { mult: 1.375, hi: 'हल्का — हफ़्ते में 1–3 दिन हल्की कसरत या पैदल', en: 'Light — easy exercise or walking 1–3 days a week' },
  { mult: 1.55, hi: 'मध्यम — हफ़्ते में 3–5 दिन कसरत', en: 'Moderate — exercise 3–5 days a week' },
  { mult: 1.725, hi: 'ज़्यादा — हफ़्ते में 6–7 दिन कसरत', en: 'High — exercise 6–7 days a week' },
  { mult: 1.9, hi: 'बहुत ज़्यादा — रोज़ भारी मेहनत या खिलाड़ी', en: 'Very high — heavy physical work daily, or athlete' },
]

function TdeeTool({ lang }: { lang: Lang }) {
  const b = useBody()
  const [act, setAct] = useState(1)
  const ok = validBody(b.w, b.h) && b.a >= 5 && b.a <= 100
  const tdee = ok ? bmrCalc(b.sex, b.w, b.h, b.a) * ACTIVITIES[act].mult : 0
  const loss = Math.max(tdee - 500, 0)
  return (
    <>
      <div className="tool-form">
        <BodyFields lang={lang} b={b} showAge />
        <label className="field">
          <span>{T(lang, 'रोज़ की हलचल', 'Daily activity')}</span>
          <select value={act} onChange={(e) => setAct(Number(e.target.value))}>
            {ACTIVITIES.map((a, i) => (
              <option key={a.mult} value={i}>{T(lang, a.hi, a.en)}</option>
            ))}
          </select>
        </label>
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'वज़न बनाए रखने के लिए', 'To maintain your weight'), value: `${r0(tdee)} kcal` },
              { label: T(lang, 'धीरे वज़न घटाने के लिए', 'To lose weight slowly'), value: `${r0(loss)} kcal` },
              { label: T(lang, 'वज़न बढ़ाने के लिए', 'To gain weight'), value: `${r0(tdee + 300)} kcal` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'ये अंदाज़े हैं, शरीर हर किसी का अलग जवाब देता है। 2–3 हफ़्ते वज़न देखकर मात्रा थोड़ी घटाएँ-बढ़ाएँ। बहुत कम खाना (महिलाओं के लिए 1200 और पुरुषों के लिए 1500 kcal से नीचे) बिना डॉक्टर की सलाह के न करें।',
              'These are estimates — every body responds differently. Watch your weight for 2–3 weeks and adjust a little. Do not eat very little (below 1200 kcal for women, 1500 for men) without a doctor guiding you.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'सही उम्र, वज़न और कद भरें।', 'Please enter a valid age, weight and height.')}</p>
      )}
    </>
  )
}

// ---------------- Protein ----------------
const PROTEIN_GOALS: { min: number; max: number; hi: string; en: string }[] = [
  { min: 0.8, max: 0.8, hi: 'आम सेहत — ज़्यादा कसरत नहीं', en: 'General health — little exercise' },
  { min: 1.2, max: 1.2, hi: 'रोज़ हलचल / हल्की कसरत', en: 'Active days / light exercise' },
  { min: 1.6, max: 2.0, hi: 'मसल्स बनाना — भारी कसरत', en: 'Building muscle — heavy training' },
  { min: 1.6, max: 1.6, hi: 'वज़न घटाना (मसल्स बचाकर)', en: 'Losing weight (keeping muscle)' },
]

function ProteinTool({ lang }: { lang: Lang }) {
  const [weight, setWeight] = useState('65')
  const [goal, setGoal] = useState(0)
  const w = num(weight)
  const ok = w >= 20 && w <= 300
  const g = PROTEIN_GOALS[goal]
  const lo = w * g.min
  const hiG = w * g.max
  return (
    <>
      <div className="tool-form">
        <NumField label={T(lang, 'वज़न (किलो)', 'Weight (kg)')} value={weight} onChange={setWeight} min={20} max={300} step={0.5} />
        <label className="field">
          <span>{T(lang, 'आपका लक्ष्य', 'Your goal')}</span>
          <select value={goal} onChange={(e) => setGoal(Number(e.target.value))}>
            {PROTEIN_GOALS.map((p, i) => (
              <option key={p.hi} value={i}>{T(lang, p.hi, p.en)}</option>
            ))}
          </select>
        </label>
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              {
                label: T(lang, 'रोज़ का प्रोटीन', 'Daily protein'),
                value: lo === hiG ? `${r0(lo)} g` : `${r0(lo)} – ${r0(hiG)} g`,
              },
              { label: T(lang, 'प्रति किलो वज़न', 'Per kg of weight'), value: g.min === g.max ? `${g.min} g` : `${g.min} – ${g.max} g` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'शाकाहारी हैं तो घबराएँ नहीं — दाल, चना, सोया, पनीर, दूध-दही और मूंगफली मिलाकर प्रोटीन आसानी से पूरा हो जाता है। बस हर खाने में कोई एक प्रोटीन वाली चीज़ रखें।',
              'If you are vegetarian, do not worry — dal, chana, soya, paneer, milk-curd and peanuts together easily cover your protein. Just keep one protein food in every meal.',
            )}
          </p>
          <p className="note">
            {T(
              lang,
              'गुर्दे (किडनी) की बीमारी हो तो ज़्यादा प्रोटीन लेने से पहले डॉक्टर से ज़रूर पूछें।',
              'If you have kidney disease, do ask a doctor before taking extra protein.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'सही वज़न भरें।', 'Please enter a valid weight.')}</p>
      )}
    </>
  )
}

// ---------------- Water ----------------
function WaterTool({ lang }: { lang: Lang }) {
  const [weight, setWeight] = useState('65')
  const w = num(weight)
  const ok = w >= 20 && w <= 300
  const loL = (w * 30) / 1000
  const hiL = (w * 35) / 1000
  return (
    <>
      <div className="tool-form">
        <NumField label={T(lang, 'वज़न (किलो)', 'Weight (kg)')} value={weight} onChange={setWeight} min={20} max={300} step={0.5} />
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'रोज़ का पानी', 'Water per day'), value: `${r1(loL)} – ${r1(hiL)} ${T(lang, 'लीटर', 'litres')}` },
              { label: T(lang, 'गिलासों में (250 ml)', 'In glasses (250 ml)'), value: `${r0(loL * 4)} – ${r0(hiL * 4)}` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'गर्मी, कसरत या मेहनत वाले दिन ऊपर वाली मात्रा के आसपास रखें। प्यास लगना शरीर का पहला संकेत है — उसे अनदेखा न करें। खाने और दाल-सब्ज़ी से भी कुछ पानी मिलता है, इसलिए हर किसी की ज़रूरत थोड़ी अलग होती है।',
              'On hot days, or days with exercise or hard work, stay near the upper number. Thirst is the body’s first signal — do not ignore it. Food also gives some water, so everyone’s exact need differs a little.',
            )}
          </p>
          <p className="note">
            {T(
              lang,
              'दिल या गुर्दे की बीमारी में डॉक्टर जितना पानी बताएँ, उतना ही पिएं।',
              'With heart or kidney disease, drink only as much water as your doctor has advised.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'सही वज़न भरें।', 'Please enter a valid weight.')}</p>
      )}
    </>
  )
}

// ---------------- Ideal weight (Devine + Indian BMI range) ----------------
function IdealWeightTool({ lang }: { lang: Lang }) {
  const b = useBody()
  const ok = b.h >= 100 && b.h <= 250
  const inchesOver = b.h / 2.54 - 60
  const devine = (b.sex === 'male' ? 50 : 45.5) + 2.3 * inchesOver
  const bmiLo = 18.5 * Math.pow(b.h / 100, 2)
  const bmiHi = 22.9 * Math.pow(b.h / 100, 2)
  return (
    <>
      <div className="tool-form">
        <SexField lang={lang} sex={b.sex} setSex={b.setSex} />
        <NumField label={T(lang, 'कद (सेमी)', 'Height (cm)')} value={b.height} onChange={b.setHeight} min={100} max={250} />
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'सही वज़न की रेंज (BMI हिसाब)', 'Healthy range (by BMI)'), value: `${r0(bmiLo)} – ${r0(bmiHi)} ${T(lang, 'किलो', 'kg')}` },
              { label: T(lang, 'Devine फ़ॉर्मूले से अंदाज़ा', 'Devine formula estimate'), value: `${r0(devine * 0.9)} – ${r0(devine * 1.1)} ${T(lang, 'किलो', 'kg')}` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'ये रेंज आम वयस्कों के लिए हैं। हड्डियों का ढांचा, मसल्स और उम्र से हर शरीर अलग होता है — एक ही नंबर के पीछे न पड़ें, रेंज के अंदर रहना काफी है। गर्भवती महिलाओं और बच्चों पर यह हिसाब नहीं लगता।',
              'These ranges are for average adults. Bone structure, muscle and age make every body different — do not chase one exact number; staying inside the range is enough. This does not apply to pregnant women and children.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'सही कद भरें।', 'Please enter a valid height.')}</p>
      )}
    </>
  )
}

// ---------------- Indian food calories ----------------
interface Food { hi: string; en: string; sHi: string; sEn: string; kcal: number }
const FOODS: Food[] = [
  { hi: 'रोटी', en: 'Roti', sHi: '1 मध्यम', sEn: '1 medium', kcal: 100 },
  { hi: 'फुल्का (बिना घी)', en: 'Phulka (no ghee)', sHi: '1', sEn: '1 pc', kcal: 80 },
  { hi: 'पराठा', en: 'Paratha', sHi: '1 (तेल में)', sEn: '1 (in oil)', kcal: 210 },
  { hi: 'पूड़ी', en: 'Puri', sHi: '1', sEn: '1 pc', kcal: 90 },
  { hi: 'भटूरा', en: 'Bhatura', sHi: '1', sEn: '1 pc', kcal: 300 },
  { hi: 'नान', en: 'Naan', sHi: '1', sEn: '1 pc', kcal: 260 },
  { hi: 'अरहर दाल (बनी हुई)', en: 'Arhar dal (cooked)', sHi: '1 कटोरी', sEn: '1 katori (150 ml)', kcal: 170 },
  { hi: 'दाल मखनी', en: 'Dal makhani', sHi: '1 कटोरी', sEn: '1 katori', kcal: 230 },
  { hi: 'छोले', en: 'Chole', sHi: '1 कटोरी', sEn: '1 katori', kcal: 220 },
  { hi: 'राजमा', en: 'Rajma', sHi: '1 कटोरी', sEn: '1 katori', kcal: 210 },
  { hi: 'आलू-गोबी सब्ज़ी', en: 'Aloo-gobhi sabzi', sHi: '1 कटोरी', sEn: '1 katori', kcal: 150 },
  { hi: 'भिंडी की सब्ज़ी', en: 'Bhindi sabzi', sHi: '1 कटोरी', sEn: '1 katori', kcal: 110 },
  { hi: 'पालक पनीर', en: 'Palak paneer', sHi: '1 कटोरी', sEn: '1 katori', kcal: 190 },
  { hi: 'पनीर बटर मसाला', en: 'Paneer butter masala', sHi: '1 कटोरी', sEn: '1 katori', kcal: 280 },
  { hi: 'सादा चावल (पका)', en: 'Steamed rice', sHi: '1 कटोरी', sEn: '1 katori (150 g)', kcal: 200 },
  { hi: 'जीरा राइस', en: 'Jeera rice', sHi: '1 कटोरी', sEn: '1 katori', kcal: 230 },
  { hi: 'वेज बिरयानी', en: 'Veg biryani', sHi: '1 प्लेट', sEn: '1 plate', kcal: 450 },
  { hi: 'खिचड़ी', en: 'Khichdi', sHi: '1 कटोरी', sEn: '1 katori', kcal: 180 },
  { hi: 'इडली', en: 'Idli', sHi: '1', sEn: '1 pc', kcal: 60 },
  { hi: 'सादा डोसा', en: 'Plain dosa', sHi: '1', sEn: '1 pc', kcal: 170 },
  { hi: 'मसाला डोसा', en: 'Masala dosa', sHi: '1', sEn: '1 pc', kcal: 290 },
  { hi: 'उत्तपम', en: 'Uttapam', sHi: '1', sEn: '1 pc', kcal: 230 },
  { hi: 'पोहा', en: 'Poha', sHi: '1 प्लेट', sEn: '1 plate', kcal: 250 },
  { hi: 'उपमा', en: 'Upma', sHi: '1 प्लेट', sEn: '1 plate', kcal: 210 },
  { hi: 'ढोकला', en: 'Dhokla', sHi: '1 टुकड़ा', sEn: '1 piece', kcal: 60 },
  { hi: 'समोसा', en: 'Samosa', sHi: '1', sEn: '1 pc', kcal: 260 },
  { hi: 'कचौड़ी', en: 'Kachori', sHi: '1', sEn: '1 pc', kcal: 190 },
  { hi: 'पकौड़े', en: 'Pakode', sHi: '100 ग्राम', sEn: '100 g', kcal: 290 },
  { hi: 'वड़ा पाव', en: 'Vada pav', sHi: '1', sEn: '1 pc', kcal: 290 },
  { hi: 'पाव भाजी', en: 'Pav bhaji', sHi: '1 प्लेट', sEn: '1 plate', kcal: 400 },
  { hi: 'मैगी (पकी हुई)', en: 'Maggi (cooked)', sHi: '1 पैक', sEn: '1 pack', kcal: 310 },
  { hi: 'चाय (दूध-चीनी वाली)', en: 'Chai (milk + sugar)', sHi: '1 कप', sEn: '1 cup (150 ml)', kcal: 90 },
  { hi: 'कॉफ़ी (दूध वाली)', en: 'Coffee (with milk)', sHi: '1 कप', sEn: '1 cup', kcal: 110 },
  { hi: 'मीठी लस्सी', en: 'Sweet lassi', sHi: '1 गिलास', sEn: '1 glass', kcal: 240 },
  { hi: 'छाछ', en: 'Chaas (buttermilk)', sHi: '1 गिलास', sEn: '1 glass', kcal: 60 },
  { hi: 'उबला अंडा', en: 'Boiled egg', sHi: '1', sEn: '1', kcal: 78 },
  { hi: 'आमलेट (2 अंडे)', en: 'Omelette (2 eggs)', sHi: '1', sEn: '1', kcal: 180 },
  { hi: 'चिकन करी', en: 'Chicken curry', sHi: '1 कटोरी', sEn: '1 katori', kcal: 240 },
  { hi: 'ग्रिल्ड चिकन', en: 'Grilled chicken', sHi: '100 ग्राम', sEn: '100 g', kcal: 165 },
  { hi: 'तली मछली', en: 'Fried fish', sHi: '100 ग्राम', sEn: '100 g', kcal: 210 },
  { hi: 'दही', en: 'Curd (dahi)', sHi: '1 कटोरी', sEn: '1 katori', kcal: 100 },
  { hi: 'दूध (टोंड)', en: 'Milk (toned)', sHi: '1 गिलास (200 ml)', sEn: '1 glass (200 ml)', kcal: 120 },
  { hi: 'केला', en: 'Banana', sHi: '1 मध्यम', sEn: '1 medium', kcal: 105 },
  { hi: 'सेब', en: 'Apple', sHi: '1 मध्यम', sEn: '1 medium', kcal: 95 },
  { hi: 'पापड़ (भुना)', en: 'Papad (roasted)', sHi: '1', sEn: '1 pc', kcal: 35 },
  { hi: 'गुलाब जामुन', en: 'Gulab jamun', sHi: '1', sEn: '1 pc', kcal: 150 },
  { hi: 'जलेबी', en: 'Jalebi', sHi: '100 ग्राम', sEn: '100 g', kcal: 380 },
]

function FoodCaloriesTool({ lang }: { lang: Lang }) {
  const [q, setQ] = useState('')
  const [qty, setQty] = useState<Record<string, string>>({})
  const query = q.trim().toLowerCase()
  const shown = FOODS.filter(
    (f) => !query || f.hi.includes(q.trim()) || f.en.toLowerCase().includes(query),
  )
  const total = FOODS.reduce((sum, f) => sum + (num(qty[f.en] ?? '') || 0) * f.kcal, 0)
  return (
    <>
      <div className="tool-form">
        <label className="field">
          <span>{T(lang, 'खाना खोजें', 'Search a food')}</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T(lang, 'जैसे — रोटी, समोसा, चाय', 'e.g. roti, samosa, chai')}
          />
        </label>
      </div>
      <p className="note">
        {T(
          lang,
          'हर चीज़ के सामने मात्रा भर दें — नीचे कुल कैलोरी जुड़ती जाएगी। ये अंदाज़े हैं; तेल-घी और मात्रा से असली कैलोरी थोड़ी ऊपर-नीचे हो सकती है।',
          'Enter how much you ate next to each item — the total adds up below. These are estimates; oil, ghee and portion size can shift the real calories a little.',
        )}
      </p>
      <ul className="steps-list">
        {shown.map((f) => (
          <li key={f.en}>
            <strong>{T(lang, f.hi, f.en)}</strong> — {T(lang, f.sHi, f.sEn)} · {f.kcal} kcal{' '}
            <input
              type="number"
              min={0}
              step={0.5}
              value={qty[f.en] ?? ''}
              onChange={(e) => setQty({ ...qty, [f.en]: e.target.value })}
              placeholder={T(lang, 'कितना खाया', 'How much')}
              aria-label={`${f.en} quantity`}
            />
          </li>
        ))}
      </ul>
      {shown.length === 0 ? (
        <p className="note">{T(lang, 'इस नाम का खाना सूची में नहीं मिला।', 'No food in the list matches that name.')}</p>
      ) : null}
      {total > 0 ? (
        <div className="result-card">
          <ResultGrid items={[{ label: T(lang, 'कुल कैलोरी', 'Total calories'), value: `${r0(total)} kcal` }]} />
          <Disclaimer lang={lang} />
        </div>
      ) : null}
    </>
  )
}

// ---------------- Date helpers ----------------
const DAY_MS = 86400000
function toISO(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function todayISO() {
  return toISO(new Date())
}
function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setTime(d.getTime() + days * DAY_MS)
  return toISO(d)
}
function diffDaysISO(from: string, to: string) {
  const a = new Date(from + 'T00:00:00').getTime()
  const b = new Date(to + 'T00:00:00').getTime()
  return Math.round((b - a) / DAY_MS)
}
function fmtDate(iso: string, lang: Lang) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function FertilityHonesty({ lang }: { lang: Lang }) {
  return (
    <p className="note warn">
      {T(
        lang,
        'यह सिर्फ़ एक अंदाज़ा है — शरीर हर महीने बिल्कुल एक जैसा नहीं चलता। गर्भ रोकने के लिए सिर्फ़ इन तारीखों पर भरोसा न करें, और गर्भ की कोशिश लंबे समय से सफल न हो तो डॉक्टर से मिलें।',
        'This is only an estimate — the body does not run exactly the same every month. Do not rely on these dates alone to prevent pregnancy, and if you have been trying to conceive for a long time, do see a doctor.',
      )}
    </p>
  )
}

// ---------------- Period ----------------
function PeriodTool({ lang }: { lang: Lang }) {
  const [lmp, setLmp] = useState(() => addDaysISO(todayISO(), -14))
  const [cycle, setCycle] = useState('28')
  const [dur, setDur] = useState('5')
  const c = num(cycle)
  const d = num(dur)
  const ok = !!lmp && c >= 21 && c <= 45 && d >= 2 && d <= 10
  const next = ok ? addDaysISO(lmp, c) : ''
  const nextEnd = ok ? addDaysISO(next, d - 1) : ''
  const after = ok ? addDaysISO(next, c) : ''
  const left = ok ? diffDaysISO(todayISO(), next) : 0
  return (
    <>
      <div className="tool-form">
        <label className="field">
          <span>{T(lang, 'पिछली माहवारी का पहला दिन', 'First day of last period')}</span>
          <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </label>
        <NumField label={T(lang, 'माहवारी का चक्र (दिन)', 'Cycle length (days)')} value={cycle} onChange={setCycle} min={21} max={45} />
        <NumField label={T(lang, 'माहवारी कितने दिन चलती है', 'How long the period lasts (days)')} value={dur} onChange={setDur} min={2} max={10} />
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'अगली माहवारी (अंदाज़ा)', 'Next period (estimate)'), value: fmtDate(next, lang) },
              { label: T(lang, 'चलने तक', 'Likely to last until'), value: fmtDate(nextEnd, lang) },
              { label: T(lang, 'उसके बाद वाली', 'The one after that'), value: fmtDate(after, lang) },
              {
                label: T(lang, 'कितने दिन बाकी', 'Days to go'),
                value: left > 0 ? `${left} ${T(lang, 'दिन', 'days')}` : left === 0 ? T(lang, 'आज ही', 'Today') : T(lang, 'तारीख़ निकल चुकी है', 'Date has passed'),
              },
            ]}
          />
          <FertilityHonesty lang={lang} />
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'तारीख़ और चक्र के सही दिन भरें (चक्र 21–45 दिन)।', 'Please enter the date and a cycle between 21–45 days.')}</p>
      )}
    </>
  )
}

// ---------------- Ovulation ----------------
function OvulationTool({ lang }: { lang: Lang }) {
  const [lmp, setLmp] = useState(() => addDaysISO(todayISO(), -14))
  const [cycle, setCycle] = useState('28')
  const c = num(cycle)
  const ok = !!lmp && c >= 21 && c <= 45
  const next = ok ? addDaysISO(lmp, c) : ''
  const ov = ok ? addDaysISO(next, -14) : ''
  const fStart = ok ? addDaysISO(ov, -5) : ''
  const fEnd = ok ? addDaysISO(ov, 1) : ''
  return (
    <>
      <div className="tool-form">
        <label className="field">
          <span>{T(lang, 'पिछली माहवारी का पहला दिन', 'First day of last period')}</span>
          <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </label>
        <NumField label={T(lang, 'माहवारी का चक्र (दिन)', 'Cycle length (days)')} value={cycle} onChange={setCycle} min={21} max={45} />
      </div>
      {ok ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'ओव्यूलेशन का दिन (अंदाज़ा)', 'Ovulation day (estimate)'), value: fmtDate(ov, lang) },
              { label: T(lang, 'सबसे अच्छे दिन शुरू', 'Fertile window starts'), value: fmtDate(fStart, lang) },
              { label: T(lang, 'सबसे अच्छे दिन खत्म', 'Fertile window ends'), value: fmtDate(fEnd, lang) },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'आम तौर पर अंडा अगली माहवारी से करीब 14 दिन पहले निकलता है, और उसके आसपास के 5–6 दिन गर्भ ठहरने के लिए सबसे अच्छे माने जाते हैं।',
              'The egg is usually released about 14 days before the next period, and the 5–6 days around that are considered the most fertile.',
            )}
          </p>
          <FertilityHonesty lang={lang} />
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'तारीख़ और चक्र के सही दिन भरें (चक्र 21–45 दिन)।', 'Please enter the date and a cycle between 21–45 days.')}</p>
      )}
    </>
  )
}

// ---------------- Pregnancy due date (Naegele, LMP + 280) ----------------
function DueDateTool({ lang }: { lang: Lang }) {
  const [lmp, setLmp] = useState(() => addDaysISO(todayISO(), -70))
  const ok = !!lmp
  const edd = ok ? addDaysISO(lmp, 280) : ''
  const elapsed = ok ? diffDaysISO(lmp, todayISO()) : 0
  const weeks = Math.floor(elapsed / 7)
  const days = elapsed % 7
  const sane = elapsed >= 0 && elapsed <= 300
  const trimester = weeks < 14 ? 1 : weeks < 28 ? 2 : 3
  const left = ok ? diffDaysISO(todayISO(), edd) : 0
  return (
    <>
      <div className="tool-form">
        <label className="field">
          <span>{T(lang, 'आख़िरी माहवारी का पहला दिन (LMP)', 'First day of last period (LMP)')}</span>
          <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </label>
      </div>
      {ok && sane ? (
        <div className="result-card">
          <ResultGrid
            items={[
              { label: T(lang, 'डिलीवरी की संभावित तारीख़', 'Expected delivery date'), value: fmtDate(edd, lang) },
              { label: T(lang, 'आज गर्भ का समय', 'You are at'), value: `${weeks} ${T(lang, 'हफ़्ते', 'weeks')} ${days} ${T(lang, 'दिन', 'days')}` },
              { label: T(lang, 'तिमाही', 'Trimester'), value: `${trimester} ${T(lang, '(1–3)', 'of 3')}` },
              { label: T(lang, 'तारीख़ में दिन बाकी', 'Days to due date'), value: `${left} ${T(lang, 'दिन', 'days')}` },
            ]}
          />
          <p className="note">
            {T(
              lang,
              'यह तारीख़ LMP में 280 दिन जोड़कर निकली है (Naegele नियम)। असल डिलीवरी इस तारीख़ से 2 हफ़्ते पहले या बाद होना आम बात है — सिर्फ़ कुछ ही बच्चे ठीक इसी दिन होते हैं। अल्ट्रासाउंड की तारीख़ डॉक्टर के पास ज़्यादा भरोसेमंद होती है।',
              'This date is LMP plus 280 days (Naegele’s rule). Delivery 2 weeks before or after this date is common — very few babies arrive on the exact day. The ultrasound date with your doctor is more reliable.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note warn">
          {T(
            lang,
            'तारीख़ ठीक नहीं लग रही — LMP आज से पहले की और 300 दिन के अंदर की होनी चाहिए।',
            'That date looks off — the LMP should be in the past and within the last 300 days.',
          )}
        </p>
      )}
    </>
  )
}

// ---------------- Sleep (90-minute cycles) ----------------
function fmtTime(mins: number) {
  const m = ((mins % 1440) + 1440) % 1440
  const hh = Math.floor(m / 60)
  const mm = m % 60
  const ap = hh < 12 ? 'AM' : 'PM'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`
}

function SleepTool({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<'wake' | 'sleep'>('wake')
  const [time, setTime] = useState('06:30')
  const [hh, mm] = time.split(':').map((x) => parseInt(x, 10) || 0)
  const base = hh * 60 + mm
  const cycles = [6, 5, 4]
  const items = cycles.map((cy) => {
    const mins = mode === 'wake' ? base - cy * 90 - 15 : base + cy * 90 + 15
    return {
      label: `${cy} ${T(lang, 'साइकल', 'cycles')} · ${cy * 1.5} ${T(lang, 'घंटे नींद', 'hrs sleep')}${cy === 6 ? ` · ${T(lang, 'सबसे अच्छा', 'best')}` : ''}`,
      value: fmtTime(mins),
    }
  })
  return (
    <>
      <div className="tool-form">
        <label className="field">
          <span>{T(lang, 'क्या जानना है', 'What do you want to know')}</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'wake' | 'sleep')}>
            <option value="wake">{T(lang, 'मुझे इस समय जागना है — सोने का समय बताओ', 'I want to wake up at — tell me bedtime')}</option>
            <option value="sleep">{T(lang, 'मैं इस समय सोऊंगा — जागने का समय बताओ', 'I will sleep at — tell me wake-up time')}</option>
          </select>
        </label>
        <label className="field">
          <span>{mode === 'wake' ? T(lang, 'जागने का समय', 'Wake-up time') : T(lang, 'सोने का समय', 'Bedtime')}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      {time ? (
        <div className="result-card">
          <ResultGrid items={items} />
          <p className="note">
            {T(
              lang,
              'नींद करीब 90 मिनट की साइकल में चलती है। साइकल के बीच में जागने से थकान ज़्यादा लगती है, साइकल पूरी करके जागने से ताज़गी रहती है। हिसाब में सोने में लगने वाले करीब 15 मिनट भी जोड़े गए हैं।',
              'Sleep runs in roughly 90-minute cycles. Waking mid-cycle feels heavier; finishing a cycle feels fresher. About 15 minutes to fall asleep are included in the calculation.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : null}
    </>
  )
}

// ---------------- Deficiency risk checker ----------------
interface DefSection {
  key: string
  nameHi: string
  nameEn: string
  testHi: string
  testEn: string
  symptoms: { hi: string; en: string }[]
  redHi: string[]
  redEn: string[]
}
const DEF_SECTIONS: DefSection[] = [
  {
    key: 'vitd',
    nameHi: 'Vitamin D',
    nameEn: 'Vitamin D',
    testHi: '25-OH Vitamin D खून की जाँच',
    testEn: '25-OH Vitamin D blood test',
    symptoms: [
      { hi: 'हड्डियों या कमर में दर्द रहता है', en: 'Aching bones or back pain' },
      { hi: 'मांसपेशियों में कमज़ोरी या दर्द', en: 'Weak or aching muscles' },
      { hi: 'दिन में धूप में 15 मिनट से भी कम निकलना होता है', en: 'Less than 15 minutes of sunlight a day' },
      { hi: 'बिना वजह थकान बनी रहती है', en: 'Tiredness without a clear reason' },
      { hi: 'बार-बार सर्दी-ज़ुकाम या इन्फेक्शन होता है', en: 'Frequent colds or infections' },
      { hi: 'मन उदास रहता है, मन नहीं लगता', en: 'Low mood, little interest in things' },
    ],
    redHi: ['बिना चोट के हड्डी टूटना', 'बहुत तेज़ या लगातार बढ़ता हड्डी का दर्द'],
    redEn: ['A bone breaking without an injury', 'Severe or steadily worsening bone pain'],
  },
  {
    key: 'b12',
    nameHi: 'Vitamin B12',
    nameEn: 'Vitamin B12',
    testHi: 'Serum Vitamin B12 खून की जाँच',
    testEn: 'Serum Vitamin B12 blood test',
    symptoms: [
      { hi: 'हाथ-पैर में झुनझुनी या सुन्नपन', en: 'Tingling or numbness in hands and feet' },
      { hi: 'जीभ में छाले या जलन', en: 'Sores or burning on the tongue' },
      { hi: 'याददाश्त कमज़ोर, बातें भूलना', en: 'Weak memory, forgetting things' },
      { hi: 'बहुत थकान और कमज़ोरी', en: 'Strong tiredness and weakness' },
      { hi: 'चक्कर आते हैं', en: 'Feeling dizzy' },
      { hi: 'पूरी तरह शाकाहारी खाना (मांस-अंडा बिल्कुल नहीं, दूध भी कम)', en: 'Fully vegetarian food (no meat or egg, little dairy)' },
    ],
    redHi: ['चलने में लड़खड़ाहट या दिक्कत', 'हाथ-पैर का सुन्नपन तेज़ी से बढ़ना'],
    redEn: ['Unsteady walking or trouble walking', 'Numbness spreading quickly'],
  },
  {
    key: 'iron',
    nameHi: 'आयरन (खून की कमी)',
    nameEn: 'Iron (low blood)',
    testHi: 'CBC (हीमोग्लोबिन) और Serum Ferritin जाँच',
    testEn: 'CBC (haemoglobin) and Serum Ferritin tests',
    symptoms: [
      { hi: 'थकान और हल्की मेहनत में साँस फूलना', en: 'Tiredness and breathlessness on light effort' },
      { hi: 'चेहरा, होंठ या नाख़ून फीके-पीले दिखते हैं', en: 'Face, lips or nails look pale' },
      { hi: 'बाल आम से ज़्यादा झड़ते हैं', en: 'More hair fall than usual' },
      { hi: 'चक्कर आते हैं या सिर हल्का लगता है', en: 'Dizziness or a light head' },
      { hi: 'मुँह के कोनों में छाले या फटना', en: 'Sores or cracks at the corners of the mouth' },
      { hi: 'महिलाओं में माहवारी बहुत भारी होती है', en: 'Very heavy periods (for women)' },
    ],
    redHi: ['बेहोशी या गिर पड़ना', 'साँस लेने में साफ़ तकलीफ़', 'उल्टी या मल में खून'],
    redEn: ['Fainting or collapsing', 'Clear difficulty in breathing', 'Blood in vomit or stool'],
  },
]

function bandOf(score: number): 0 | 1 | 2 {
  return score <= 1 ? 0 : score <= 3 ? 1 : 2
}
const BAND_LABELS = [
  { hi: 'कम संभावना', en: 'Low likelihood' },
  { hi: 'मध्यम संभावना', en: 'Moderate likelihood' },
  { hi: 'अधिक संभावना', en: 'Higher likelihood' },
]

function DeficiencyTool({ lang }: { lang: Lang }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  return (
    <>
      <p className="note">
        {T(
          lang,
          'जो लक्षण आप पर लगते हों, उन पर निशान लगाएं। यह सिर्फ़ लक्षणों के आधार पर एक अंदाज़ा है — किसी कमी की पहचान इससे नहीं होती।',
          'Tick the symptoms that apply to you. This is only a rough estimate from symptoms — it does not identify any deficiency.',
        )}
      </p>
      {DEF_SECTIONS.map((sec) => {
        const score = sec.symptoms.reduce((s, _sym, i) => s + (checked[`${sec.key}-${i}`] ? 1 : 0), 0)
        const band = bandOf(score)
        return (
          <div className="card" key={sec.key}>
            <h3>{sec.nameHi === sec.nameEn ? sec.nameEn : `${T(lang, sec.nameHi, sec.nameEn)}`}</h3>
            <div className="tool-form">
              {sec.symptoms.map((sym, i) => {
                const id = `${sec.key}-${i}`
                return (
                  <label className="field" key={id}>
                    <input
                      type="checkbox"
                      checked={!!checked[id]}
                      onChange={(e) => setChecked({ ...checked, [id]: e.target.checked })}
                    />{' '}
                    <span>{T(lang, sym.hi, sym.en)}</span>
                  </label>
                )
              })}
            </div>
            <div className="result-card">
              <p>
                <span className="chip">{T(lang, BAND_LABELS[band].hi, BAND_LABELS[band].en)}</span>{' '}
                {T(
                  lang,
                  `लक्षणों के आधार पर ${sec.nameHi} की कमी की ${BAND_LABELS[band].hi} लगती है।`,
                  `From these symptoms, a deficiency of ${sec.nameEn} looks like a ${BAND_LABELS[band].en.toLowerCase()}.`,
                )}
              </p>
              <p className="note">
                {T(
                  lang,
                  `पक्का पता सिर्फ़ खून की जाँच से चलता है — इसके लिए ${sec.testHi} होती है। लक्षण कई और वजहों से भी हो सकते हैं, इसलिए अकेले लक्षण देखकर कोई दवा या सप्लीमेंट खुद से शुरू न करें।`,
                  `Only a blood test can confirm it — the test for this is the ${sec.testEn}. These symptoms can have many other causes too, so do not start any medicine or supplement on your own just from symptoms.`,
                )}
              </p>
              <p className="note warn">
                {T(lang, 'ये लक्षण हों तो डॉक्टर से तुरंत मिलें: ', 'See a doctor promptly if you have: ')}
                {(lang === 'hi' ? sec.redHi : sec.redEn).join(' · ')}
              </p>
            </div>
          </div>
        )
      })}
      <Disclaimer lang={lang} />
    </>
  )
}

// ---------------- Lab report reader ----------------
type Band = 'low' | 'mid' | 'ok' | 'high'
interface LabTest {
  key: string
  nameHi: string
  nameEn: string
  unit: string
  needsSex?: boolean
  rangeText: (sex: Sex) => { hi: string; en: string }
  classify: (v: number, sex: Sex) => Band
  texts: Partial<Record<Band, { hi: string; en: string }>>
  next: { hi: string; en: string }
}
const LAB_TESTS: LabTest[] = [
  {
    key: 'vitd',
    nameHi: 'Vitamin D (25-OH)',
    nameEn: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    rangeText: () => ({
      hi: 'आम तौर पर 30–100 ng/mL सही माना जाता है। 20–30 को कम और 20 से नीचे को साफ़ कमी माना जाता है।',
      en: 'Generally 30–100 ng/mL is taken as fine. 20–30 is low, and below 20 is a clear deficiency.',
    }),
    classify: (v) => (v < 30 ? 'low' : v <= 100 ? 'ok' : 'high'),
    texts: {
      low: {
        hi: 'आपकी वैल्यू आम रेंज से कम है। हड्डियों और मांसपेशियों की सेहत के लिए यह वैल्यू डॉक्टर को दिखाना ठीक रहेगा।',
        en: 'Your value is below the usual range. It is worth showing this to a doctor for your bone and muscle health.',
      },
      ok: {
        hi: 'आपकी वैल्यू आम रेंज के अंदर है।',
        en: 'Your value is inside the usual range.',
      },
      high: {
        hi: 'आपकी वैल्यू आम रेंज से काफी ऊँची है। इतनी ऊँची वैल्यू भी ठीक नहीं होती — डॉक्टर से सलाह लें।',
        en: 'Your value is well above the usual range. Very high values are not good either — do take a doctor’s advice.',
      },
    },
    next: {
      hi: 'आगे क्या करना है, यह डॉक्टर आपकी पूरी सेहत देखकर तय करते हैं। आम तौर पर कुछ महीनों बाद दोबारा जाँच से पता चलता है कि वैल्यू सुधरी या नहीं। खुद से कोई खुराक तय न करें।',
      en: 'What to do next is for a doctor to decide after seeing your overall health. Usually a repeat test after a few months shows whether the value has improved. Do not decide any dose yourself.',
    },
  },
  {
    key: 'b12',
    nameHi: 'Vitamin B12',
    nameEn: 'Vitamin B12',
    unit: 'pg/mL',
    rangeText: () => ({
      hi: 'आम तौर पर 200–900 pg/mL सही माना जाता है। लैब के हिसाब से रेंज थोड़ी अलग हो सकती है — रिपोर्ट पर छपी रेंज भी देखें।',
      en: 'Generally 200–900 pg/mL is taken as fine. Ranges differ a little by lab — also check the range printed on your report.',
    }),
    classify: (v) => (v < 200 ? 'low' : v <= 900 ? 'ok' : 'high'),
    texts: {
      low: {
        hi: 'आपकी वैल्यू आम रेंज से कम है। थकान, झुनझुनी या भूलने जैसी तकलीफ़ हो तो यह रिपोर्ट डॉक्टर को ज़रूर दिखाएं।',
        en: 'Your value is below the usual range. If you have tiredness, tingling or forgetfulness, do show this report to a doctor.',
      },
      ok: { hi: 'आपकी वैल्यू आम रेंज के अंदर है।', en: 'Your value is inside the usual range.' },
      high: {
        hi: 'आपकी वैल्यू रेंज से ऊपर है। बिना वजह ऊँची वैल्यू पर डॉक्टर से बात करें।',
        en: 'Your value is above the range. For a high value without a clear reason, do speak to a doctor.',
      },
    },
    next: {
      hi: 'आगे की जाँच या इलाज डॉक्टर तय करते हैं। शाकाहारी खाने वालों में यह कमी आम है — खाने में दूध-दही, पनीर और अंडा (जो खाते हों) रखना आम तौर पर मदद करता है।',
      en: 'Further tests or treatment are for a doctor to decide. This deficiency is common in vegetarian diets — keeping milk-curd, paneer and eggs (if you eat them) in your food generally helps.',
    },
  },
  {
    key: 'hb',
    nameHi: 'हीमोग्लोबिन (Hb)',
    nameEn: 'Haemoglobin (Hb)',
    unit: 'g/dL',
    needsSex: true,
    rangeText: (sex) =>
      sex === 'male'
        ? { hi: 'पुरुषों के लिए आम रेंज 13–17 g/dL मानी जाती है।', en: 'For men, the usual range is 13–17 g/dL.' }
        : { hi: 'महिलाओं के लिए आम रेंज 12–15.5 g/dL मानी जाती है।', en: 'For women, the usual range is 12–15.5 g/dL.' },
    classify: (v, sex) => {
      const lo = sex === 'male' ? 13 : 12
      const hi = sex === 'male' ? 17 : 15.5
      return v < lo ? 'low' : v <= hi ? 'ok' : 'high'
    },
    texts: {
      low: {
        hi: 'आपकी वैल्यू रेंज से कम है — इसे आम भाषा में खून की कमी की ओर इशारा माना जाता है। वजह जानना ज़रूरी है, इसलिए रिपोर्ट डॉक्टर को दिखाएं।',
        en: 'Your value is below the range — in simple words, this points towards low blood. Finding the reason matters, so do show the report to a doctor.',
      },
      ok: { hi: 'आपकी वैल्यू आम रेंज के अंदर है।', en: 'Your value is inside the usual range.' },
      high: {
        hi: 'आपकी वैल्यू रेंज से ऊपर है। ऐसा कम होता है — डॉक्टर से चर्चा करें।',
        en: 'Your value is above the range. This is less common — do discuss it with a doctor.',
      },
    },
    next: {
      hi: 'खून की कमी की वजह कई हो सकती हैं — खाने में आयरन की कमी उनमें से एक है। गुड़-चना, हरी सब्ज़ियाँ, खजूर और (जो खाते हों) मांस-अंडा खाने में रखना आम सलाह है, पर वजह की जाँच डॉक्टर ही करेंगे।',
      en: 'Low blood can have many causes — low iron in food is only one of them. Jaggery-chana, green vegetables, dates and (if you eat them) meat and eggs in food is common advice, but only a doctor will check the real cause.',
    },
  },
  {
    key: 'ferritin',
    nameHi: 'फेरिटिन (Ferritin)',
    nameEn: 'Ferritin',
    unit: 'ng/mL',
    needsSex: true,
    rangeText: (sex) =>
      sex === 'male'
        ? { hi: 'पुरुषों के लिए आम रेंज करीब 30–300 ng/mL मानी जाती है। यह शरीर में जमा आयरन दिखाता है।', en: 'For men, the usual range is about 30–300 ng/mL. It shows the iron stored in the body.' }
        : { hi: 'महिलाओं के लिए आम रेंज करीब 15–150 ng/mL मानी जाती है। यह शरीर में जमा आयरन दिखाता है।', en: 'For women, the usual range is about 15–150 ng/mL. It shows the iron stored in the body.' },
    classify: (v, sex) => {
      const lo = sex === 'male' ? 30 : 15
      const hi = sex === 'male' ? 300 : 150
      return v < lo ? 'low' : v <= hi ? 'ok' : 'high'
    },
    texts: {
      low: {
        hi: 'आपकी वैल्यू रेंज से कम है — शरीर में जमा आयरन कम होने की ओर इशारा है। हीमोग्लोबिन ठीक हो तब भी यह कमी थकान और बाल झड़ने से जुड़ सकती है। रिपोर्ट डॉक्टर को दिखाएं।',
        en: 'Your value is below the range — it points to low iron stores in the body. Even with normal haemoglobin, this can be linked to tiredness and hair fall. Do show the report to a doctor.',
      },
      ok: { hi: 'आपकी वैल्यू आम रेंज के अंदर है।', en: 'Your value is inside the usual range.' },
      high: {
        hi: 'आपकी वैल्यू रेंज से ऊपर है। फेरिटिन सूजन या किसी और वजह से भी बढ़ सकता है — डॉक्टर से चर्चा करें।',
        en: 'Your value is above the range. Ferritin can also rise with inflammation or other reasons — do discuss it with a doctor.',
      },
    },
    next: {
      hi: 'आगे की जाँच डॉक्टर तय करते हैं। खाने में आयरन वाली चीज़ों के साथ नींबू-आंवला जैसी खट्टी चीज़ें लेने से आयरन शरीर में बेहतर लगता है — यह आम जानकारी है।',
      en: 'Further testing is for a doctor to decide. Taking sour foods like lemon or amla along with iron-rich food helps the body absorb iron better — this is general information.',
    },
  },
  {
    key: 'tsh',
    nameHi: 'TSH (थायरॉइड)',
    nameEn: 'TSH (Thyroid)',
    unit: 'mIU/L',
    rangeText: () => ({
      hi: 'आम तौर पर 0.4–4.5 mIU/L सही माना जाता है। गर्भावस्था में यह रेंज अलग होती है।',
      en: 'Generally 0.4–4.5 mIU/L is taken as fine. In pregnancy this range is different.',
    }),
    classify: (v) => (v < 0.4 ? 'low' : v <= 4.5 ? 'ok' : 'high'),
    texts: {
      low: {
        hi: 'आपकी वैल्यू रेंज से नीचे है। थायरॉइड की पूरी तस्वीर के लिए डॉक्टर अक्सर T3-T4 भी देखते हैं — रिपोर्ट डॉक्टर को दिखाएं।',
        en: 'Your value is below the range. For the full thyroid picture, doctors often also look at T3 and T4 — do show the report to a doctor.',
      },
      ok: { hi: 'आपकी वैल्यू आम रेंज के अंदर है।', en: 'Your value is inside the usual range.' },
      high: {
        hi: 'आपकी वैल्यू रेंज से ऊपर है। थकान, वज़न बढ़ना या ठंड ज़्यादा लगना हो तो यह रिपोर्ट डॉक्टर को ज़रूर दिखाएं।',
        en: 'Your value is above the range. If you have tiredness, weight gain or feel cold often, do show this report to a doctor.',
      },
    },
    next: {
      hi: 'थायरॉइड की दवा शुरू करना या बदलना सिर्फ़ डॉक्टर का काम है — खुद से खुराक कभी न बदलें। आम तौर पर डॉक्टर कुछ हफ़्तों-महीनों बाद दोबारा जाँच कराते हैं।',
      en: 'Starting or changing thyroid medicine is only a doctor’s job — never change a dose yourself. Doctors usually repeat the test after some weeks or months.',
    },
  },
  {
    key: 'hba1c',
    nameHi: 'HbA1c (3 महीने की शुगर)',
    nameEn: 'HbA1c (3-month sugar)',
    unit: '%',
    rangeText: () => ({
      hi: 'आम तौर पर 5.7% से कम सही, 5.7–6.4% को सीमा पर (borderline) और 6.5% या ऊपर को ऊँचा माना जाता है।',
      en: 'Generally below 5.7% is fine, 5.7–6.4% is borderline, and 6.5% or above is taken as high.',
    }),
    classify: (v) => (v < 5.7 ? 'ok' : v < 6.5 ? 'mid' : 'high'),
    texts: {
      ok: { hi: 'आपकी वैल्यू सही रेंज में है — पिछले 3 महीनों की औसत शुगर ठीक रही है।', en: 'Your value is in the fine range — your average sugar over the last 3 months has been fine.' },
      mid: {
        hi: 'आपकी वैल्यू सीमा पर है — सही रेंज से ऊपर, पर ऊँची वाली सीमा से नीचे। इस पड़ाव पर खाना-पीना और रोज़ की हलचल पर ध्यान देना सबसे ज़्यादा काम करता है। रिपोर्ट डॉक्टर को दिखाएं।',
        en: 'Your value is borderline — above the fine range but below the high mark. At this stage, food habits and daily activity help the most. Do show the report to a doctor.',
      },
      high: {
        hi: 'आपकी वैल्यू ऊँची मानी जाने वाली सीमा पर या उससे ऊपर है। इसे अनदेखा न करें — डॉक्टर से मिलकर आगे का रास्ता तय करें।',
        en: 'Your value is at or above what is taken as high. Do not ignore this — meet a doctor and plan the way ahead together.',
      },
    },
    next: {
      hi: 'यह जाँच 3 महीने की औसत शुगर दिखाती है, इसलिए दोबारा जाँच आम तौर पर 3 महीने बाद होती है। मीठा और मैदा घटाना, खाने के बाद 10–15 मिनट टहलना — ये आम जीवनशैली की बातें हैं जो डॉक्टर भी कहते हैं।',
      en: 'This test shows the average sugar of 3 months, so a repeat test is usually after 3 months. Less sugar and refined flour, and a 10–15 minute walk after meals — these are common lifestyle steps doctors also suggest.',
    },
  },
  {
    key: 'fasting',
    nameHi: 'खाली पेट शुगर (Fasting Sugar)',
    nameEn: 'Fasting Sugar',
    unit: 'mg/dL',
    rangeText: () => ({
      hi: 'खाली पेट (8–10 घंटे बिना खाए) शुगर आम तौर पर 70–99 mg/dL सही, 100–125 सीमा पर और 126 या ऊपर ऊँची मानी जाती है।',
      en: 'Fasting sugar (after 8–10 hours without food) is generally 70–99 mg/dL fine, 100–125 borderline, and 126 or above high.',
    }),
    classify: (v) => (v < 70 ? 'low' : v <= 99 ? 'ok' : v <= 125 ? 'mid' : 'high'),
    texts: {
      low: {
        hi: 'आपकी वैल्यू आम रेंज से नीचे है। हाथ काँपना, पसीना या घबराहट हो तो इसे हल्के में न लें — डॉक्टर से बात करें।',
        en: 'Your value is below the usual range. If you get shaky hands, sweating or uneasiness, do not take it lightly — speak to a doctor.',
      },
      ok: { hi: 'आपकी वैल्यू आम रेंज के अंदर है।', en: 'Your value is inside the usual range.' },
      mid: {
        hi: 'आपकी वैल्यू सीमा पर है — सही रेंज से ऊपर। इस पड़ाव पर जीवनशैली पर ध्यान देना सबसे काम का होता है। रिपोर्ट डॉक्टर को दिखाएं।',
        en: 'Your value is borderline — above the fine range. At this stage, attention to lifestyle helps the most. Do show the report to a doctor.',
      },
      high: {
        hi: 'आपकी वैल्यू ऊँची मानी जाने वाली सीमा से ऊपर है। एक बार की ऊँची वैल्यू पर ही कोई नतीजा न निकालें — डॉक्टर दोबारा जाँच करके ही आगे तय करते हैं।',
        en: 'Your value is above what is taken as high. Do not conclude anything from one high value — a doctor decides only after repeating the test.',
      },
    },
    next: {
      hi: 'जाँच से पहले 8–10 घंटे खाली पेट रहना ज़रूरी होता है, वरना वैल्यू ऊँची आ सकती है। आगे की जाँच और सलाह डॉक्टर ही देंगे।',
      en: 'Staying without food for 8–10 hours before this test is necessary, otherwise the value can come out high. Further tests and advice will come from your doctor.',
    },
  },
]

function LabReaderTool({ lang }: { lang: Lang }) {
  const [testKey, setTestKey] = useState('vitd')
  const [value, setValue] = useState('')
  const [sex, setSex] = useState<Sex>('female')
  const test = LAB_TESTS.find((x) => x.key === testKey) ?? LAB_TESTS[0]
  const v = num(value)
  const has = value.trim() !== '' && v > 0
  const band = has ? test.classify(v, sex) : null
  const meaning = band ? test.texts[band] : undefined
  const range = test.rangeText(sex)
  return (
    <>
      <div className="tool-form">
        <label className="field">
          <span>{T(lang, 'रिपोर्ट की जाँच चुनें', 'Choose the test from your report')}</span>
          <select value={testKey} onChange={(e) => setTestKey(e.target.value)}>
            {LAB_TESTS.map((x) => (
              <option key={x.key} value={x.key}>{T(lang, x.nameHi, x.nameEn)}</option>
            ))}
          </select>
        </label>
        {test.needsSex ? <SexField lang={lang} sex={sex} setSex={setSex} /> : null}
        <NumField
          label={`${T(lang, 'रिपोर्ट की वैल्यू', 'Your report value')} (${test.unit})`}
          value={value}
          onChange={setValue}
          min={0}
          step={0.1}
        />
      </div>
      <p className="note">
        {T(lang, 'आम रेंज: ', 'Usual range: ')}
        {T(lang, range.hi, range.en)}
      </p>
      {has && band && meaning ? (
        <div className="result-card">
          <p>
            <span className="chip">
              {band === 'ok'
                ? T(lang, 'रेंज के अंदर', 'Inside the range')
                : band === 'mid'
                  ? T(lang, 'सीमा पर', 'Borderline')
                  : band === 'low'
                    ? T(lang, 'रेंज से कम', 'Below the range')
                    : T(lang, 'रेंज से ज़्यादा', 'Above the range')}
            </span>
          </p>
          <p>{T(lang, meaning.hi, meaning.en)}</p>
          <p className="note">{T(lang, test.next.hi, test.next.en)}</p>
          <p className="note warn">
            {T(
              lang,
              'हर रिपोर्ट डॉक्टर को ज़रूर दिखाएं — एक अकेली वैल्यू से पूरी सेहत का पता नहीं चलता। लैब की रेंज इस पेज की आम रेंज से थोड़ी अलग हो सकती है; रिपोर्ट पर छपी रेंज को ही पहला आधार मानें।',
              'Do show every report to a doctor — one single value cannot tell the whole state of your health. Your lab’s range may differ slightly from the general range here; treat the range printed on your report as the first reference.',
            )}
          </p>
          <Disclaimer lang={lang} />
        </div>
      ) : (
        <p className="note">{T(lang, 'रिपोर्ट में जो वैल्यू लिखी है, वही ऊपर भरें।', 'Enter the exact value printed in your report above.')}</p>
      )}
    </>
  )
}

// ---------------- Dispatcher ----------------
export function SxToolBody({ slug, lang }: { slug: string; lang: 'hi' | 'en' }) {
  switch (slug) {
    case 'bmi-calculator':
      return <BmiTool lang={lang} />
    case 'bmr-calculator':
      return <BmrTool lang={lang} />
    case 'tdee-calculator':
      return <TdeeTool lang={lang} />
    case 'protein-calculator':
      return <ProteinTool lang={lang} />
    case 'water-calculator':
      return <WaterTool lang={lang} />
    case 'ideal-weight-calculator':
      return <IdealWeightTool lang={lang} />
    case 'indian-food-calories':
      return <FoodCaloriesTool lang={lang} />
    case 'period-calculator':
      return <PeriodTool lang={lang} />
    case 'ovulation-calculator':
      return <OvulationTool lang={lang} />
    case 'pregnancy-due-date':
      return <DueDateTool lang={lang} />
    case 'sleep-calculator':
      return <SleepTool lang={lang} />
    case 'deficiency-risk-checker':
      return <DeficiencyTool lang={lang} />
    case 'lab-report-reader':
      return <LabReaderTool lang={lang} />
    default:
      return (
        <p className="note">
          {T(lang, 'यह टूल जल्द आ रहा है।', 'This tool is coming soon.')}
        </p>
      )
  }
}
