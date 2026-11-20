import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import { Scissors, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LUXURY_EASE } from './MotionPrimitives';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-[4px] text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1F32] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F4] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[#6B1222] text-[#FAF8F4] hover:bg-[#88182C] shadow-[0_2px_8px_rgba(107,18,34,0.18)]',
        gold:
          'bg-[#9E1F32] text-[#FAF8F4] font-semibold hover:bg-[#B8293E] shadow-[0_2px_10px_rgba(158,31,50,0.24)]',
        outline:
          'border border-[#6B1222]/30 bg-transparent text-[#6B1222] hover:border-[#6B1222] hover:bg-[#6B1222]/[0.06]',
        subtle: 'bg-[#EFE1E4] text-[#2A0810] hover:bg-[#E6D0D5]',
        ghost: 'text-[#2A1216] hover:bg-[#EFE1E4]/70',
        danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B]',
      },
      size: {
        sm: 'h-10 px-4 text-xs tracking-[0.02em]',
        md: 'h-11 px-6 text-sm tracking-[0.015em]',
        lg: 'h-[50px] px-8 text-sm tracking-[0.03em]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-[4px] border border-[#DCCBD0] bg-white px-4 py-2 text-sm text-[#2A1216] placeholder:text-[#8A767A] transition-colors duration-150 hover:border-[#C2A4AC] focus-visible:border-[#9E1F32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1F32]/25 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[112px] w-full rounded-[4px] border border-[#DCCBD0] bg-white px-4 py-3 text-sm leading-relaxed text-[#2A1216] placeholder:text-[#8A767A] transition-colors duration-150 hover:border-[#C2A4AC] focus-visible:border-[#9E1F32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1F32]/25 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-[4px] border border-[#DCCBD0] bg-white px-3.5 py-2 text-sm text-[#2A1216] transition-colors duration-150 hover:border-[#C2A4AC] focus-visible:border-[#9E1F32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1F32]/25',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[4px] border border-[#E6DADC] bg-white text-[#2A1216]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[4px] bg-[#EFE1E4]/80', className)} />;
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackTitle,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gradient-to-br from-[#F4E8EA] to-[#E6D1D6] text-[#5C4B4E] p-6 text-center',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Scissors className="h-5 w-5 text-[#8B1A2D] mb-2.5" />
        <span className="font-serif text-base text-[#2A0810]">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(
        'transition-opacity duration-500 ease-out',
        loaded || priority ? 'opacity-100' : 'opacity-0',
        className
      )}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A0810]/65 p-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: LUXURY_EASE }}
            className={cn(
              'relative w-full rounded-[4px] border border-[#E6DADC] bg-[#FAF8F4] shadow-2xl max-h-[90vh] overflow-y-auto',
              maxWidth
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6DADC] px-6 py-4">
              <h3 className="font-serif text-2xl font-medium text-[#2A0810]">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[#5C4B4E] hover:bg-[#EFE1E4] hover:text-[#2A0810] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = 'left',
  dark = false,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        'space-y-3.5',
        align === 'center' && 'text-center mx-auto max-w-2xl'
      )}
    >
      {kicker && (
        <div
          className={cn(
            'flex items-center gap-3 text-[12px] font-medium tracking-[0.08em]',
            align === 'center' && 'justify-center',
            dark ? 'text-[#E3A0AA]' : 'text-[#8B1A2D]'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-px w-6 shrink-0',
              dark ? 'bg-[#E3A0AA]/65' : 'bg-[#9E1F32]'
            )}
          />
          <span>{kicker}</span>
        </div>
      )}
      <h2
        className={cn(
          'font-serif text-[2rem] sm:text-[2.5rem] lg:text-[2.95rem] font-medium leading-[1.08] tracking-[-0.015em]',
          dark ? 'text-[#FAF8F4]' : 'text-[#2A0810]'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-[15px] sm:text-base leading-[1.7] max-w-[60ch]',
            align === 'center' && 'mx-auto',
            dark ? 'text-[#DFCDD0] tracking-[0.01em]' : 'text-[#5C4B4E]'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function PageIntro({
  kicker,
  title,
  subtitle,
  rightSlot,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#E6DADC] bg-gradient-to-b from-[#F5EAEB]/85 to-[#FAF8F4]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: LUXURY_EASE }}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-[12px] font-medium tracking-[0.08em] text-[#8B1A2D]">
              <span aria-hidden="true" className="h-px w-6 bg-[#9E1F32]" />
              <span>{kicker}</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.45rem] font-medium leading-[1.05] tracking-[-0.015em] text-[#2A0810]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[15px] sm:text-base leading-[1.7] text-[#5C4B4E] max-w-[58ch]">
                {subtitle}
              </p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </motion.div>
      </div>
    </section>
  );
}
