import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { dismissToast, pushToast } from '../../store/slices/uiSlice';
import { useUploadAdminImageMutation } from '../../api/adminApi';
import { Button, Input, Modal, SafeImage, Select } from '../ui/Primitives';
import { LUXURY_EASE } from '../ui/MotionPrimitives';

export const SALON_IMAGE_PRESETS = [
  { label: 'Salon Interior (Hero)', url: '/src/assets/images/hero_salon_interior_1795150941397.jpg' },
  { label: 'Beard Grooming Ritual', url: '/src/assets/images/service_beard_grooming_1795150943254.jpg' },
  { label: 'Executive Haircut', url: '/src/assets/images/editorial_exec_haircut_1795153778693.jpg' },
  { label: 'Hair Styling & Blowout', url: '/src/assets/images/service_hair_styling_1795150941473.jpg' },
  { label: 'Balayage & Color Artistry', url: '/src/assets/images/editorial_balayage_color_1795153778679.jpg' },
  { label: 'Party & Celebration Makeup', url: '/src/assets/images/service_bridal_makeup_1795150941593.jpg' },
  { label: 'Spa & Facial Lounge', url: '/src/assets/images/service_spa_facial_1795150942040.jpg' },
  { label: 'Manicure & Pedicure Spa', url: '/src/assets/images/editorial_mani_pedi_spa_1795153777948.jpg' },
  { label: 'Portrait — Master Stylist', url: '/src/assets/images/team_master_stylist_1795150942977.jpg' },
  { label: 'Portrait — Makeup Artist', url: '/src/assets/images/team_portrait_bridal_artist_1795153778681.jpg' },
  { label: 'Portrait — Color Director', url: '/src/assets/images/team_portrait_color_director_1795153778841.jpg' },
];

export function useAdminToast() {
  const dispatch = useAppDispatch();

  const notify = useCallback(
    (variant: 'success' | 'error' | 'info', title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      dispatch(pushToast({ id, variant, title, description }));
      window.setTimeout(() => {
        dispatch(dismissToast(id));
      }, 4200);
    },
    [dispatch]
  );

  return {
    notifySuccess: useCallback(
      (title: string, description?: string) => notify('success', title, description),
      [notify]
    ),
    notifyError: useCallback(
      (title: string, description?: string) => notify('error', title, description),
      [notify]
    ),
    notifyInfo: useCallback(
      (title: string, description?: string) => notify('info', title, description),
      [notify]
    ),
  };
}

export function extractApiError(err: unknown, fallback = 'Action could not be completed.'): string {
  const e = err as { data?: { error?: string }; error?: string; message?: string };
  return e?.data?.error || e?.error || e?.message || fallback;
}

export function AdminToastViewport() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const dispatch = useAppDispatch();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[70] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: LUXURY_EASE }}
            className={`pointer-events-auto flex items-start gap-3 rounded-[4px] border px-4 py-3.5 shadow-xl ${
              toast.variant === 'error'
                ? 'border-red-200 bg-white text-[#2A0810]'
                : toast.variant === 'info'
                  ? 'border-[#D5C9B6] bg-[#FAF8F4] text-[#2A0810]'
                  : 'border-[#4A121F] bg-[#2A0810] text-[#FAF8F4]'
            }`}
          >
            {toast.variant === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            ) : toast.variant === 'info' ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8B1A2D]" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F0B6BF]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-snug">{toast.title}</p>
              {toast.description && (
                <p
                  className={`mt-0.5 text-[11px] leading-relaxed ${
                    toast.variant === 'success' ? 'text-[#CEC7BC]' : 'text-[#5C5852]'
                  }`}
                >
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatch(dismissToast(toast.id))}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#E6DADC] pb-5">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-[-0.015em] text-[#2A0810]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-[#6A655D]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

export function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  totalCount,
  itemLabel = 'records',
}: {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  totalCount?: number;
  itemLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8379]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 pl-10 pr-8 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8379] hover:text-[#2A0810] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {filters}
      </div>
      {typeof totalCount === 'number' && (
        <p className="text-xs text-[#6A655D] tabular-nums shrink-0">
          {totalCount} {itemLabel}
        </p>
      )}
    </div>
  );
}

