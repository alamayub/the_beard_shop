import type {
  AvailabilityResponse,
  BlogPost,
  BootstrapResponse,
  GalleryItem,
  SalonHoliday,
  SalonOffer,
  SalonReview,
  SalonService,
  SalonSettings,
  ServiceCategory,
  SocialPost,
  StaffMember,
} from '../types/salon';

const IMG_HERO = '/src/assets/images/hero_salon_interior_1795150941397.jpg';
const IMG_BEARD = '/src/assets/images/service_beard_grooming_1795150943254.jpg';
const IMG_HAIR = '/src/assets/images/service_hair_styling_1795150941473.jpg';
const IMG_GLAM = '/src/assets/images/service_bridal_makeup_1795150941593.jpg';
const IMG_SPA = '/src/assets/images/service_spa_facial_1795150942040.jpg';
const IMG_STYLIST = '/src/assets/images/team_master_stylist_1795150942977.jpg';
const IMG_BALAYAGE = '/src/assets/images/editorial_balayage_color_1795153778679.jpg';
const IMG_EXEC_CUT = '/src/assets/images/editorial_exec_haircut_1795153778693.jpg';
const IMG_MANI_PEDI = '/src/assets/images/editorial_mani_pedi_spa_1795153777948.jpg';
const IMG_PORTRAIT_ARTIST = '/src/assets/images/team_portrait_bridal_artist_1795153778681.jpg';
const IMG_PORTRAIT_COLOR = '/src/assets/images/team_portrait_color_director_1795153778841.jpg';

export const FALLBACK_SETTINGS: SalonSettings = {
  id: 1,
  businessName: 'The Beard Shop Beauty Salon',
  tagline: 'Your Style. Your Identity.',
  taglineNe: 'तपाईंको शैली, तपाईंको पहिचान।',
  address: 'Birgunj, Parsa, Madhesh Province, Nepal (Editable Demo Address)',
  city: 'Birgunj',
  province: 'Madhesh Province',
  country: 'Nepal',
  latitude: 27.014045,
  longitude: 84.8482375,
  phone: '+977 980-0000000 (Demo Placeholder)',
  whatsappNumber: '9779800000000',
  email: 'concierge@thebeardshop-demo.np',
  instagramUrl: 'https://www.instagram.com/the_beard_shop1/',
  facebookUrl: 'https://www.facebook.com/',
  googleMapsUrl:
    'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/',
  openingHours: [
    { day: 'Sunday', open: '10:00', close: '20:00', closed: false },
    { day: 'Monday', open: '10:00', close: '20:00', closed: false },
    { day: 'Tuesday', open: '10:00', close: '20:00', closed: false },
    { day: 'Wednesday', open: '10:00', close: '20:00', closed: false },
    { day: 'Thursday', open: '10:00', close: '20:00', closed: false },
    { day: 'Friday', open: '10:00', close: '20:00', closed: false },
    { day: 'Saturday', open: '09:30', close: '20:30', closed: false },
  ],
  cancellationPolicy:
    'Appointments may be rescheduled or cancelled up to 3 hours prior to the reserved slot.',
  currencyCode: 'NPR',
  timezone: 'Asia/Kathmandu',
  showBikramSambat: true,
};

