import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useGetSettingsQuery } from '../../api/salonApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button, PageIntro } from '../../components/ui/Primitives';
import { EditorialReveal, LUXURY_EASE } from '../../components/ui/MotionPrimitives';

const FAQ_ITEMS = [
  {
    q: 'Are the listed prices in Nepalese Rupees (NPR) final?',
    a: 'Starting prices are listed transparently in Nepalese Rupees (NPR). Final service totals may vary for extra-long hair density or custom add-ons and are always confirmed during your pre-service consultation.',
  },
  {
    q: 'Which payment methods do you support in Nepal?',
    a: 'We accept Cash at Salon in NPR and provide integration-ready architecture for eSewa, Khalti, and Fonepay QR verification.',
  },
  {
    q: 'What is your cancellation and rescheduling policy?',
    a: 'Appointments may be cancelled or rescheduled free of charge up to 3 hours prior to your reserved slot (Asia/Kathmandu time) via the My Bookings portal or WhatsApp.',
  },
  {
    q: 'Are you open during Dashain, Tihar, and Chhath?',
    a: 'We celebrate major Nepal & Madhesh Province festivals with adjusted schedules. Closed holiday dates are automatically blocked in our live online booking calendar.',
  },
  {
    q: 'Do you welcome both men and women?',
    a: 'Yes. We are a full-service unisex salon and grooming atelier offering precision barbering, beard rituals, women’s hair styling, balayage, keratin, facials, and party makeup.',
  },
];

export function FaqPage() {
  useDocumentMeta(
    'Frequently Asked Questions',
    'Answers about NPR pricing, Nepal digital payments, cancellation policy, and online booking.'
  );
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Client Guide"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know before visiting our Birgunj studio — from NPR pricing and Nepal payments to festival hours."
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <EditorialReveal>
          <div className="divide-y divide-[#E6DADC] border-y border-[#E6DADC]">
            {FAQ_ITEMS.map((item, idx) => {
              const open = openIndex === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : idx)}
                    className="flex min-h-[64px] w-full items-center justify-between gap-5 py-5 text-left cursor-pointer group"
                  >
                    <span className="font-serif text-xl sm:text-[1.4rem] font-medium text-[#2A0810] transition-colors group-hover:text-[#8B1A2D]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#8B1A2D] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: LUXURY_EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-8 text-[15px] leading-[1.8] text-[#5C5852]">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </EditorialReveal>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[4px] border border-[#E6DADC] bg-white p-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-serif text-2xl text-[#2A0810]">Still have a question?</p>
            <p className="mt-1 text-sm text-[#5C5852]">
              Speak directly with our Birgunj concierge desk or send a message online.
            </p>
          </div>
          <Link to="/contact">
            <Button variant="outline">Contact Concierge</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  useDocumentMeta(
    'Privacy Policy',
    'Privacy policy and data handling commitments for The Beard Shop Beauty Salon.'
  );
  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Legal · Data Protection"
        title="Privacy Policy"
        subtitle="How The Beard Shop Beauty Salon handles reservation details, contact information, and embedded map services."
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-[65ch] space-y-8 text-[15px] leading-[1.85] text-[#4A4640]">
          <section className="space-y-2.5">
            <h2 className="font-serif text-2xl font-medium text-[#2A0810]">
              01. Information We Collect
            </h2>
            <p>
              We collect only the information necessary to schedule and manage your salon
              appointments — including your full name, Nepal mobile phone number (+977), optional
              email address, and service preferences.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-[#E6DADC] pt-7">
            <h2 className="font-serif text-2xl font-medium text-[#2A0810]">
              02. Storage & Confidentiality
            </h2>
            <p>
              Your contact information is never sold to third parties. Appointment records are
              stored securely in PostgreSQL with role-based staff access controls and audit logging.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-[#E6DADC] pt-7">
            <h2 className="font-serif text-2xl font-medium text-[#2A0810]">
              03. Maps & Location Services
            </h2>
            <p>
              This website integrates Google Maps Platform features to help you locate our Birgunj
              studio. By using embedded map features, you agree to the{' '}
              <a
                href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B1A2D] underline underline-offset-4 hover:text-[#2A0810]"
              >
                Google Maps/Google Earth Additional Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B1A2D] underline underline-offset-4 hover:text-[#2A0810]"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  useDocumentMeta(
    'Terms & Cancellation Policy',
    'Booking terms, cancellation policy, and payment terms in NPR.'
  );
  const { data: settings } = useGetSettingsQuery();
  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Legal · Studio Etiquette"
        title="Terms & Cancellation Policy"
        subtitle="Clear guidelines designed to respect every client’s chair time and ensure unhurried service."
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-[65ch] space-y-8 text-[15px] leading-[1.85] text-[#4A4640]">
          <section className="space-y-2.5">
            <h2 className="font-serif text-2xl font-medium text-[#2A0810]">
              01. Cancellation & Rescheduling
            </h2>
            <p>
              {settings?.cancellationPolicy ||
                'Appointments may be rescheduled or cancelled free of charge at least 3 hours prior to the reserved time.'}
            </p>
          </section>

          <section className="space-y-2.5 border-t border-[#E6DADC] pt-7">
            <h2 className="font-serif text-2xl font-medium text-[#2A0810]">
              02. Pricing & Currency (NPR)
            </h2>
            <p>
              All treatments are priced in Nepalese Rupees (NPR). Online bookings lock your
              reserved chair time; payment may be completed in cash at the salon or via verified
              Nepal digital payment gateways once enabled.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-[#E6DADC] pt-7">
            <h2 className="font-serif text-2xl font-medium text-[#2A0810]">
              03. Punctuality (Asia/Kathmandu)
            </h2>
            <p>
              Please arrive 10 minutes before your scheduled slot in Nepal Time (Asia/Kathmandu).
              Late arrivals exceeding 15 minutes may be rescheduled to protect subsequent clients.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  useDocumentMeta('Page Not Found', 'The requested page could not be found.');
  return (
    <div className="bg-[#FAF8F4] px-4 py-28 sm:py-36 text-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: LUXURY_EASE }}
        className="mx-auto max-w-xl"
      >
        <div className="flex items-center justify-center gap-3 text-xs font-mono tracking-[0.2em] uppercase text-[#8B1A2D]">
          <span aria-hidden="true" className="h-px w-6 bg-[#9E1F32]" />
          <span>404</span>
          <span aria-hidden="true" className="h-px w-6 bg-[#9E1F32]" />
        </div>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-medium text-[#2A0810]">
          Page Not Found
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#5C5852]">
          The page you are looking for may have moved or does not exist. Let us guide you back to
          the studio.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3.5">
          <Link to="/">
            <Button variant="primary" size="md">
              Return Home
            </Button>
          </Link>
          <Link to="/booking">
            <Button variant="outline" size="md">
              Book Appointment
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
