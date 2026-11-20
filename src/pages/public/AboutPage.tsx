import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button, PageIntro, SafeImage, SectionHeader } from '../../components/ui/Primitives';
import { EditorialReveal, StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';

const IMG_HERO = '/src/assets/images/hero_salon_interior_1795150941397.jpg';
const IMG_SPA = '/src/assets/images/service_spa_facial_1795150942040.jpg';
const IMG_EXEC = '/src/assets/images/editorial_exec_haircut_1795153778693.jpg';
const IMG_MANI = '/src/assets/images/editorial_mani_pedi_spa_1795153777948.jpg';

const PILLARS = [
  {
    num: '01',
    title: 'Precision & Restraint',
    text: 'We believe true luxury never shouts. Every haircut, fade, balayage blend, and glam finish is tailored to your bone structure, hair texture, and personal rhythm.',
  },
  {
    num: '02',
    title: 'Clinical Hygiene Standards',
    text: 'Single-use blades, sealed autoclave tool pouches, fresh laundered linens for every guest, and hypoallergenic skincare protocols define our daily operation.',
  },
  {
    num: '03',
    title: 'Respect For Your Time',
    text: 'Our digital scheduling platform eliminates waiting-room uncertainty across Birgunj, letting you choose your exact specialist, duration, and Nepal Time slot.',
  },
  {
    num: '04',
    title: 'Unhurried Hospitality',
    text: 'From warm eucalyptus towels during beard rituals to serene botanical skincare suites, every visit is designed to feel calm and restorative.',
  },
];

export function AboutPage() {
  useDocumentMeta(
    'About Us',
    'Discover the story, philosophy, hygiene standards, and craftsmanship behind The Beard Shop Beauty Salon in Birgunj, Nepal.'
  );

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Our Story · Birgunj, Nepal"
        title="A Modern Unisex Sanctuary for Grooming & Beauty"
        subtitle="Founded to bring calm international salon standards to Birgunj, Parsa, Madhesh Province — uniting classic master barbering with editorial hair artistry, skincare, and party makeup."
        rightSlot={
          <div className="flex flex-wrap gap-3">
            <Link to="/booking">
              <Button variant="primary" size="lg">
                Book an Appointment <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/team">
              <Button variant="outline" size="lg">
                Meet Our Specialists
              </Button>
            </Link>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <EditorialReveal className="lg:col-span-7">
            <div className="aspect-[16/10] overflow-hidden rounded-[4px] border border-[#E6DADC] bg-[#EFE1E4]">
              <SafeImage
                src={IMG_HERO}
                alt="The Beard Shop salon interior architecture"
                priority
                className="h-full w-full object-cover"
              />
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.08} className="lg:col-span-5 space-y-6">
            <SectionHeader
              kicker="The Atelier"
              title="Architecture Designed for Quiet Focus"
            />
            <p className="text-[15px] sm:text-base leading-[1.78] text-[#5C5852]">
              Too often, guests had to choose between rushed neighborhood barbershops or crowded
              beauty parlors. Our atelier bridges both worlds in one serene architectural space
              built with travertine stone, warm linen, and daylight-calibrated mirrors.
            </p>
            <p className="text-[15px] sm:text-base leading-[1.78] text-[#5C5852]">
              Every appointment is paced deliberately — allowing our barbers, colorists, and makeup
              artists to consult thoroughly before the first snip or brush stroke.
            </p>
          </EditorialReveal>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="border-y border-[#262421] bg-[#6B1222] text-[#FAF8F4]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:divide-x md:divide-white/10">
            <EditorialReveal className="space-y-4 md:pr-10">
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.08em] text-[#F0B6BF]">
                <span aria-hidden="true" className="h-px w-6 bg-[#9E1F32]/70" />
                <span>Our Mission</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-[1.15] text-[#FAF8F4]">
                Elevate everyday grooming into a quiet confidence ritual.
              </h2>
              <p className="text-sm sm:text-[15px] leading-[1.75] text-[#C4BCB0]">
                We deliver consistent, hygienic, consultation-led hair, beard, skin, and beauty
                services at fair, transparent NPR pricing accessible to modern clients across
                Birgunj and Madhesh Province.
              </p>
            </EditorialReveal>
            <EditorialReveal delay={0.08} className="space-y-4 md:pl-10">
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.08em] text-[#F0B6BF]">
                <span aria-hidden="true" className="h-px w-6 bg-[#9E1F32]/70" />
                <span>Our Vision</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-[1.15] text-[#FAF8F4]">
                Set the benchmark for unisex salon hospitality in Nepal.
              </h2>
              <p className="text-sm sm:text-[15px] leading-[1.75] text-[#C4BCB0]">
                By combining continuous stylist education, botanical-first product curation, and
                seamless online appointment management, we aspire to be the region’s most trusted
                grooming and beauty house.
              </p>
            </EditorialReveal>
          </div>
        </div>
      </section>

      {/* Standards & Hygiene */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <EditorialReveal>
          <SectionHeader
            kicker="Professional Standards"
            title="Craftsmanship, Hygiene & Client Care"
            subtitle="Four non-negotiable principles that govern every chair and treatment room."
          />
        </EditorialReveal>

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {PILLARS.map((item) => (
            <StaggerItem key={item.num}>
              <div className="h-full rounded-[4px] border border-[#E6DADC] bg-white p-8 sm:p-9">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#8B1A2D] tabular-nums">{item.num}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-[#E6DADC]" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-medium text-[#2A0810]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm sm:text-[15px] leading-[1.72] text-[#5C5852]">
                  {item.text}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <StaggerContainer className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { src: IMG_EXEC, alt: 'Precision executive haircut craft' },
            { src: IMG_SPA, alt: 'Serene botanical facial treatment suite' },
            { src: IMG_MANI, alt: 'Minimalist hand and nail spa sanctuary' },
          ].map((photo) => (
            <StaggerItem key={photo.alt}>
              <div className="aspect-[4/3] overflow-hidden rounded-[4px] border border-[#E6DADC] bg-[#EFE1E4]">
                <SafeImage
                  src={photo.src}
                  alt={photo.alt}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </div>
  );
}