export const FALLBACK_CATEGORIES: ServiceCategory[] = [
  {
    id: 1,
    name: 'Haircut & Styling',
    nameNe: 'कपाल कटाइ र स्टाइलिङ',
    slug: 'haircut-styling',
    description: 'Precision cuts, blowouts, and sculptural styling for men and women.',
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 2,
    name: 'Beard Grooming',
    nameNe: 'दाह्री ग्रुमिङ',
    slug: 'beard-grooming',
    description: 'Hot-towel straight razor shaves, beard sculpting, and botanical oil care.',
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 3,
    name: 'Hair Coloring',
    nameNe: 'हेयर कलरिङ',
    slug: 'hair-coloring',
    description: 'Dimensional balayage, global gloss color, and ammonia-free root touch-ups.',
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: 4,
    name: 'Hair Spa',
    nameNe: 'हेयर स्पा',
    slug: 'hair-spa',
    description: 'Restorative scalp steam therapy and deep hydration masks.',
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: 5,
    name: 'Hair Treatments',
    nameNe: 'हेयर ट्रिटमेन्ट',
    slug: 'hair-treatments',
    description: 'Bond-building repair, anti-hairfall rituals, and detoxifying scalp care.',
    sortOrder: 5,
    isPublished: true,
  },
  {
    id: 6,
    name: 'Facial & Skincare',
    nameNe: 'फेसियल र स्किनकेयर',
    slug: 'facial-skincare',
    description: 'Tailored brightening, hydrating, and calming clinical-botanical facials.',
    sortOrder: 6,
    isPublished: true,
  },
  {
    id: 7,
    name: 'Party Makeup',
    nameNe: 'पार्टी मेकअप',
    slug: 'party-makeup',
    description: 'Luminous editorial and festive makeup for receptions, Teej, and celebrations.',
    sortOrder: 7,
    isPublished: true,
  },
  {
    id: 8,
    name: 'Manicure & Pedicure',
    nameNe: 'मैनिक्योर र पेडिक्योर',
    slug: 'manicure-pedicure',
    description: 'Spa nail grooming, exfoliation, paraffin care, and refined gel polish.',
    sortOrder: 8,
    isPublished: true,
  },
  {
    id: 9,
    name: 'Hair Smoothing',
    nameNe: 'हेयर स्मूथिङ',
    slug: 'hair-smoothing',
    description: 'Silky frizz-control smoothing calibrated for humid Terai climates.',
    sortOrder: 9,
    isPublished: true,
  },
  {
    id: 10,
    name: 'Keratin Treatment',
    nameNe: 'केराटिन ट्रिटमेन्ट',
    slug: 'keratin-treatment',
    description: 'Protein-infused keratin restoration for mirror shine and manageability.',
    sortOrder: 10,
    isPublished: true,
  },
  {
    id: 11,
    name: 'Other Salon Services',
    nameNe: 'अन्य सैलुन सेवाहरू',
    slug: 'other-services',
    description: 'Threading, waxing, pre-wedding grooming packages, and scalp massage.',
    sortOrder: 11,
    isPublished: true,
  },
];

