export type Language = 'en' | 'ne';

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];
const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
];

function toNepaliDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => NEPALI_DIGITS[Number(d)] ?? d);
}

export function formatNpr(amount: number, lang: Language = 'en'): string {
  const formatted = new Intl.NumberFormat('en-IN').format(amount);
  if (lang === 'ne') {
    return `रु. ${toNepaliDigits(formatted)}`;
  }
  return `Rs. ${formatted}`;
}

/**
 * Lightweight Gregorian-to-Bikram Sambat display converter for Nepal UI context.
 * Uses approximate solar offset (~56 years, 8 months, 16 days ahead of AD).
 */
export function formatBikramSambat(isoDate: string, lang: Language = 'en'): string {
  const parsed = new Date(`${isoDate}T12:00:00+05:45`);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1; // 1..12
  const day = parsed.getDate();

  // Approximate B.S. year & month mapping for display
  let bsYear = year + 56;
  let bsMonthIdx = (month + 8) % 12; // April (4) -> Baisakh (0)
  let bsDay = day + 16;

  if (month > 4 || (month === 4 && day >= 14)) {
    bsYear = year + 57;
  }
  if (bsDay > 30) {
    bsDay -= 30;
    bsMonthIdx = (bsMonthIdx + 1) % 12;
  }

  const mName = lang === 'ne' ? BS_MONTHS_NE[bsMonthIdx] : BS_MONTHS_EN[bsMonthIdx];
  if (lang === 'ne') {
    return `${toNepaliDigits(bsYear)} ${mName} ${toNepaliDigits(bsDay)} वि.सं.`;
  }
  return `${bsYear} ${mName} ${bsDay} B.S.`;
}

export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  const clean = phoneDigits.replace(/\D/g, '') || '9779800000000';
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function getKathmanduTodayIso(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

export function getKathmanduDateOffsetIso(daysOffset: number): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date(Date.now() + daysOffset * 86_400_000));
}

export function getKathmanduNowTimeLabel(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

export const COPY: Record<
  Language,
  {
    nav: {
      services: string;
      gallery: string;
      team: string;
      offers: string;
      contact: string;
      bookNow: string;
      about: string;
      updates: string;
      blog: string;
      myBookings: string;
      admin: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      subtitle: string;
      primaryCta: string;
      secondaryCta: string;
    };
    sections: {
      featuredServices: string;
      aboutTitle: string;
      whyChooseUs: string;
      packages: string;
      transformations: string;
      experts: string;
      testimonials: string;
      socialFeed: string;
      specialOffers: string;
      visitUs: string;
    };
  }
> = {
  en: {
    nav: {
      services: 'Services',
      gallery: 'Gallery',
      team: 'Team',
      offers: 'Offers',
      contact: 'Contact',
      bookNow: 'Book Appointment',
      about: 'About',
      updates: 'Updates',
      blog: 'Journal',
      myBookings: 'My Bookings',
      admin: 'Admin',
    },
    hero: {
      eyebrow: 'Birgunj, Parsa · Madhesh Province, Nepal',
      title: 'Your Style. Your Identity.',
      subtitle:
        'A serene unisex beauty salon and precision grooming atelier crafting bespoke haircuts, hot-towel beard rituals, party glam, and botanical skincare.',
      primaryCta: 'Book Appointment',
      secondaryCta: 'Explore Services',
    },
    sections: {
      featuredServices: 'Signature Treatments',
      aboutTitle: 'Quiet Craftsmanship in the Heart of Birgunj',
      whyChooseUs: 'The Atelier Standard',
      packages: 'Curated Grooming & Beauty Packages',
      transformations: 'Before & After Transformations',
      experts: 'Meet Our Specialists',
      testimonials: 'Client Impressions',
      socialFeed: 'From Our Atelier Feed',
      specialOffers: 'Seasonal & Festival Privileges',
      visitUs: 'Visit The Salon',
    },
  },
  ne: {
    nav: {
      services: 'सेवाहरू',
      gallery: 'ग्यालेरी',
      team: 'विशेषज्ञ टोली',
      offers: 'अफरहरू',
      contact: 'सम्पर्क',
      bookNow: 'अपोइन्टमेन्ट बुक',
      about: 'हाम्रो बारेमा',
      updates: 'अपडेटहरू',
      blog: 'ब्लग',
      myBookings: 'मेरो बुकिङ',
      admin: 'एडमिन',
    },
    hero: {
      eyebrow: 'वीरगञ्ज, पर्सा · मधेश प्रदेश, नेपाल',
      title: 'तपाईंको शैली। तपाईंको पहिचान।',
      subtitle:
        'वीरगञ्जको प्रिमियम युनिसेक्स ब्युटी सैलुन तथा ग्रुमिङ एटेलियर — आधुनिक हेयर स्टाइलिङ, दाह्री ग्रुमिङ, पार्टी मेकअप र स्किनकेयर सेवाहरू।',
      primaryCta: 'अपोइन्टमेन्ट बुक गर्नुहोस्',
      secondaryCta: 'सेवाहरू हेर्नुहोस्',
    },
    sections: {
      featuredServices: 'विशेष सेवाहरू',
      aboutTitle: 'वीरगञ्जको केन्द्रमा आधुनिक शिल्प र सौन्दर्य',
      whyChooseUs: 'किन हामीलाई रोज्ने',
      packages: 'लोकप्रिय प्याकेजहरू',
      transformations: 'बिफोर र आफ्टर रूपान्तरण',
      experts: 'हाम्रा विशेषज्ञहरू',
      testimonials: 'ग्राहक अनुभवहरू',
      socialFeed: 'इन्स्टाग्राम र फेसबुक अपडेट',
      specialOffers: 'चाडपर्व विशेष अफरहरू',
      visitUs: 'हाम्रो स्थान र समय',
    },
  },
};
