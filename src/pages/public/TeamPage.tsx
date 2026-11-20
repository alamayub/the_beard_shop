import { useNavigate } from 'react-router-dom';
import { useGetTeamQuery } from '../../api/salonApi';
import { useAppDispatch } from '../../hooks/useAppStore';
import { setBookingPreselection } from '../../store/slices/uiSlice';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button, PageIntro, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';

export function TeamPage() {
  useDocumentMeta(
    'Meet Our Specialists',
    'Discover the barbers, hair colorists, makeup artists, and estheticians at The Beard Shop Beauty Salon in Birgunj, Nepal.'
  );

  const { data: team = [], isLoading } = useGetTeamQuery();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleBookWith = (staffId: number) => {
    dispatch(setBookingPreselection({ staffId }));
    navigate('/booking');
  };

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Our Artisans · Birgunj"
        title="Specialists Dedicated to Your Craft"
        subtitle="Each profile below represents an editable demo specialist record managed from the Admin Team & Schedule portal."
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {team.map((member) => (
              <StaggerItem key={member.id} className="h-full">
                <article className="group grid h-full grid-cols-1 sm:grid-cols-12 overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="sm:col-span-5 overflow-hidden bg-[#EFE1E4]">
                    <SafeImage
                      src={member.avatarUrl}
                      alt={member.fullName}
                      className="h-full min-h-[280px] w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-7 sm:col-span-7">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8B1A2D]">
                        <span>{member.roleTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{member.experienceYears} yrs exp.</span>
                      </div>
                      <h2 className="mt-2 font-serif text-[1.65rem] font-medium leading-snug text-[#2A0810]">
                        {member.fullName}
                      </h2>
                      <p className="mt-3 text-sm leading-[1.7] text-[#5C5852]">{member.bio}</p>

                      <div className="mt-5 border-t border-[#E6DADC] pt-3.5">
                        <p className="text-[11px] font-medium tracking-[0.06em] text-[#777777]">
                          Specializations
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#222222] leading-relaxed">
                          {(member.specializations || []).join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-[#E6DADC]">
                      <span className="text-xs text-[#5C5852]">
                        {member.isAvailable ? 'Accepting Bookings' : 'Currently Unavailable'}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!member.isAvailable}
                        onClick={() => handleBookWith(member.id)}
                      >
                        Book Specialist
                      </Button>
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