export const FALLBACK_SERVICES: SalonService[] = [
  {
    id: 1,
    categoryId: 2,
    categoryName: 'Beard Grooming',
    categorySlug: 'beard-grooming',
    name: 'Signature Beard Sculpt & Hot Towel Ritual',
    nameNe: 'सिग्नेचर दाह्री स्कल्प्ट र हट टावल रिटुअल',
    slug: 'signature-beard-sculpt-hot-towel',
    description:
      'Precision razor line-up, scissor graduation, eucalyptus steam towel compress, and cold-pressed argan balm finish. (Editable demo sample service)',
    descriptionNe: 'सटीक रेजर लाइन-अप, कैंची फिनिसिङ, तातो तौलिया स्टिम र प्राकृतिक तेल मसाज।',
    priceNpr: 650,
    durationMinutes: 40,
    imageUrl: IMG_BEARD,
    isFeatured: true,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 1,
  },
  {
    id: 2,
    categoryId: 1,
    categoryName: 'Haircut & Styling',
    categorySlug: 'haircut-styling',
    name: 'Executive Taper Cut & Scalp Wash',
    nameNe: 'एक्जिक्युटिभ टेपर कट र स्क्याल्प वाश',
    slug: 'executive-taper-cut-scalp-wash',
    description:
      'Tailored consultation, bespoke fade or classic scissor cut, invigorating mint cleanse, and matte finish styling. (Editable demo sample)',
    descriptionNe: '',
    priceNpr: 800,
    durationMinutes: 45,
    imageUrl: IMG_EXEC_CUT,
    isFeatured: true,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 2,
  },
  {
    id: 3,
    categoryId: 1,
    categoryName: 'Haircut & Styling',
    categorySlug: 'haircut-styling',
    name: 'Editorial Layered Cut & Silk Blowout',
    nameNe: 'एडिटोरियल लेयर्ड कट र सिल्क ब्लोआउट',
    slug: 'editorial-layered-cut-blowout',
    description:
      'Face-framing structural haircut for women with hydrating cleanse, heat-protected volume blowout, and shine serum.',
    descriptionNe: '',
    priceNpr: 1400,
    durationMinutes: 60,
    imageUrl: IMG_HAIR,
    isFeatured: true,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 3,
  },
  {
    id: 4,
    categoryId: 3,
    categoryName: 'Hair Coloring',
    categorySlug: 'hair-coloring',
    name: 'Dimensional Balayage & Gloss Tone',
    nameNe: 'डाइमेन्सनल बालायाज र ग्लस टोन',
    slug: 'dimensional-balayage-gloss-tone',
    description:
      'Hand-painted sunlit caramel or mocha ribbons with bond protector and luminous demi-permanent gloss.',
    descriptionNe: '',
    priceNpr: 7500,
    durationMinutes: 150,
    imageUrl: IMG_BALAYAGE,
    isFeatured: true,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 4,
  },
  {
    id: 6,
    categoryId: 6,
    categoryName: 'Facial & Skincare',
    categorySlug: 'facial-skincare',
    name: 'Botanical Radiance & Hydra-Calm Facial',
    nameNe: 'बोटानिकल रेडियन्स फेसियल',
    slug: 'botanical-radiance-facial',
    description:
      'Deep enzymatic exfoliation, ultrasonic pore purification, lymphatic sculpting massage, and soothing saffron-niacinamide mask.',
    descriptionNe: '',
    priceNpr: 2800,
    durationMinutes: 75,
    imageUrl: IMG_SPA,
    isFeatured: true,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 6,
  },
  {
    id: 7,
    categoryId: 4,
    categoryName: 'Hair Spa',
    categorySlug: 'hair-spa',
    name: 'Aromatherapy Deep Nourish Hair Spa',
    nameNe: 'एरोमाथेरापी डिप नरिस हेयर स्पा',
    slug: 'aromatherapy-deep-nourish-hair-spa',
    description:
      'Warm botanical oil infusion, micro-mist steam hydration, tension-relieving cranial massage, and cuticle seal.',
    descriptionNe: '',
    priceNpr: 1800,
    durationMinutes: 60,
    imageUrl: IMG_SPA,
    isFeatured: false,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 7,
  },
  {
    id: 8,
    categoryId: 10,
    categoryName: 'Keratin Treatment',
    categorySlug: 'keratin-treatment',
    name: 'Silk-Infused Keratin Restoration',
    nameNe: 'सिल्क केराटिन रेस्टोरेसन',
    slug: 'silk-infused-keratin-restoration',
    description:
      'Formaldehyde-free keratin smoothing ritual designed to eliminate humidity frizz and restore glassy luster for up to 16 weeks.',
    descriptionNe: '',
    priceNpr: 6500,
    durationMinutes: 150,
    imageUrl: IMG_HAIR,
    isFeatured: false,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 8,
  },
  {
    id: 9,
    categoryId: 9,
    categoryName: 'Hair Smoothing',
    categorySlug: 'hair-smoothing',
    name: 'Humidity-Shield Hair Smoothing',
    nameNe: 'ह्युमिडिटी-शिल्ड हेयर स्मूथिङ',
    slug: 'humidity-shield-hair-smoothing',
    description:
      'Gentle thermal reconditioning that preserves natural body while delivering sleek, manageable finish.',
    descriptionNe: '',
    priceNpr: 5500,
    durationMinutes: 150,
    imageUrl: IMG_HAIR,
    isFeatured: false,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 9,
  },
  {
    id: 10,
    categoryId: 7,
    categoryName: 'Party Makeup',
    categorySlug: 'party-makeup',
    name: 'Soft-Glam Celebration & Reception Makeup',
    nameNe: 'सफ्ट-ग्ल्याम पार्टी मेकअप',
    slug: 'soft-glam-party-makeup',
    description:
      'Long-wear luminous skin prep, sculpted eye artistry, lash placement, and blow-dry or updo styling.',
    descriptionNe: '',
    priceNpr: 4500,
    durationMinutes: 90,
    imageUrl: IMG_GLAM,
    isFeatured: true,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 10,
  },
  {
    id: 11,
    categoryId: 5,
    categoryName: 'Hair Treatments',
    categorySlug: 'hair-treatments',
    name: 'Bond-Repair Molecular Hair Therapy',
    nameNe: 'बोन्ड-रिपेयर मोलिक्युलर हेयर थेरापी',
    slug: 'bond-repair-molecular-therapy',
    description:
      'Intensive multi-step structural repair for color-treated or heat-stressed hair.',
    descriptionNe: '',
    priceNpr: 2600,
    durationMinutes: 60,
    imageUrl: IMG_SPA,
    isFeatured: false,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 11,
  },
  {
    id: 12,
    categoryId: 8,
    categoryName: 'Manicure & Pedicure',
    categorySlug: 'manicure-pedicure',
    name: 'Luxury Spa Manicure & Pedicure Duo',
    nameNe: 'लक्जरी स्पा मैनिक्योर र पेडिक्योर',
    slug: 'luxury-spa-mani-pedi-duo',
    description:
      'Himalayan salt soak, cuticle refinement, mineral scrub, warm butter massage, and classic or gel polish.',
    descriptionNe: '',
    priceNpr: 2200,
    durationMinutes: 75,
    imageUrl: IMG_MANI_PEDI,
    isFeatured: false,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 12,
  },
  {
    id: 13,
    categoryId: 11,
    categoryName: 'Other Salon Services',
    categorySlug: 'other-services',
    name: 'Groom Complete Wedding Prep Package',
    nameNe: 'बेहुला पूर्ण विवाह तयारी प्याकेज',
    slug: 'groom-wedding-prep-package',
    description:
      'Executive haircut, signature beard sculpt, brightening de-tan facial, hair spa, and hand grooming.',
    descriptionNe: '',
    priceNpr: 4800,
    durationMinutes: 150,
    imageUrl: IMG_EXEC_CUT,
    isFeatured: false,
    isPublished: true,
    isDemoPrice: true,
    sortOrder: 13,
  },
];

