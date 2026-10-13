// SwasthX tool catalog — metadata for the 13 tools in src/tools.tsx.
// Slugs are the routing contract; names/tags are bilingual (Hindi-first).
export interface SxTool {
  slug: string
  nameHi: string
  nameEn: string
  tagHi: string
  tagEn: string
  cluster: 'gut' | 'hair' | 'deficiency' | 'general'
}

export const SX_TOOLS: SxTool[] = [
  {
    slug: 'bmi-calculator',
    nameHi: 'BMI कैलकुलेटर',
    nameEn: 'BMI Calculator',
    tagHi: 'आपका वज़न कद के हिसाब से ठीक है या नहीं — भारतीय मानक से जानें',
    tagEn: 'Check if your weight fits your height, by Indian standards',
    cluster: 'general',
  },
  {
    slug: 'bmr-calculator',
    nameHi: 'BMR कैलकुलेटर',
    nameEn: 'BMR Calculator',
    tagHi: 'आराम की हालत में भी शरीर कितनी कैलोरी जलाता है',
    tagEn: 'Calories your body burns even at complete rest',
    cluster: 'general',
  },
  {
    slug: 'tdee-calculator',
    nameHi: 'TDEE कैलकुलेटर',
    nameEn: 'TDEE Calculator',
    tagHi: 'पूरे दिन की असली कैलोरी ज़रूरत, आपके काम-काज के हिसाब से',
    tagEn: 'Your real daily calorie need, based on your activity level',
    cluster: 'general',
  },
  {
    slug: 'protein-calculator',
    nameHi: 'प्रोटीन कैलकुलेटर',
    nameEn: 'Protein Calculator',
    tagHi: 'रोज़ कितना प्रोटीन चाहिए — वज़न और लक्ष्य के हिसाब से',
    tagEn: 'How much protein you need daily, by weight and goal',
    cluster: 'general',
  },
  {
    slug: 'water-calculator',
    nameHi: 'पानी कैलकुलेटर',
    nameEn: 'Water Calculator',
    tagHi: 'रोज़ कितना पानी पीना चाहिए, आपके वज़न के हिसाब से',
    tagEn: 'How much water you should drink daily, by your weight',
    cluster: 'general',
  },
  {
    slug: 'ideal-weight-calculator',
    nameHi: 'सही वज़न कैलकुलेटर',
    nameEn: 'Ideal Weight Calculator',
    tagHi: 'आपके कद के लिए सही वज़न कितना होना चाहिए',
    tagEn: 'The healthy weight range for your height',
    cluster: 'general',
  },
  {
    slug: 'indian-food-calories',
    nameHi: 'भारतीय खाने की कैलोरी',
    nameEn: 'Indian Food Calories',
    tagHi: 'रोटी, दाल, समोसा — रोज़ के खाने में कितनी कैलोरी है, खोजकर देखें',
    tagEn: 'Calories in everyday Indian food — roti, dal, samosa and more',
    cluster: 'general',
  },
  {
    slug: 'period-calculator',
    nameHi: 'माहवारी कैलकुलेटर',
    nameEn: 'Period Calculator',
    tagHi: 'अगली माहवारी की तारीख़ का अंदाज़ा लगाएं',
    tagEn: 'Estimate the date of your next period',
    cluster: 'general',
  },
  {
    slug: 'ovulation-calculator',
    nameHi: 'ओव्यूलेशन कैलकुलेटर',
    nameEn: 'Ovulation Calculator',
    tagHi: 'गर्भ ठहरने के लिए सबसे अच्छे दिन कौन से हैं, अंदाज़ा लगाएं',
    tagEn: 'Estimate your ovulation day and most fertile days',
    cluster: 'general',
  },
  {
    slug: 'pregnancy-due-date',
    nameHi: 'डिलीवरी तारीख़ कैलकुलेटर',
    nameEn: 'Pregnancy Due Date Calculator',
    tagHi: 'डिलीवरी की संभावित तारीख़ और गर्भ के हफ़्तों की गिनती',
    tagEn: 'Expected delivery date and how many weeks pregnant you are',
    cluster: 'general',
  },
  {
    slug: 'sleep-calculator',
    nameHi: 'नींद कैलकुलेटर',
    nameEn: 'Sleep Calculator',
    tagHi: '90 मिनट की नींद की साइकल से सही सोने-जागने का समय निकालें',
    tagEn: 'Find the right bedtime using 90-minute sleep cycles',
    cluster: 'general',
  },
  {
    slug: 'deficiency-risk-checker',
    nameHi: 'कमी की संभावना जांचें',
    nameEn: 'Deficiency Risk Checker',
    tagHi: 'लक्षणों से Vitamin D, B12 और आयरन की कमी की संभावना देखें — पहचान सिर्फ़ जाँच से होती है',
    tagEn: 'Symptom-based risk check for Vitamin D, B12 and iron — only a blood test confirms',
    cluster: 'deficiency',
  },
  {
    slug: 'lab-report-reader',
    nameHi: 'लैब रिपोर्ट समझें',
    nameEn: 'Lab Report Reader',
    tagHi: 'रिपोर्ट की वैल्यू रेंज के अंदर है या बाहर — सीधे शब्दों में समझें',
    tagEn: 'What your lab value means, in plain words — inside or outside the range',
    cluster: 'deficiency',
  },
]
