import { count } from 'drizzle-orm';
import { db } from './index.ts';
import {
  blogPosts,
  bookingServices,
  bookings,
  customers,
  galleryItems,
  holidays,
  notifications,
  offers,
  payments,
  reviews,
  salonSettings,
  serviceCategories,
  services,
  socialPosts,
  staff,
  staffBreaks,
  staffSchedules,
} from './schema.ts';

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

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      console.error('Seed check error:', err);
    });
  }
  return seedPromise;
}

async function runSeed() {
  const existingSettings = await db.select({ value: count() }).from(salonSettings);
  if ((existingSettings[0]?.value ?? 0) === 0) {
    await db.insert(salonSettings).values({
      businessName: 'The Beard Shop Beauty Salon',
      tagline: 'Your Style. Your Identity.',
      taglineNe: 'तपाईंको शैली, तपाईंको पहिचान।',
      address: 'Birgunj, Parsa, Madhesh Province, Nepal',
      city: 'Birgunj',
      province: 'Madhesh Province',
      country: 'Nepal',
      latitude: 27.014045,
      longitude: 84.8482375,
      phone: '+977 980-0000000',
      whatsappNumber: '9779800000000',
      email: 'concierge@thebeardshop.com.np',
      instagramUrl: 'https://www.instagram.com/the_beard_shop1/',
      facebookUrl: 'https://www.facebook.com/',
      googleMapsUrl:
        'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/',
      cancellationPolicy:
        'Appointments may be rescheduled or cancelled up to 3 hours prior to the reserved slot.',
      currencyCode: 'NPR',
      timezone: 'Asia/Kathmandu',
      showBikramSambat: true,
    });
  }

  const existingCategories = await db.select({ value: count() }).from(serviceCategories);
  if ((existingCategories[0]?.value ?? 0) > 0) {
    return;
  }

  const insertedCategories = await db
    .insert(serviceCategories)
    .values([
      {
        name: 'Haircut & Styling',
        nameNe: 'कपाल कटाइ र स्टाइलिङ',
        slug: 'haircut-styling',
        description: 'Precision cuts, blowouts, and sculptural styling for men and women.',
        sortOrder: 1,
      },
      {
        name: 'Beard Grooming',
        nameNe: 'दाह्री ग्रुमिङ',
        slug: 'beard-grooming',
        description: 'Hot-towel straight razor shaves, beard sculpting, and botanical oil care.',
        sortOrder: 2,
      },
      {
        name: 'Hair Coloring',
        nameNe: 'हेयर कलरिङ',
        slug: 'hair-coloring',
        description: 'Dimensional balayage, global gloss color, and ammonia-free root touch-ups.',
        sortOrder: 3,
      },
      {
        name: 'Hair Spa',
        nameNe: 'हेयर स्पा',
        slug: 'hair-spa',
        description: 'Restorative scalp steam therapy and deep hydration masks.',
        sortOrder: 4,
      },
      {
        name: 'Hair Treatments',
        nameNe: 'हेयर ट्रिटमेन्ट',
        slug: 'hair-treatments',
        description: 'Bond-building repair, anti-hairfall rituals, and detoxifying scalp care.',
        sortOrder: 5,
      },
      {
        name: 'Facial & Skincare',
        nameNe: 'फेसियल र स्किनकेयर',
        slug: 'facial-skincare',
        description: 'Tailored brightening, hydrating, and calming clinical-botanical facials.',
        sortOrder: 6,
      },
      {
        name: 'Party Makeup',
        nameNe: 'पार्टी मेकअप',
        slug: 'party-makeup',
        description: 'Luminous editorial and festive makeup for receptions, Teej, and celebrations.',
        sortOrder: 7,
      },
      {
        name: 'Manicure & Pedicure',
        nameNe: 'मैनिक्योर र पेडिक्योर',
        slug: 'manicure-pedicure',
        description: 'Spa nail grooming, exfoliation, paraffin care, and refined gel polish.',
        sortOrder: 9,
      },
      {
        name: 'Hair Smoothing',
        nameNe: 'हेयर स्मूथिङ',
        slug: 'hair-smoothing',
        description: 'Silky frizz-control smoothing calibrated for humid Terai climates.',
        sortOrder: 10,
      },
      {
        name: 'Keratin Treatment',
        nameNe: 'केराटिन ट्रिटमेन्ट',
        slug: 'keratin-treatment',
        description: 'Protein-infused keratin restoration for mirror shine and manageability.',
        sortOrder: 11,
      },
      {
        name: 'Other Salon Services',
        nameNe: 'अन्य सैलुन सेवाहरू',
        slug: 'other-services',
        description: 'Threading, waxing, pre-wedding grooming packages, and scalp massage.',
        sortOrder: 12,
      },
    ])
    .returning();

  const catBySlug: Record<string, number> = {};
  for (const c of insertedCategories) {
    catBySlug[c.slug] = c.id;
  }

  const insertedServices = await db
    .insert(services)
    .values([
      {
        categoryId: catBySlug['beard-grooming'],
        name: 'Signature Beard Sculpt & Hot Towel Ritual',
        nameNe: 'सिग्नेचर दाह्री स्कल्प्ट र हट टावल रिटुअल',
        slug: 'signature-beard-sculpt-hot-towel',
        description:
          'Precision razor line-up, scissor graduation, eucalyptus steam towel compress, and cold-pressed argan balm finish.',
        descriptionNe:
          'सटीक रेजर लाइन-अप, कैंची फिनिसिङ, तातो तौलिया स्टिम र प्राकृतिक तेल मसाज।',
        priceNpr: 650,
        durationMinutes: 40,
        imageUrl: IMG_BEARD,
        isFeatured: true,
        isDemoPrice: false,
        sortOrder: 1,
      },
      {
        categoryId: catBySlug['haircut-styling'],
        name: 'Executive Taper Cut & Scalp Wash',
        nameNe: 'एक्जिक्युटिभ टेपर कट र स्क्याल्प वाश',
        slug: 'executive-taper-cut-scalp-wash',
        description:
          'Tailored consultation, bespoke fade or classic scissor cut, invigorating mint cleanse, and matte finish styling.',
        priceNpr: 800,
        durationMinutes: 45,
        imageUrl: IMG_EXEC_CUT,
        isFeatured: true,
        isDemoPrice: false,
        sortOrder: 2,
      },
      {
        categoryId: catBySlug['haircut-styling'],
        name: 'Editorial Layered Cut & Silk Blowout',
        nameNe: 'एडिटोरियल लेयर्ड कट र सिल्क ब्लोआउट',
        slug: 'editorial-layered-cut-blowout',
        description:
          'Face-framing structural haircut for women with hydrating cleanse, heat-protected volume blowout, and shine serum.',
        priceNpr: 1400,
        durationMinutes: 60,
        imageUrl: IMG_HAIR,
        isFeatured: true,
        isDemoPrice: false,
        sortOrder: 3,
      },
      {
        categoryId: catBySlug['hair-coloring'],
        name: 'Dimensional Balayage & Gloss Tone',
        nameNe: 'डाइमेन्सनल बालायाज र ग्लस टोन',
        slug: 'dimensional-balayage-gloss-tone',
        description:
          'Hand-painted sunlit caramel or mocha ribbons with bond protector and luminous demi-permanent gloss.',
        priceNpr: 7500,
        durationMinutes: 150,
        imageUrl: IMG_BALAYAGE,
        isFeatured: true,
        isDemoPrice: false,
        sortOrder: 4,
      },
      {
        categoryId: catBySlug['facial-skincare'],
        name: 'Botanical Radiance & Hydra-Calm Facial',
        nameNe: 'बोटानिकल रेडियन्स फेसियल',
        slug: 'botanical-radiance-facial',
        description:
          'Deep enzymatic exfoliation, ultrasonic pore purification, lymphatic sculpting massage, and soothing saffron-niacinamide mask.',
        priceNpr: 2800,
        durationMinutes: 75,
        imageUrl: IMG_SPA,
        isFeatured: true,
        isDemoPrice: false,
        sortOrder: 6,
      },
      {
        categoryId: catBySlug['hair-spa'],
        name: 'Aromatherapy Deep Nourish Hair Spa',
        nameNe: 'एरोमाथेरापी डिप नरिस हेयर स्पा',
        slug: 'aromatherapy-deep-nourish-hair-spa',
        description:
          'Warm botanical oil infusion, micro-mist steam hydration, tension-relieving cranial massage, and cuticle seal.',
        priceNpr: 1800,
        durationMinutes: 60,
        imageUrl: IMG_SPA,
        isFeatured: false,
        isDemoPrice: false,
        sortOrder: 7,
      },
      {
        categoryId: catBySlug['keratin-treatment'],
        name: 'Silk-Infused Keratin Restoration',
        nameNe: 'सिल्क केराटिन रेस्टोरेसन',
        slug: 'silk-infused-keratin-restoration',
        description:
          'Formaldehyde-free keratin smoothing ritual designed to eliminate humidity frizz and restore glassy luster for up to 16 weeks.',
        priceNpr: 6500,
        durationMinutes: 150,
        imageUrl: IMG_HAIR,
        isFeatured: false,
        isDemoPrice: false,
        sortOrder: 8,
      },
      {
        categoryId: catBySlug['hair-smoothing'],
        name: 'Humidity-Shield Hair Smoothing',
        nameNe: 'ह्युमिडिटी-शिल्ड हेयर स्मूथिङ',
        slug: 'humidity-shield-hair-smoothing',
        description:
          'Gentle thermal reconditioning that preserves natural body while delivering sleek, manageable finish.',
        priceNpr: 5500,
        durationMinutes: 150,
        imageUrl: IMG_HAIR,
        isFeatured: false,
        isDemoPrice: false,
        sortOrder: 9,
      },
      {
        categoryId: catBySlug['party-makeup'],
        name: 'Soft-Glam Celebration & Reception Makeup',
        nameNe: 'सफ्ट-ग्ल्याम पार्टी मेकअप',
        slug: 'soft-glam-party-makeup',
        description:
          'Long-wear luminous skin prep, sculpted eye artistry, lash placement, and blow-dry or updo styling.',
        priceNpr: 4500,
        durationMinutes: 90,
        imageUrl: IMG_GLAM,
        isFeatured: true,
        isDemoPrice: false,
        sortOrder: 10,
      },
      {
        categoryId: catBySlug['hair-treatments'],
        name: 'Bond-Repair Molecular Hair Therapy',
        nameNe: 'बोन्ड-रिपेयर मोलिक्युलर हेयर थेरापी',
        slug: 'bond-repair-molecular-therapy',
        description:
          'Intensive multi-step structural repair for color-treated or heat-stressed hair.',
        priceNpr: 2600,
        durationMinutes: 60,
        imageUrl: IMG_SPA,
        isFeatured: false,
        isDemoPrice: false,
        sortOrder: 11,
      },
      {
        categoryId: catBySlug['manicure-pedicure'],
        name: 'Luxury Spa Manicure & Pedicure Duo',
        nameNe: 'लक्जरी स्पा मैनिक्योर र पेडिक्योर',
        slug: 'luxury-spa-mani-pedi-duo',
        description:
          'Himalayan salt soak, cuticle refinement, mineral scrub, warm butter massage, and classic or gel polish.',
        priceNpr: 2200,
        durationMinutes: 75,
        imageUrl: IMG_MANI_PEDI,
        isFeatured: false,
        isDemoPrice: false,
        sortOrder: 12,
      },
      {
        categoryId: catBySlug['other-services'],
        name: 'Groom Complete Wedding Prep Package',
        nameNe: 'बेहुला पूर्ण विवाह तयारी प्याकेज',
        slug: 'groom-wedding-prep-package',
        description:
          'Executive haircut, signature beard sculpt, brightening de-tan facial, hair spa, and hand grooming.',
        priceNpr: 4800,
        durationMinutes: 150,
        imageUrl: IMG_EXEC_CUT,
        isFeatured: false,
        isDemoPrice: false,
        sortOrder: 13,
      },
    ])
    .returning();

  const insertedStaff = await db
    .insert(staff)
    .values([
      {
        fullName: 'Aarav Shrestha',
        roleTitle: 'Creative Director & Master Barber',
        bio: 'Specializing in precision scissor tailoring, architectural fades, and hot-towel beard rituals.',
        experienceYears: 9,
        specializations: ['Beard Sculpting', 'Executive Haircuts', 'Groom Packages'],
        avatarUrl: IMG_STYLIST,
        isAvailable: true,
        isDemoProfile: false,
        sortOrder: 1,
      },
      {
        fullName: 'Prakriti Jha',
        roleTitle: 'Senior Makeup & Styling Artist',
        bio: 'Trained in luminous South Asian celebration artistry, waterproof reception glam, and editorial hair styling for Terai & Nepali events.',
        experienceYears: 7,
        specializations: ['Party Glam', 'Editorial Makeup', 'Hair Styling'],
        avatarUrl: IMG_PORTRAIT_ARTIST,
        isAvailable: true,
        isDemoProfile: false,
        sortOrder: 2,
      },
      {
        fullName: 'Suhana Karki',
        roleTitle: 'Lead Colorist & Hair Texture Specialist',
        bio: 'Focused on dimensional balayage, healthy keratin smoothing, and customized botanical hair spa prescriptions.',
        experienceYears: 6,
        specializations: ['Balayage & Color', 'Keratin', 'Hair Smoothing'],
        avatarUrl: IMG_PORTRAIT_COLOR,
        isAvailable: true,
        isDemoProfile: false,
        sortOrder: 3,
      },
      {
        fullName: 'Rohan Sah',
        roleTitle: 'Skincare & Wellness Esthetician',
        bio: 'Dedicated to barrier-first clinical facials, scalp detox rituals, and calming spa manicure-pedicure experiences.',
        experienceYears: 5,
        specializations: ['Clinical Facials', 'Hair Spa', 'Manicure & Pedicure'],
        avatarUrl: IMG_MANI_PEDI,
        isAvailable: true,
        isDemoProfile: false,
        sortOrder: 4,
      },
    ])
    .returning();

  // Seed weekly schedules & lunch breaks for each staff member
  for (const member of insertedStaff) {
    const schedules = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      staffId: member.id,
      dayOfWeek,
      startTime: dayOfWeek === 6 ? '09:30' : '10:00',
      endTime: dayOfWeek === 6 ? '20:30' : '20:00',
      isWorking: true,
    }));
    await db.insert(staffSchedules).values(schedules);
    await db.insert(staffBreaks).values({
      staffId: member.id,
      breakDate: null,
      startTime: '13:30',
      endTime: '14:00',
      reason: 'Daily Lunch Break',
    });
  }

  await db.insert(galleryItems).values([
    {
      title: 'Architectural Salon Sanctuary',
      description: 'Warm travertine stone, brushed champagne brass mirrors, and sunlit stations.',
      category: 'INTERIOR',
      imageUrl: IMG_HERO,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      title: 'Precision Beard Sculpting',
      description: 'Crisp razor geometry paired with classic scissor-over-comb tapering.',
      category: 'MENS_HAIRSTYLE',
      imageUrl: IMG_BEARD,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      title: 'Warm Mocha Balayage Waves',
      description: 'Dimensional hand-painted highlights finished with a silk blowout.',
      category: 'HAIR_COLORING',
      imageUrl: IMG_BALAYAGE,
      isFeatured: true,
      sortOrder: 3,
    },
    {
      title: 'Botanical Manicure & Spa Suite',
      description: 'Quiet treatment suite designed for clinical facials, hand rituals, and aromatic hair spa.',
      category: 'INTERIOR',
      imageUrl: IMG_MANI_PEDI,
      isFeatured: false,
      sortOrder: 4,
    },
    {
      title: 'Before & After: Textured Fade & Beard Contour',
      description: 'Complete structural reshaping and hot-towel beard line definition.',
      category: 'BEFORE_AFTER',
      imageUrl: IMG_BEARD,
      beforeImageUrl: IMG_EXEC_CUT,
      isFeatured: true,
      sortOrder: 5,
    },
    {
      title: 'Before & After: Dimensional Balayage & Silk Blowout',
      description: 'Sunlit brunette balayage paired with bond-building gloss and humidity-shield finish.',
      category: 'BEFORE_AFTER',
      imageUrl: IMG_BALAYAGE,
      beforeImageUrl: IMG_HAIR,
      isFeatured: true,
      sortOrder: 6,
    },
    {
      title: 'Signature Layered Blowout',
      description: 'Effortless volume and frizz-free movement tailored for Birgunj weather.',
      category: 'WOMENS_HAIRSTYLE',
      imageUrl: IMG_HAIR,
      isFeatured: false,
      sortOrder: 8,
    },
  ]);

  await db.insert(socialPosts).values([
    {
      platform: 'INSTAGRAM',
      mediaType: 'IMAGE',
      caption:
        'Precision meets calm. Morning sunlight across our grooming stations in Birgunj. Reserve your chair online.',
      imageUrl: IMG_HERO,
      postUrl: 'https://www.instagram.com/the_beard_shop1/',
      isFeatured: true,
    },
    {
      platform: 'INSTAGRAM',
      mediaType: 'REEL',
      caption:
        'Behind the chair: hot-towel straight razor beard sculpting & tapered fade finish. #BirgunjGrooming #TheBeardShop',
      imageUrl: IMG_BEARD,
      postUrl: 'https://www.instagram.com/the_beard_shop1/',
      isFeatured: true,
    },
    {
      platform: 'INSTAGRAM',
      mediaType: 'IMAGE',
      caption:
        'Soft sunlit brunette balayage paired with bond-building gloss treatment. Healthy shine from root to tip.',
      imageUrl: IMG_HAIR,
      postUrl: 'https://www.instagram.com/the_beard_shop1/',
      isFeatured: true,
    },
    {
      platform: 'FACEBOOK',
      mediaType: 'IMAGE',
      caption:
        'Festive and celebration season bookings are now open in Birgunj & Parsa. Reserve your tailored hair, grooming, or glam consultation online.',
      imageUrl: IMG_GLAM,
      postUrl: 'https://www.instagram.com/the_beard_shop1/',
      isFeatured: true,
    },
    {
      platform: 'INSTAGRAM',
      mediaType: 'REEL',
      caption:
        'Unwind with our 60-minute Botanical Hair Spa & Lymphatic Facial ritual. Pure quiet luxury.',
      imageUrl: IMG_SPA,
      postUrl: 'https://www.instagram.com/the_beard_shop1/',
      isFeatured: false,
    },
  ]);

  await db.insert(blogPosts).values([
    {
      title: 'How to Maintain a Sharp Beard in Birgunj’s Warm Climate',
      slug: 'maintain-sharp-beard-birgunj-climate',
      excerpt:
        'Humidity and dust can dull beard texture. Discover a simple three-step cleansing, lightweight oil, and line-up cadence.',
      content:
        'Living in the Terai plains means your skin and facial hair navigate warm temperatures and seasonal humidity. Rather than heavy waxes that trap heat, opt for a mild botanical beard wash three times a week, followed by two drops of cold-pressed argan or jojoba oil pressed into damp hair.\n\nSchedule a professional razor line-up and scissor graduation every 14 days to keep cheek and neckline geometry crisp without irritating sensitive skin. Always finish with a cool towel compress after shaving to calm pores.',
      category: 'Beard & Grooming',
      coverImageUrl: IMG_BEARD,
      authorName: 'Aarav Shrestha',
      readTimeMinutes: 4,
      isFeatured: true,
    },
    {
      title: 'Pre-Event Skincare & Hair Prep Timeline for Celebrations',
      slug: 'pre-event-skincare-hair-prep-timeline-nepal',
      excerpt:
        'A calm month-by-month skincare and hair restoration schedule designed for Nepal celebrations and humid Terai seasons.',
      content:
        'Radiant celebration makeup always begins with calm, hydrated skin. Three months ahead of your milestone event, book a skin barrier consultation and begin monthly brightening facials. Six weeks out is the ideal window for dimensional hair color or keratin smoothing so the cuticle settles into natural shine.\n\nTwo weeks before the celebration, finalize your makeup and hair styling preview in natural daylight. Avoid trying unfamiliar active acids within ten days of the event.',
      category: 'Skincare & Hair Prep',
      coverImageUrl: IMG_GLAM,
      authorName: 'Prakriti Jha',
      readTimeMinutes: 5,
      isFeatured: true,
    },
    {
      title: 'Keratin vs. Hair Smoothing: Choosing the Right Frizz Solution',
      slug: 'keratin-vs-hair-smoothing-guide',
      excerpt:
        'Understand the difference between protein-infused keratin treatments and thermal smoothing so your hair stays healthy and glossy.',
      content:
        'Clients often ask whether keratin or smoothing is better for monsoon humidity. Keratin treatments replenish lost structural proteins and seal the outer cuticle, reducing frizz by up to 80% while retaining soft natural movement.\n\nHair smoothing gently restructures stubborn waves into a sleeker silhouette. During your consultation, our stylists inspect elasticity and color history before prescribing the safest formula.',
      category: 'Hair Care',
      coverImageUrl: IMG_HAIR,
      authorName: 'Suhana Karki',
      readTimeMinutes: 4,
      isFeatured: false,
    },
  ]);

  await db.insert(offers).values([
    {
      title: 'Dashain Elegance Grooming & Glow Ritual',
      titleNe: 'दशैं विशेष ग्रुमिङ र ग्लो अफर',
      festivalTag: 'DASHAIN',
      description:
        'Celebrate Bada Dashain with complimentary Aromatherapy Hair Spa on any Balayage, Keratin, or Groom Package booking.',
      discountText: '20% Off Packages',
      promoCode: 'DASHAIN20',
      validFrom: '2026-10-01',
      validUntil: '2026-11-30',
      imageUrl: IMG_HAIR,
      isFeatured: true,
    },
    {
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
    },
    {
      title: 'Teej Celebration Beauty Privilege',
      titleNe: 'तीज विशेष शृङ्गार अफर',
      festivalTag: 'TEEJ',
      description:
        'Festive saree draping, party makeup, and spa manicure curated for Haritalika Teej gatherings.',
      discountText: '15% Festive Privilege',
      promoCode: 'TEEJ15',
      validFrom: '2026-08-15',
      validUntil: '2026-12-31',
      imageUrl: IMG_SPA,
      isFeatured: false,
    },
    {
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
    },
  ]);

  await db.insert(reviews).values([
    {
      customerName: 'Siddharth Gupta',
      serviceName: 'Signature Beard Sculpt & Executive Cut',
      rating: 5,
      comment:
        'Calm atmosphere, spotless tools, and the most precise beard line-up I have experienced in Birgunj. Online booking saved me waiting time.',
      isDemoReview: false,
    },
    {
      customerName: 'Ananya Rauniyar',
      serviceName: 'Soft-Glam Celebration & Reception Makeup',
      rating: 5,
      comment:
        'My celebration makeup looked effortless both in natural daylight and evening photographs. The team kept every detail punctual and stress-free.',
      isDemoReview: false,
    },
    {
      customerName: 'Dipendra Yadav',
      serviceName: 'Botanical Radiance Facial & Hair Spa',
      rating: 5,
      comment:
        'Feels like an international hotel spa right here in Madhesh Province. Transparent NPR pricing and genuinely attentive stylists.',
      isDemoReview: false,
    },
  ]);

  await db.insert(holidays).values([
    {
      name: 'Vijaya Dashami (Dashain)',
      date: '2026-10-21',
      bsDate: '2083 Kartik 4',
      description: 'Salon closed for Dashain Tika celebration.',
      isClosed: true,
    },
    {
      name: 'Bhai Tika (Tihar)',
      date: '2026-11-10',
      bsDate: '2083 Kartik 24',
      description: 'Salon closed for Bhai Tika.',
      isClosed: true,
    },
    {
      name: 'Chhath Parva (Main Sandhya Arghya)',
      date: '2026-11-15',
      bsDate: '2083 Kartik 29',
      description: 'Salon closed in observance of Chhath Parva in Birgunj.',
      isClosed: true,
    },
    {
      name: 'Nepali New Year 2084',
      date: '2027-04-14',
      bsDate: '2084 Baisakh 1',
      description: 'Reduced festive holiday schedule.',
      isClosed: false,
    },
  ]);

  // Seed initial sample customers & bookings so dashboard analytics are populated immediately
  const sampleCustomers = await db
    .insert(customers)
    .values([
      {
        fullName: 'Ramesh Agarwal',
        phone: '+9779801122334',
        email: 'ramesh@example.np',
        totalVisits: 4,
        totalSpentNpr: 6400,
      },
      {
        fullName: 'Nisha Tiwari',
        phone: '+9779845566778',
        email: 'nisha@example.np',
        totalVisits: 3,
        totalSpentNpr: 24500,
      },
      {
        fullName: 'Bikash Chaurasia',
        phone: '+9779812233445',
        email: 'bikash@example.np',
        totalVisits: 2,
        totalSpentNpr: 3600,
      },
    ])
    .returning();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

  const sampleBookings = await db
    .insert(bookings)
    .values([
      {
        bookingRef: 'TBS-2026-1001',
        customerId: sampleCustomers[0].id,
        customerName: sampleCustomers[0].fullName,
        customerPhone: sampleCustomers[0].phone,
        customerEmail: sampleCustomers[0].email,
        staffId: insertedStaff[0].id,
        appointmentDate: today,
        startTime: '11:00',
        endTime: '12:25',
        totalDurationMinutes: 85,
        totalPriceNpr: 1450,
        status: 'APPROVED',
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        notes: 'Prefers matte clay finish.',
      },
      {
        bookingRef: 'TBS-2026-1002',
        customerId: sampleCustomers[1].id,
        customerName: sampleCustomers[1].fullName,
        customerPhone: sampleCustomers[1].phone,
        customerEmail: sampleCustomers[1].email,
        staffId: insertedStaff[1].id,
        appointmentDate: today,
        startTime: '14:30',
        endTime: '16:00',
        totalDurationMinutes: 90,
        totalPriceNpr: 4500,
        status: 'PENDING',
        paymentMethod: 'ESEWA',
        paymentStatus: 'PENDING_VERIFICATION',
        notes: 'Celebration glam consultation and appointment.',
      },
      {
        bookingRef: 'TBS-2026-1003',
        customerId: sampleCustomers[2].id,
        customerName: sampleCustomers[2].fullName,
        customerPhone: sampleCustomers[2].phone,
        customerEmail: sampleCustomers[2].email,
        staffId: insertedStaff[3].id,
        appointmentDate: yesterday,
        startTime: '15:00',
        endTime: '16:15',
        totalDurationMinutes: 75,
        totalPriceNpr: 2800,
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        notes: 'Completed facial session.',
      },
      {
        bookingRef: 'TBS-2026-1004',
        customerId: sampleCustomers[1].id,
        customerName: sampleCustomers[1].fullName,
        customerPhone: sampleCustomers[1].phone,
        customerEmail: sampleCustomers[1].email,
        staffId: insertedStaff[2].id,
        appointmentDate: twoDaysAgo,
        startTime: '11:30',
        endTime: '14:00',
        totalDurationMinutes: 150,
        totalPriceNpr: 7500,
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        notes: 'Completed balayage session.',
      },
    ])
    .returning();

  await db.insert(bookingServices).values([
    {
      bookingId: sampleBookings[0].id,
      serviceId: insertedServices[0].id,
      serviceName: insertedServices[0].name,
      priceNpr: insertedServices[0].priceNpr,
      durationMinutes: insertedServices[0].durationMinutes,
    },
    {
      bookingId: sampleBookings[0].id,
      serviceId: insertedServices[1].id,
      serviceName: insertedServices[1].name,
      priceNpr: insertedServices[1].priceNpr,
      durationMinutes: insertedServices[1].durationMinutes,
    },
    {
      bookingId: sampleBookings[1].id,
      serviceId: insertedServices[8].id,
      serviceName: insertedServices[8].name,
      priceNpr: insertedServices[8].priceNpr,
      durationMinutes: insertedServices[8].durationMinutes,
    },
    {
      bookingId: sampleBookings[2].id,
      serviceId: insertedServices[4].id,
      serviceName: insertedServices[4].name,
      priceNpr: insertedServices[4].priceNpr,
      durationMinutes: insertedServices[4].durationMinutes,
    },
    {
      bookingId: sampleBookings[3].id,
      serviceId: insertedServices[3].id,
      serviceName: insertedServices[3].name,
      priceNpr: insertedServices[3].priceNpr,
      durationMinutes: insertedServices[3].durationMinutes,
    },
  ]);

  await db.insert(payments).values([
    {
      bookingId: sampleBookings[2].id,
      provider: 'CASH',
      amountNpr: 2800,
      status: 'VERIFIED',
      transactionRef: 'CASH-TBS-1003',
      verifiedAt: new Date(),
    },
    {
      bookingId: sampleBookings[3].id,
      provider: 'CASH',
      amountNpr: 7500,
      status: 'VERIFIED',
      transactionRef: 'CASH-TBS-1004',
      verifiedAt: new Date(),
    },
    {
      bookingId: sampleBookings[1].id,
      provider: 'ESEWA',
      amountNpr: 4500,
      status: 'PENDING_VERIFICATION',
      transactionRef: 'ESEWA-SANDBOX-1002',
    },
  ]);

  await db.insert(notifications).values([
    {
      type: 'BOOKING_CREATED',
      channel: 'IN_APP',
      recipient: 'Reception Desk',
      title: 'New Glam Makeup Request (TBS-2026-1002)',
      message: 'Nisha Tiwari requested Soft-Glam Celebration & Reception Makeup via eSewa checkout.',
      isRead: false,
      status: 'SENT',
    },
    {
      type: 'BOOKING_STATUS',
      channel: 'WHATSAPP',
      recipient: '+9779801122334',
      title: 'Appointment Approved (TBS-2026-1001)',
      message: 'WhatsApp confirmation ready for Ramesh Agarwal at 11:00 NPT.',
      isRead: true,
      status: 'QUEUED',
    },
  ]);
}