function buildDefaultSchedules(staffId: number) {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    staffId,
    dayOfWeek,
    startTime: dayOfWeek === 6 ? '09:30' : '10:00',
    endTime: dayOfWeek === 6 ? '20:30' : '20:00',
    isWorking: true,
  }));
}

export const FALLBACK_TEAM: StaffMember[] = [
  {
    id: 1,
    fullName: 'Aarav Shrestha (Demo Profile)',
    roleTitle: 'Creative Director & Master Barber',
    bio: 'Specializing in precision scissor tailoring, architectural fades, and hot-towel beard rituals. Sample editable staff profile for demonstration.',
    experienceYears: 9,
    specializations: ['Beard Sculpting', 'Executive Haircuts', 'Groom Packages'],
    avatarUrl: IMG_STYLIST,
    isAvailable: true,
    isDemoProfile: true,
    sortOrder: 1,
    schedules: buildDefaultSchedules(1),
    breaks: [
      { id: 1, staffId: 1, breakDate: null, startTime: '13:30', endTime: '14:00', reason: 'Daily Lunch Break' },
    ],
  },
  {
    id: 2,
    fullName: 'Prakriti Jha (Demo Profile)',
    roleTitle: 'Senior Makeup & Styling Artist',
    bio: 'Trained in luminous South Asian celebration artistry, waterproof reception glam, and editorial hair styling for Terai & Nepali events.',
    experienceYears: 7,
    specializations: ['Party Glam', 'Editorial Makeup', 'Hair Styling'],
    avatarUrl: IMG_PORTRAIT_ARTIST,
    isAvailable: true,
    isDemoProfile: true,
    sortOrder: 2,
    schedules: buildDefaultSchedules(2),
    breaks: [
      { id: 2, staffId: 2, breakDate: null, startTime: '13:30', endTime: '14:00', reason: 'Daily Lunch Break' },
    ],
  },
  {
    id: 3,
    fullName: 'Suhana Karki (Demo Profile)',
    roleTitle: 'Lead Colorist & Hair Texture Specialist',
    bio: 'Focused on dimensional balayage, healthy keratin smoothing, and customized botanical hair spa prescriptions.',
    experienceYears: 6,
    specializations: ['Balayage & Color', 'Keratin', 'Hair Smoothing'],
    avatarUrl: IMG_PORTRAIT_COLOR,
    isAvailable: true,
    isDemoProfile: true,
    sortOrder: 3,
    schedules: buildDefaultSchedules(3),
    breaks: [
      { id: 3, staffId: 3, breakDate: null, startTime: '13:30', endTime: '14:00', reason: 'Daily Lunch Break' },
    ],
  },
  {
    id: 4,
    fullName: 'Rohan Sah (Demo Profile)',
    roleTitle: 'Skincare & Wellness Esthetician',
    bio: 'Dedicated to barrier-first clinical facials, scalp detox rituals, and calming spa manicure-pedicure experiences.',
    experienceYears: 5,
    specializations: ['Clinical Facials', 'Hair Spa', 'Manicure & Pedicure'],
    avatarUrl: IMG_MANI_PEDI,
    isAvailable: true,
    isDemoProfile: true,
    sortOrder: 4,
    schedules: buildDefaultSchedules(4),
    breaks: [
      { id: 4, staffId: 4, breakDate: null, startTime: '13:30', endTime: '14:00', reason: 'Daily Lunch Break' },
    ],
  },
];