export function usePagination<T>(items: T[], initialPageSize = 8) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize: (nextSize: number) => {
      setPageSize(nextSize);
      setPage(1);
    },
    totalItems,
    totalPages,
    paginatedItems,
  };
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  if (totalItems === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[#E6DADC] bg-[#FAF8F4]/70 px-4 py-3 text-xs text-[#5C5852] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          Showing <strong className="text-[#2A0810]">{start}–{end}</strong> of{' '}
          <strong className="text-[#2A0810]">{totalItems}</strong>
        </span>
        {onPageSizeChange && (
          <Select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 w-24 py-0 text-xs"
            aria-label="Rows per page"
          >
            <option value={6}>6 / page</option>
            <option value={8}>8 / page</option>
            <option value={12}>12 / page</option>
            <option value={25}>25 / page</option>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#DCCBD0] bg-white px-2.5 text-xs font-medium text-[#2A0810] transition-colors hover:border-[#6B1222] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 min-w-8 rounded-[4px] px-2 text-xs font-mono tabular-nums transition-colors cursor-pointer ${
              p === page
                ? 'bg-[#6B1222] text-[#FAF8F4]'
                : 'border border-transparent text-[#5C5852] hover:border-[#DCCBD0] hover:bg-white hover:text-[#2A0810]'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#DCCBD0] bg-white px-2.5 text-xs font-medium text-[#2A0810] transition-colors hover:border-[#6B1222] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm Delete',
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-[#5C5852]">{description}</p>
        <div className="flex justify-end gap-2.5 border-t border-[#E6DADC] pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function StatusText({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone =
    ['COMPLETED', 'PAID', 'VERIFIED', 'PUBLISHED', 'AVAILABLE', 'ACTIVE', 'REPLIED', 'SENT'].includes(
      normalized
    )
      ? 'text-[#15803D]'
      : ['PENDING', 'PENDING_VERIFICATION', 'APPROVED', 'INITIATED', 'NEW'].includes(normalized)
        ? 'text-[#B45309]'
        : ['CANCELLED', 'REJECTED', 'FAILED', 'NO_SHOW', 'REFUNDED', 'SUSPENDED', 'HIDDEN'].includes(
              normalized
            )
          ? 'text-[#B91C1C]'
          : 'text-[#5C5852]';

  return (
    <span className={`font-medium text-xs tracking-[0.01em] ${tone}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function AdminImageField({
  label = 'Image',
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (nextUrl: string) => void;
}) {
  const [uploadImage, { isLoading }] = useUploadAdminImageMutation();
  const [error, setError] = useState('');

  const handleFile = (file: File) => {
    setError('');
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await uploadImage({ dataUrl: String(reader.result) }).unwrap();
        onChange(res.url);
      } catch (err) {
        setError(extractApiError(err, 'Only JPEG, PNG, or WebP files under 2 MB are supported.'));
      }
    };
    reader.readAsDataURL(file);
  };

  const isPreset = SALON_IMAGE_PRESETS.some((p) => p.url === value);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#4A4640]">{label}</label>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[4px] border border-[#DCCBD0] bg-[#EFE1E4]">
          <SafeImage src={value} alt={label} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          <Select
            value={isPreset ? value : '__custom__'}
            onChange={(e) => {
              if (e.target.value !== '__custom__') onChange(e.target.value);
            }}
            className="flex-1 min-w-[180px] h-10 text-xs"
          >
            {!isPreset && <option value="__custom__">Uploaded / Custom Image</option>}
            {SALON_IMAGE_PRESETS.map((preset) => (
              <option key={preset.url} value={preset.url}>
                {preset.label}
              </option>
            ))}
          </Select>
          <label className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#DCCBD0] bg-white px-3.5 text-xs font-medium text-[#2A0810] cursor-pointer hover:border-[#6B1222] transition-colors whitespace-nowrap">
            <Upload className="h-3.5 w-3.5" />
            {isLoading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
