import { useMemo, useState } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import {
  useCreateAdminCategoryMutation,
  useCreateAdminGalleryItemMutation,
  useCreateAdminServiceMutation,
  useDeleteAdminCategoryMutation,
  useDeleteAdminGalleryItemMutation,
  useDeleteAdminServiceMutation,
  useGetAdminCategoriesQuery,
  useGetAdminGalleryQuery,
  useGetAdminServicesQuery,
  useUpdateAdminCategoryMutation,
  useUpdateAdminGalleryItemMutation,
  useUpdateAdminServiceMutation,
} from '../../api/adminApi';
import type { GalleryItem, SalonService, ServiceCategory } from '../../types/salon';
import { formatNpr } from '../../utils/nepal';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import {
  Button,
  Card,
  Input,
  Modal,
  SafeImage,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui/Primitives';
import {
  AdminImageField,
  AdminPageHeader,
  AdminPagination,
  AdminToolbar,
  ConfirmModal,
  SALON_IMAGE_PRESETS,
  StatusText,
  extractApiError,
  useAdminToast,
  usePagination,
} from '../../components/admin/AdminPrimitives';

// ─── Services Management ───────────────────────────────────────────────────────
export function AdminServicesPage() {
  useDocumentMeta('Services Management', 'Create, edit, price, and publish salon treatments.');
  const { notifySuccess, notifyError, notifyInfo } = useAdminToast();
  const { data: services = [], isLoading } = useGetAdminServicesQuery();
  const { data: categories = [] } = useGetAdminCategoriesQuery();
  const [createService, { isLoading: creating }] = useCreateAdminServiceMutation();
  const [updateService, { isLoading: updating }] = useUpdateAdminServiceMutation();
  const [deleteService, { isLoading: deleting }] = useDeleteAdminServiceMutation();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalonService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalonService | null>(null);

  const [name, setName] = useState('');
  const [nameNe, setNameNe] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [priceNpr, setPriceNpr] = useState(1200);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(SALON_IMAGE_PRESETS[1].url);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const categoryNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (categoryFilter !== 'ALL' && String(s.categoryId) !== categoryFilter) return false;
      if (statusFilter === 'PUBLISHED' && !s.isPublished) return false;
      if (statusFilter === 'DRAFT' && s.isPublished) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [services, search, categoryFilter, statusFilter]);

  const pagination = usePagination(filtered, 8);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setNameNe('');
    setCategoryId(categories[0]?.id || 1);
    setPriceNpr(1200);
    setDurationMinutes(45);
    setDescription('');
    setImageUrl(SALON_IMAGE_PRESETS[1].url);
    setIsFeatured(false);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (svc: SalonService) => {
    setEditing(svc);
    setName(svc.name);
    setNameNe(svc.nameNe || '');
    setCategoryId(svc.categoryId);
    setPriceNpr(svc.priceNpr);
    setDurationMinutes(svc.durationMinutes);
    setDescription(svc.description);
    setImageUrl(svc.imageUrl);
    setIsFeatured(svc.isFeatured);
    setIsPublished(svc.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateService({
          id: editing.id,
          data: {
            name,
            nameNe,
            categoryId: Number(categoryId),
            priceNpr: Number(priceNpr),
            durationMinutes: Number(durationMinutes),
            description,
            imageUrl,
            isFeatured,
            isPublished,
            isDemoPrice: false,
          },
        }).unwrap();
        notifySuccess('Service updated', `${name} has been saved.`);
      } else {
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
        await createService({
          name,
          nameNe,
          slug,
          categoryId: Number(categoryId) || categories[0]?.id || 1,
          priceNpr: Number(priceNpr),
          durationMinutes: Number(durationMinutes),
          description,
          imageUrl,
          isFeatured,
          isPublished,
          isDemoPrice: false,
        }).unwrap();
        notifySuccess('Service created', `${name} added to catalog.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Could not save service', extractApiError(err));
    }
  };

  const handleTogglePublished = async (svc: SalonService) => {
    try {
      await updateService({ id: svc.id, data: { isPublished: !svc.isPublished } }).unwrap();
      notifyInfo(
        svc.isPublished ? 'Moved to Draft' : 'Service Published',
        `${svc.name} visibility updated.`
      );
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.id).unwrap();
      notifySuccess('Service deleted', `${deleteTarget.name} removed from catalog.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Services Management"
        subtitle="Manage salon treatments, starting prices in NPR, durations, bespoke imagery, and visibility."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search services by name or description..."
        totalCount={filtered.length}
        itemLabel="services"
        filters={
          <>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                pagination.setPage(1);
              }}
              className="h-10 w-44 text-xs"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                pagination.setPage(1);
              }}
              className="h-10 w-36 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </Select>
          </>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-serif text-2xl text-[#2A0810]">No services found</p>
            <p className="mt-1 text-xs text-[#6A655D]">
              Try adjusting your filters or create a new salon treatment.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Add Service
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A655D]">
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium text-right">Price (NPR)</th>
                    <th className="px-4 py-3 font-medium">Visibility</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.map((svc) => (
                    <tr key={svc.id} className="hover:bg-[#FAF8F4]/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-14 overflow-hidden rounded-[4px] bg-[#EFE1E4] shrink-0">
                            <SafeImage
                              src={svc.imageUrl}
                              alt={svc.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#2A0810] flex items-center gap-1.5">
                              <span className="truncate">{svc.name}</span>
                              {svc.isFeatured && (
                                <Star className="h-3 w-3 shrink-0 fill-[#9E1F32] text-[#9E1F32]" />
                              )}
                            </p>
                            <p className="text-[11px] text-[#777777]">Official Salon Rate</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#5C5852] whitespace-nowrap">
                        {categoryNameMap[svc.categoryId] || 'General'}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-[#5C5852] whitespace-nowrap">
                        {svc.durationMinutes} min
                      </td>
                      <td className="px-4 py-3 font-mono text-right font-medium tabular-nums text-[#2A0810] whitespace-nowrap">
                        {formatNpr(svc.priceNpr)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(svc)}
                          className="cursor-pointer hover:underline"
                        >
                          <StatusText status={svc.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-[11px]"
                            onClick={() => openEdit(svc)}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setDeleteTarget(svc)}
                            aria-label={`Delete ${svc.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-700" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Salon Service' : 'Add Salon Service'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Service Name (EN) *
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Service Name (नेपाली)
              </label>
              <Input value={nameNe} onChange={(e) => setNameNe(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Category *</label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Starting Price (NPR) *
              </label>
              <Input
                type="number"
                min={0}
                value={priceNpr}
                onChange={(e) => setPriceNpr(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Duration (min) *
              </label>
              <Input
                type="number"
                min={10}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A4640] mb-1">Description *</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <AdminImageField label="Service Photography" value={imageUrl} onChange={setImageUrl} />

          <div className="flex flex-wrap gap-5 pt-1 text-xs text-[#4A4640]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#111111]"
              />
              Published on website
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Feature on homepage
            </label>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Service"
        description={`Remove "${deleteTarget?.name}" permanently from your service menu?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Categories Management ─────────────────────────────────────────────────────
export function AdminCategoriesPage() {
  useDocumentMeta('Service Categories', 'Organize and localize salon service categories.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: categories = [], isLoading } = useGetAdminCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateAdminCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateAdminCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteAdminCategoryMutation();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategory | null>(null);

  const [name, setName] = useState('');
  const [nameNe, setNameNe] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.nameNe || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }, [categories, search]);

  const pagination = usePagination(filtered, 8);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setNameNe('');
    setDescription('');
    setSortOrder(categories.length + 1);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (cat: ServiceCategory) => {
    setEditing(cat);
    setName(cat.name);
    setNameNe(cat.nameNe || '');
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder || 0);
    setIsPublished(cat.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory({
          id: editing.id,
          data: { name, nameNe, description, sortOrder: Number(sortOrder), isPublished },
        }).unwrap();
        notifySuccess('Category updated', `${name} saved.`);
      } else {
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-3)}`;
        await createCategory({
          name,
          nameNe,
          slug,
          description,
          sortOrder: Number(sortOrder),
          isPublished,
        }).unwrap();
        notifySuccess('Category created', `${name} added.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id).unwrap();
      notifySuccess('Category deleted', `${deleteTarget.name} removed.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Service Categories"
        subtitle="Structure your service menu with English and Nepali headings and display ordering."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Category
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search categories..."
        totalCount={filtered.length}
        itemLabel="categories"
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#6A655D]">No categories found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A655D]">
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F4]/70 transition-colors">
                      <td className="px-4 py-3 font-mono tabular-nums text-[#777777]">
                        {String(cat.sortOrder).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#2A0810]">
                          {cat.name}{' '}
                          {cat.nameNe && <span className="text-[#8B1A2D]">· {cat.nameNe}</span>}
                        </p>
                        {cat.description && (
                          <p className="text-[11px] text-[#777777] line-clamp-1">
                            {cat.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#6A655D]">{cat.slug}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await updateCategory({
                              id: cat.id,
                              data: { isPublished: !cat.isPublished },
                            });
                            notifySuccess('Visibility updated', `${cat.name} status changed.`);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          <StatusText status={cat.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-[11px]"
                            onClick={() => openEdit(cat)}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setDeleteTarget(cat)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-700" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Category Name (EN) *
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Category Name (नेपाली)
              </label>
              <Input value={nameNe} onChange={(e) => setNameNe(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A4640] mb-1">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Display Order</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
            <label className="inline-flex items-center gap-2 pt-5 text-xs text-[#4A4640] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#111111]"
              />
              Published
            </label>
          </div>
          <div className="flex justify-end gap-2.5 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? Associated services in this category will also be removed.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Gallery Management ────────────────────────────────────────────────────────
const GALLERY_CATEGORIES = [
  { value: 'MENS_HAIRSTYLE', label: "Men's Hairstyle" },
  { value: 'WOMENS_HAIRSTYLE', label: "Women's Hairstyle" },
  { value: 'HAIR_COLORING', label: 'Hair Coloring' },
  { value: 'MAKEUP', label: 'Party Makeup' },
  { value: 'INTERIOR', label: 'Salon Interior' },
  { value: 'BEFORE_AFTER', label: 'Before & After' },
];

export function AdminGalleryPage() {
  useDocumentMeta('Gallery Management', 'Curate lookbook photography and Before/After transformations.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: items = [], isLoading } = useGetAdminGalleryQuery();
  const [createItem, { isLoading: creating }] = useCreateAdminGalleryItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateAdminGalleryItemMutation();
  const [deleteItem, { isLoading: deleting }] = useDeleteAdminGalleryItemMutation();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GalleryItem['category']>('MENS_HAIRSTYLE');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(SALON_IMAGE_PRESETS[2].url);
  const [beforeImageUrl, setBeforeImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (categoryFilter !== 'ALL' && it.category !== categoryFilter) return false;
      if (q && !it.title.toLowerCase().includes(q) && !(it.description || '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [items, search, categoryFilter]);

  const pagination = usePagination(filtered, 8);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setCategory('MENS_HAIRSTYLE');
    setDescription('');
    setImageUrl(SALON_IMAGE_PRESETS[2].url);
    setBeforeImageUrl('');
    setIsFeatured(false);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setTitle(item.title);
    setCategory(item.category);
    setDescription(item.description || '');
    setImageUrl(item.imageUrl);
    setBeforeImageUrl(item.beforeImageUrl || '');
    setIsFeatured(item.isFeatured);
    setIsPublished(item.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        category,
        description,
        imageUrl,
        beforeImageUrl: category === 'BEFORE_AFTER' ? beforeImageUrl : '',
        isFeatured,
        isPublished,
      };
      if (editing) {
        await updateItem({ id: editing.id, data: payload }).unwrap();
        notifySuccess('Lookbook item updated', title);
      } else {
        await createItem(payload).unwrap();
        notifySuccess('Added to lookbook', title);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id).unwrap();
      notifySuccess('Photo removed', deleteTarget.title);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery & Lookbook"
        subtitle="Manage editorial salon photography, transformation comparisons, and featured homepage tiles."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Photo
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search lookbook titles..."
        totalCount={filtered.length}
        itemLabel="photos"
        filters={
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              pagination.setPage(1);
            }}
            className="h-10 w-44 text-xs"
          >
            <option value="ALL">All Categories</option>
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="font-serif text-2xl text-[#2A0810]">No gallery items found</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add First Photo
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pagination.paginatedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-[#EFE1E4]">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#8B1A2D]">
                      <span>{item.category.replace(/_/g, ' ')}</span>
                      {item.isFeatured && <Star className="h-3 w-3 fill-[#9E1F32] text-[#9E1F32]" />}
                    </div>
                    <p className="mt-1 font-medium text-sm text-[#2A0810] truncate">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-[#6A655D] line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#EFE4E6] text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateItem({
                          id: item.id,
                          data: { isPublished: !item.isPublished },
                        });
                        notifySuccess('Gallery updated', `${item.title} visibility toggled.`);
                      }}
                      className="cursor-pointer hover:underline"
                    >
                      <StatusText status={item.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="text-[#2A0810] hover:text-[#8B1A2D] font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="text-red-700 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="overflow-hidden">
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </Card>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Lookbook Photo' : 'Add Lookbook Photo'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Category *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as GalleryItem['category'])}
              >
                {GALLERY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A4640] mb-1">Caption / Story</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <AdminImageField
            label={category === 'BEFORE_AFTER' ? 'After Transformation Photo' : 'Lookbook Photo'}
            value={imageUrl}
            onChange={setImageUrl}
          />

          {category === 'BEFORE_AFTER' && (
            <AdminImageField
              label="Before Photo (Comparison Slider)"
              value={beforeImageUrl || SALON_IMAGE_PRESETS[0].url}
              onChange={setBeforeImageUrl}
            />
          )}

          <div className="flex gap-5 text-xs text-[#4A4640]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#111111]"
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#111111]"
              />
              Featured on Homepage
            </label>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : 'Save Photo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Gallery Photo"
        description={`Remove "${deleteTarget?.title}" permanently from the lookbook?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