export const FALLBACK_GALLERY: GalleryItem[] = [
  {
    id: 1,
    title: 'Architectural Salon Sanctuary',
    description: 'Warm travertine stone, brushed champagne brass mirrors, and sunlit stations.',
    category: 'INTERIOR',
    imageUrl: IMG_HERO,
    beforeImageUrl: '',
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'Precision Beard Sculpting',
    description: 'Crisp razor geometry paired with classic scissor-over-comb tapering.',
    category: 'MENS_HAIRSTYLE',
    imageUrl: IMG_BEARD,
    beforeImageUrl: '',
    isFeatured: true,
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'Warm Mocha Balayage Waves',
    description: 'Dimensional hand-painted highlights finished with a silk blowout.',
    category: 'HAIR_COLORING',
    imageUrl: IMG_BALAYAGE,
    beforeImageUrl: '',
    isFeatured: true,
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: 4,
    title: 'Botanical Manicure & Spa Suite',
    description: 'Quiet treatment suite designed for clinical facials, hand rituals, and aromatic hair spa.',
    category: 'INTERIOR',
    imageUrl: IMG_MANI_PEDI,
    beforeImageUrl: '',
    isFeatured: false,
    isPublished: true,
    sortOrder: 4,
  },
  {
    id: 5,
    title: 'Before & After: Textured Fade & Beard Contour',
    description: 'Complete structural reshaping and hot-towel beard line definition.',
    category: 'BEFORE_AFTER',
    imageUrl: IMG_BEARD,
    beforeImageUrl: IMG_EXEC_CUT,
    isFeatured: true,
    isPublished: true,
    sortOrder: 5,
  },
  {
    id: 6,
    title: 'Before & After: Dimensional Balayage & Silk Blowout',
    description: 'Sunlit brunette balayage paired with bond-building gloss and humidity-shield finish.',
    category: 'BEFORE_AFTER',
    imageUrl: IMG_BALAYAGE,
    beforeImageUrl: IMG_HAIR,
    isFeatured: true,
    isPublished: true,
    sortOrder: 6,
  },
  {
    id: 7,
    title: 'Signature Layered Blowout',
    description: 'Effortless volume and frizz-free movement tailored for Birgunj weather.',
    category: 'WOMENS_HAIRSTYLE',
    imageUrl: IMG_HAIR,
    beforeImageUrl: '',
    isFeatured: false,
    isPublished: true,
    sortOrder: 7,
  },
];

export const FALLBACK_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 1,
    platform: 'INSTAGRAM',
    mediaType: 'IMAGE',
    caption:
      'Precision meets calm. Morning sunlight across our grooming stations in Birgunj. Reserve your chair online.',
    imageUrl: IMG_HERO,
    postUrl: 'https://www.instagram.com/the_beard_shop1/',
    isFeatured: true,
    isPublished: true,
    publishedAt: '2026-10-15T06:00:00.000Z',
  },
  {
    id: 2,
    platform: 'INSTAGRAM',
    mediaType: 'REEL',
    caption:
      'Behind the chair: hot-towel straight razor beard sculpting & tapered fade finish. #BirgunjGrooming #TheBeardShop',
    imageUrl: IMG_BEARD,
    postUrl: 'https://www.instagram.com/the_beard_shop1/',
    isFeatured: true,
    isPublished: true,
    publishedAt: '2026-10-12T06:00:00.000Z',
  },
  {
    id: 3,
    platform: 'INSTAGRAM',
    mediaType: 'IMAGE',
    caption:
      'Soft sunlit brunette balayage paired with bond-building gloss treatment. Healthy shine from root to tip.',
    imageUrl: IMG_BALAYAGE,
    postUrl: 'https://www.instagram.com/the_beard_shop1/',
    isFeatured: true,
    isPublished: true,
    publishedAt: '2026-10-10T06:00:00.000Z',
  },
  {
    id: 4,
    platform: 'FACEBOOK',
    mediaType: 'IMAGE',
    caption:
      'Festive and celebration season bookings are now open in Birgunj & Parsa. Reserve your tailored hair, grooming, or glam consultation online.',
    imageUrl: IMG_GLAM,
    postUrl: 'https://www.instagram.com/the_beard_shop1/',
    isFeatured: true,
    isPublished: true,
    publishedAt: '2026-10-08T06:00:00.000Z',
  },
  {
    id: 5,
    platform: 'INSTAGRAM',
    mediaType: 'REEL',
    caption:
      'Unwind with our 60-minute Botanical Hair Spa & Lymphatic Facial ritual. Pure quiet luxury.',
    imageUrl: IMG_SPA,
    postUrl: 'https://www.instagram.com/the_beard_shop1/',
    isFeatured: false,
    isPublished: true,
    publishedAt: '2026-10-05T06:00:00.000Z',
  },
];

