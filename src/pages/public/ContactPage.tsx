import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useGetSettingsQuery, useSubmitContactMutation } from '../../api/salonApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { buildWhatsAppLink } from '../../utils/nepal';
import { Button, Input, PageIntro, Textarea } from '../../components/ui/Primitives';
import { EditorialReveal } from '../../components/ui/MotionPrimitives';
import { SalonLocationMap } from '../../components/maps/SalonLocationMap';

const contactFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().min(7, 'Phone number is required'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  subject: z.string().trim().min(2, 'Subject is required'),
  message: z.string().trim().min(5, 'Please write a brief message'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactPage() {
  useDocumentMeta(
    'Contact & Directions',
    'Get in touch with The Beard Shop Beauty Salon in Birgunj, Parsa, Madhesh Province, Nepal. View Google Maps directions, hours, and WhatsApp.'
  );

  const { data: settings } = useGetSettingsQuery();
  const [submitContact, { isLoading }] = useSubmitContactMutation();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (values: ContactFormValues) => {
    await submitContact(values).unwrap();
    setSubmitted(true);
    reset();
  };

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Concierge · Birgunj, Nepal"
        title="Visit or Write To Us"
        subtitle="Reach our studio desk for celebration glam consultations, group appointments, or personalized grooming guidance in Birgunj."
        rightSlot={
          <div className="flex flex-wrap gap-3">
            <a
              href={buildWhatsAppLink(
                settings?.whatsappNumber || '9779800000000',
                'Namaste! I have a question about services at The Beard Shop, Birgunj.'
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="gold" size="md">
                <MessageCircle className="h-4 w-4" /> WhatsApp Concierge
              </Button>
            </a>
            <a
              href={
                settings?.googleMapsUrl ||
                'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/'
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="md">
                Directions <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Contact Details & Hours */}
          <EditorialReveal className="lg:col-span-5">
            <div className="rounded-[4px] border border-[#E6DADC] bg-white p-7 sm:p-8 shadow-[0_8px_30px_rgba(17,17,17,0.03)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8B1A2D]">
                Studio Directory
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-[#2A0810]">
                Birgunj Flagship Atelier
              </h2>

              <div className="mt-7 space-y-6 text-sm">
                <div className="flex items-start gap-3.5">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#8B1A2D] shrink-0" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#777777]">
                      Address
                    </p>
                    <p className="mt-1 leading-relaxed text-[#222222]">
                      {settings?.address || 'Birgunj, Parsa, Madhesh Province, Nepal'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="mt-0.5 h-4 w-4 text-[#8B1A2D] shrink-0" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#777777]">
                      Phone
                    </p>
                    <p className="mt-1 font-mono text-[13px] text-[#222222] tabular-nums">
                      {settings?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="mt-0.5 h-4 w-4 text-[#8B1A2D] shrink-0" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#777777]">
                      Email
                    </p>
                    <p className="mt-1 text-[#222222]">{settings?.email}</p>
                  </div>
                </div>

                <div className="border-t border-[#ECE6DB] pt-6 flex items-start gap-3.5">
                  <Clock className="mt-0.5 h-4 w-4 text-[#8B1A2D] shrink-0" />
                  <div className="w-full">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#777777] mb-3">
                      Opening Hours (NPT)
                    </p>
                    <div className="space-y-2">
                      {(settings?.openingHours || []).map((row) => (
                        <div
                          key={row.day}
                          className="flex items-center justify-between text-xs border-b border-[#F2EDE3] pb-1.5 last:border-b-0 last:pb-0"
                        >
                          <span className="text-[#4A4640]">{row.day}</span>
                          <span
                            className={`font-mono tabular-nums ${
                              row.closed ? 'text-[#8B1A2D]' : 'text-[#2A0810]'
                            }`}
                          >
                            {row.closed ? 'Closed' : `${row.open} – ${row.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </EditorialReveal>

          {/* Contact Form */}
          <EditorialReveal delay={0.08} className="lg:col-span-7">
            <div className="rounded-[4px] border border-[#E6DADC] bg-white p-7 sm:p-10 shadow-[0_8px_30px_rgba(17,17,17,0.03)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8B1A2D]">
                Direct Correspondence
              </p>
              <h2 className="mt-2 font-serif text-3xl font-medium text-[#2A0810]">
                Send an Inquiry
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5852]">
                Ask about festive glam, group bookings, keratin care, or bespoke hair consultations.
              </p>

              {submitted && (
                <div className="mt-6 flex items-start gap-3 rounded-[4px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>
                    Thank you — your message has been delivered to our Birgunj concierge desk.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4640] mb-1.5">
                      Full Name *
                    </label>
                    <Input {...register('fullName')} placeholder="Your full name" />
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs text-red-700">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4640] mb-1.5">
                      Phone *
                    </label>
                    <Input {...register('phone')} placeholder="+977 98XXXXXXXX" />
                    {errors.phone && (
                      <p className="mt-1.5 text-xs text-red-700">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4640] mb-1.5">
                      Email
                    </label>
                    <Input {...register('email')} type="email" placeholder="Optional email" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4640] mb-1.5">
                      Subject *
                    </label>
                    <Input {...register('subject')} placeholder="Party makeup, keratin, etc." />
                    {errors.subject && (
                      <p className="mt-1.5 text-xs text-red-700">{errors.subject.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4640] mb-1.5">
                    Message *
                  </label>
                  <Textarea {...register('message')} placeholder="How can our specialists help?" />
                  {errors.message && (
                    <p className="mt-1.5 text-xs text-red-700">{errors.message.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
                    {isLoading ? 'Sending Inquiry...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </div>
          </EditorialReveal>
        </div>

        {/* Interactive Google Map */}
        <EditorialReveal delay={0.1} className="mt-14 sm:mt-16">
          <div className="rounded-[4px] border border-[#E6DADC] bg-white p-2 shadow-[0_12px_36px_rgba(17,17,17,0.04)]">
            <SalonLocationMap
              businessName={settings?.businessName || 'The Beard Shop Beauty Salon'}
              address={settings?.address || 'Birgunj, Parsa, Madhesh Province, Nepal'}
              latitude={settings?.latitude || 27.014045}
              longitude={settings?.longitude || 84.8482375}
              googleMapsUrl={
                settings?.googleMapsUrl ||
                'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/'
              }
              heightClass="h-[420px]"
            />
          </div>
        </EditorialReveal>
      </div>
    </div>
  );
}
