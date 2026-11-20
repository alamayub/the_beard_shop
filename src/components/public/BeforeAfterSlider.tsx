import { useState } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { SafeImage } from '../ui/Primitives';

interface BeforeAfterSliderProps {
  title: string;
  description: string;
  beforeSrc: string;
  afterSrc: string;
}

export function BeforeAfterSlider({
  title,
  description,
  beforeSrc,
  afterSrc,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(52);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="group space-y-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] border border-[#E3DDD2] bg-[#E9DFD0] select-none touch-none">
        <SafeImage
          src={afterSrc}
          alt={`${title} after transformation`}
          className="h-full w-full object-cover"
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <SafeImage
            src={beforeSrc}
            alt={`${title} before transformation`}
            className="h-full w-full object-cover grayscale-[22%] contrast-[0.96]"
          />
        </div>

        {/* Crisp Divider Line & Champagne Brass Handle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#FAF8F4]/90 shadow-[0_0_12px_rgba(0,0,0,0.4)]"
          style={{ left: `${position}%` }}
        >
          <div
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-[#C6A66B] bg-[#111111]/92 text-[#FAF8F4] shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform duration-150 ${
              isDragging ? 'scale-110 ring-4 ring-[#C6A66B]/30' : 'group-hover:scale-105'
            }`}
          >
            <MoveHorizontal className="h-4 w-4 text-[#C6A66B]" />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3.5 left-3.5 rounded-[2px] bg-[#111111]/75 backdrop-blur-sm px-3 py-1 text-[11px] font-medium tracking-[0.06em] text-[#FAF8F4]">
          Before
        </div>
        <div className="pointer-events-none absolute bottom-3.5 right-3.5 rounded-[2px] bg-[#111111]/75 backdrop-blur-sm px-3 py-1 text-[11px] font-medium tracking-[0.06em] text-[#C6A66B]">
          After
        </div>

        <input
          type="range"
          min={6}
          max={94}
          value={position}
          aria-label={`Compare before and after for ${title}`}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)}
          onBlur={() => setIsDragging(false)}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <div className="space-y-1">
        <h3 className="font-serif text-[1.45rem] font-medium leading-snug text-[#111111]">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[#5C5852]">{description}</p>
      </div>
    </div>
  );
}