export const FALLBACK_BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'How to Maintain a Sharp Beard in Birgunj’s Warm Climate',
    slug: 'maintain-sharp-beard-birgunj-climate',
    excerpt:
      'Humidity and dust can dull beard texture. Discover a simple three-step cleansing, lightweight oil, and line-up cadence.',
    content:
      'Living in the Terai plains means your skin and facial hair navigate warm temperatures and seasonal humidity. Rather than heavy waxes that trap heat, opt for a mild botanical beard wash three times a week, followed by two drops of cold-pressed argan or jojoba oil pressed into damp hair.\n\nSchedule a professional razor line-up and scissor graduation every 14 days to keep cheek and neckline geometry crisp without irritating sensitive skin. Always finish with a cool towel compress after shaving to calm pores.',
    category: 'Beard & Grooming',
    coverImageUrl: IMG_BEARD,
    authorName: 'Aarav Shrestha (Demo Author)',
    readTimeMinutes: 4,
    isFeatured: true,
    isPublished: true,
    publishedAt: '2026-10-14T06:00:00.000Z',
  },
  {
    id: 2,
    title: 'Pre-Event Skincare & Hair Prep Timeline for Celebrations',
    slug: 'pre-event-skincare-hair-prep-timeline-nepal',
    excerpt:
      'A calm month-by-month skincare and hair restoration schedule designed for Nepal celebrations and humid Terai seasons.',
    content:
      'Radiant celebration makeup always begins with calm, hydrated skin. Three months ahead of your milestone event, book a skin barrier consultation and begin monthly brightening facials. Six weeks out is the ideal window for dimensional hair color or keratin smoothing so the cuticle settles into natural shine.\n\nTwo weeks before the celebration, finalize your makeup and hair styling preview in natural daylight. Avoid trying unfamiliar active acids within ten days of the event.',
    category: 'Skincare & Hair Prep',
    coverImageUrl: IMG_GLAM,
    authorName: 'Prakriti Jha (Demo Author)',
    readTimeMinutes: 5,
    isFeatured: true,
    isPublished: true,
    publishedAt: '2026-10-10T06:00:00.000Z',
  },
  {
    id: 3,
    title: 'Keratin vs. Hair Smoothing: Choosing the Right Frizz Solution',
    slug: 'keratin-vs-hair-smoothing-guide',
    excerpt:
      'Understand the difference between protein-infused keratin treatments and thermal smoothing so your hair stays healthy and glossy.',
    content:
      'Clients often ask whether keratin or smoothing is better for monsoon humidity. Keratin treatments replenish lost structural proteins and seal the outer cuticle, reducing frizz by up to 80% while retaining soft natural movement.\n\nHair smoothing gently restructures stubborn waves into a sleeker silhouette. During your consultation, our stylists inspect elasticity and color history before prescribing the safest formula.',
    category: 'Hair Care',
    coverImageUrl: IMG_BALAYAGE,
    authorName: 'Suhana Karki (Demo Author)',
    readTimeMinutes: 4,
    isFeatured: false,
    isPublished: true,
    publishedAt: '2026-10-04T06:00:00.000Z',
  },
];

