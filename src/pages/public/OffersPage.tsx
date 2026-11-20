import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { useGetOffersQuery } from '../../api/salonApi';
import { useAppSelector } from '../../hooks/useAppStore';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button, PageIntro, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';

export function OffersPage() {
  useDocumentMeta(
    'Festival Offers & Promotions',
    'Explore Dashain, Tihar, Teej, Chhath, and Nepali New Year salon promotions in Birgunj, Nepal.'
  );

  const lang = useAppSelector((s) => s.ui.language);
  const { data: offers = [], isLoading } = useGetOffersQuery();
  const [copiedCode, setCopiedCode] = useState<string>('');

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Nepal Seasonal Privileges"
        title="Dashain, Tihar, Teej, Chhath & New Year Offers"
        subtitle="Editable seasonal promotions managed from the Admin Offers studio. Mention your code in booking notes or at reception."
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 gap-9 md:grid-cols-2">
            {offers.map((offer) => (
              <StaggerItem key={offer.id} className="h-full">
                <article className="group grid h-full grid-cols-1 sm:grid-cols-12 overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="sm:col-span-5 overflow-hidden bg-[#EFE1E4]">
                    <SafeImage
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="h-full min-h-[230px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-7 sm:col-span-7">
                    <div>
                      <p className="text-xs font-medium tracking-[0.06em] text-[#8B1A2D]">
                        {offer.festivalTag.replace(/_/g, ' ')} · {offer.discountText}
                      </p>
                      <h2 className="mt-2.5 font-serif text-[1.65rem] font-medium leading-[1.16] text-[#2A0810]">
                        {lang === 'ne' && offer.titleNe ? offer.titleNe : offer.title}
                      </h2>
                      <p className="mt-2.5 text-sm leading-[1.7] text-[#5C5852]">
                        {offer.description}
                      </p>
                      <p className="mt-3.5 font-mono text-[11px] text-[#777777] tabular-nums">
                        Valid: {offer.validFrom} to {offer.validUntil}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E6DADC] pt-4">
                      {offer.promoCode ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(offer.promoCode)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 font-mono text-xs font-medium text-[#2A0810] hover:text-[#8B1A2D] transition-colors cursor-pointer"
                        >
                          {copiedCode === offer.promoCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-700" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-[#8B1A2D]" /> {offer.promoCode}
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-[#777777]">Applied in-salon</span>
                      )}
                      <Link to="/booking">
                        <Button variant="primary" size="sm">
                          Book With Offer
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