export const FALLBACK_OFFERS: SalonOffer[] = [
  {
    id: 1,
    title: 'Dashain Elegance Grooming & Glow Ritual',
    titleNe: 'दशैं विशेष ग्रुमिङ र ग्लो अफर',
    festivalTag: 'DASHAIN',
    description:
      'Celebrate Bada Dashain with complimentary Aromatherapy Hair Spa on any Balayage, Keratin, or Groom Package booking. (Editable demo promotion)',
    discountText: '20% Off Packages',
    promoCode: 'DASHAIN20',
    validFrom: '2026-10-01',
    validUntil: '2026-11-30',
    imageUrl: IMG_BALAYAGE,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 2,
    title: 'Tihar & Chhath Festive Radiance Duo',
    titleNe: 'तिहार र छठ विशेष फेस्टिभ अफर',
    festivalTag: 'CHHATH',
    description:
      'Pair our Botanical Radiance Facial with Soft-Glam Party Makeup or Signature Beard Sculpt at a curated festival privilege.',
    discountText: 'Save NPR 1,200',
    promoCode: 'CHHATHGLOW',
    validFrom: '2026-10-20',
    validUntil: '2026-12-15',
    imageUrl: IMG_GLAM,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 3,
    title: 'Teej Celebration Beauty Privilege',
    titleNe: 'तीज विशेष शृङ्गार अफर',
    festivalTag: 'TEEJ',
    description:
      'Festive saree draping, party makeup, and spa manicure curated for Haritalika Teej gatherings.',
    discountText: '15% Festive Privilege',
    promoCode: 'TEEJ15',
    validFrom: '2026-08-15',
    validUntil: '2026-12-31',
    imageUrl: IMG_MANI_PEDI,
    isFeatured: false,
    isPublished: true,
  },
  {
    id: 4,
    title: 'Nepali New Year 2084 Refresh Suite',
    titleNe: 'नयाँ वर्ष २०८४ रिफ्रेस सुइट',
    festivalTag: 'NEPALI_NEW_YEAR',
    description:
      'Welcome Baisakh 1 with an Executive Haircut, Beard Sculpt, and Revitalizing Scalp Detox.',
    discountText: 'Flat 15% Off',
    promoCode: 'NAYABARSHA',
    validFrom: '2027-04-01',
    validUntil: '2027-04-30',
    imageUrl: IMG_BEARD,
    isFeatured: false,
    isPublished: true,
  },
];

export const FALLBACK_REVIEWS: SalonReview[] = [
  {
    id: 1,
    customerName: 'Siddharth Gupta (Demo Review)',
    serviceName: 'Signature Beard Sculpt & Executive Cut',
    rating: 5,
    comment:
      'Calm atmosphere, spotless tools, and the most precise beard line-up I have experienced in Birgunj. Online booking saved me waiting time.',
    isDemoReview: true,
    isPublished: true,
    createdAt: '2026-10-12T08:00:00.000Z',
  },
  {
    id: 2,
    customerName: 'Ananya Rauniyar (Demo Review)',
    serviceName: 'Soft-Glam Celebration & Reception Makeup',
    rating: 5,
    comment:
      'My celebration makeup looked effortless both in natural daylight and evening photographs. The team kept every detail punctual and stress-free.',
    isDemoReview: true,
    isPublished: true,
    createdAt: '2026-10-09T08:00:00.000Z',
  },
  {
    id: 3,
    customerName: 'Dipendra Yadav (Demo Review)',
    serviceName: 'Botanical Radiance Facial & Hair Spa',
    rating: 5,
    comment:
      'Feels like an international hotel spa right here in Madhesh Province. Transparent NPR pricing and genuinely attentive stylists.',
    isDemoReview: true,
    isPublished: true,
    createdAt: '2026-10-05T08:00:00.000Z',
  },
];

export const FALLBACK_HOLIDAYS: SalonHoliday[] = [
  {
    id: 1,
    name: 'Vijaya Dashami (Dashain)',
    date: '2026-10-21',
    bsDate: '2083 Kartik 4',
    description: 'Salon closed for Dashain Tika celebration.',
    isClosed: true,
  },
  {
    id: 2,
    name: 'Bhai Tika (Tihar)',
    date: '2026-11-10',
    bsDate: '2083 Kartik 24',
    description: 'Salon closed for Bhai Tika.',
    isClosed: true,
  },
  {
    id: 3,
    name: 'Chhath Parva (Main Sandhya Arghya)',
    date: '2026-11-15',
    bsDate: '2083 Kartik 29',
    description: 'Salon closed in observance of Chhath Parva in Birgunj.',
    isClosed: true,
  },
  {
    id: 4,
    name: 'Nepali New Year 2084',
    date: '2027-04-14',
    bsDate: '2084 Baisakh 1',
    description: 'Reduced festive holiday schedule.',
    isClosed: false,
  },
];

export const FALLBACK_BOOTSTRAP: BootstrapResponse = {
  settings: FALLBACK_SETTINGS,
  categories: FALLBACK_CATEGORIES,
  services: FALLBACK_SERVICES,
  team: FALLBACK_TEAM,
  gallery: FALLBACK_GALLERY,
  socialPosts: FALLBACK_SOCIAL_POSTS,
  blogPosts: FALLBACK_BLOG_POSTS,
  offers: FALLBACK_OFFERS,
  reviews: FALLBACK_REVIEWS,
  holidays: FALLBACK_HOLIDAYS,
};

export function getFallbackServices(params?: { category?: string; q?: string }): SalonService[] {
  let rows = [...FALLBACK_SERVICES];
  if (params?.category && params.category !== 'all') {
    rows = rows.filter((s) => s.categorySlug === params.category);
  }
  const q = params?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }
  return rows;
}

export function getFallbackServiceBySlug(slug: string): SalonService | null {
  return FALLBACK_SERVICES.find((s) => s.slug === slug) || null;
}

export function getFallbackGallery(category?: string): GalleryItem[] {
  if (!category || category === 'ALL') return [...FALLBACK_GALLERY];
  return FALLBACK_GALLERY.filter((g) => g.category === category);
}

export function getFallbackBlogBySlug(slug: string): BlogPost | null {
  return FALLBACK_BLOG_POSTS.find((b) => b.slug === slug) || null;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMin(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function computeFallbackAvailability(params: {
  date: string;
  serviceIds: number[];
  staffId?: number | null;
}): AvailabilityResponse {
  const now = new Date();
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(now);
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const currentMin =
    Number(timeParts.find((p) => p.type === 'hour')?.value || 0) * 60 +
    Number(timeParts.find((p) => p.type === 'minute')?.value || 0);

  const selectedServices = FALLBACK_SERVICES.filter((s) => params.serviceIds.includes(s.id));
  const totalDurationMinutes =
    selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0) || 45;

  if (params.date < todayIso) {
    return {
      date: params.date,
      isHoliday: false,
      totalDurationMinutes,
      slots: [],
    };
  }

  const holidayMatch = FALLBACK_HOLIDAYS.find((h) => h.date === params.date && h.isClosed);
  if (holidayMatch) {
    return {
      date: params.date,
      isHoliday: true,
      holidayName: holidayMatch.name,
      totalDurationMinutes,
      slots: [],
    };
  }

  const dayOfWeek = new Date(`${params.date}T12:00:00+05:45`).getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayHours = FALLBACK_SETTINGS.openingHours.find((h) => h.day === dayNames[dayOfWeek]);
  if (dayHours?.closed) {
    return {
      date: params.date,
      isHoliday: false,
      totalDurationMinutes,
      slots: [],
    };
  }

  const openMin = toMin(dayHours?.open || '10:00');
  const closeMin = toMin(dayHours?.close || '20:00');
  const candidateStaff = params.staffId
    ? FALLBACK_TEAM.filter((s) => s.id === params.staffId && s.isAvailable)
    : FALLBACK_TEAM.filter((s) => s.isAvailable);

  const isToday = params.date === todayIso;
  const slots: AvailabilityResponse['slots'] = [];

  for (let start = openMin; start + totalDurationMinutes <= closeMin; start += 30) {
    const end = start + totalDurationMinutes;
    if (isToday && start <= currentMin + 15) {
      slots.push({
        time: fromMin(start),
        endTime: fromMin(end),
        available: false,
        availableStaffIds: [],
      });
      continue;
    }

    // Respect daily lunch break (13:30–14:00)
    const overlapsLunch = start < toMin('14:00') && end > toMin('13:30');
    const availableStaffIds = overlapsLunch ? [] : candidateStaff.map((s) => s.id);
    slots.push({
      time: fromMin(start),
      endTime: fromMin(end),
      available: availableStaffIds.length > 0,
      availableStaffIds,
    });
  }

  return {
    date: params.date,
    isHoliday: false,
    totalDurationMinutes,
    slots,
  };
}
