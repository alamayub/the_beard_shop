import { useMemo, useState } from 'react';
import { ExternalLink, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import {
  useCreateAdminBlogPostMutation,
  useCreateAdminOfferMutation,
  useCreateAdminReviewMutation,
  useCreateAdminSocialPostMutation,
  useDeleteAdminBlogPostMutation,
  useDeleteAdminOfferMutation,
  useDeleteAdminReviewMutation,
  useDeleteAdminSocialPostMutation,
  useGetAdminBlogPostsQuery,
  useGetAdminOffersQuery,
  useGetAdminReviewsQuery,
  useGetAdminSocialPostsQuery,
  useUpdateAdminBlogPostMutation,
  useUpdateAdminOfferMutation,
  useUpdateAdminReviewMutation,
  useUpdateAdminSocialPostMutation,
} from '../../api/adminApi';
import type { BlogPost, SalonOffer, SalonReview, SocialPost } from '../../types/salon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { getKathmanduTodayIso } from '../../utils/nepal';
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

// ─── Social Media Updates Manager ──────────────────────────────────────────────
export function AdminSocialPage() {
  useDocumentMeta('Social Media Updates', 'Publish and curate Instagram & Facebook atelier posts.');
  const { notifySuccess, notifyError, notifyInfo } = useAdminToast();
  const { data: posts = [], isLoading } = useGetAdminSocialPostsQuery();
  const [createPost, { isLoading: creating }] = useCreateAdminSocialPostMutation();
  const [updatePost, { isLoading: updating }] = useUpdateAdminSocialPostMutation();
  const [deletePost, { isLoading: deleting }] = useDeleteAdminSocialPostMutation();

  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialPost | null>(null);

  const [platform, setPlatform] = useState<'INSTAGRAM' | 'FACEBOOK'>('INSTAGRAM');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'REEL'>('IMAGE');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState(SALON_IMAGE_PRESETS[0].url);
  const [postUrl, setPostUrl] = useState('https://www.instagram.com/the_beard_shop1/');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (platformFilter !== 'ALL' && p.platform !== platformFilter) return false;
      if (q && !p.caption.toLowerCase().includes(q) && !p.mediaType.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [posts, search, platformFilter]);

  const pagination = usePagination(filtered, 6);

  const openCreate = () => {
    setEditing(null);
    setPlatform('INSTAGRAM');
    setMediaType('IMAGE');
    setCaption('');
    setImageUrl(SALON_IMAGE_PRESETS[1].url);
    setPostUrl('https://www.instagram.com/the_beard_shop1/');
    setIsFeatured(true);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (post: SocialPost) => {
    setEditing(post);
    setPlatform(post.platform);
    setMediaType(post.mediaType);
    setCaption(post.caption);
    setImageUrl(post.imageUrl);
    setPostUrl(post.postUrl);
    setIsFeatured(post.isFeatured);
    setIsPublished(post.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updatePost({
          id: editing.id,
          data: { platform, mediaType, caption, imageUrl, postUrl, isFeatured, isPublished },
        }).unwrap();
        notifySuccess('Social post updated', 'Atelier feed refreshed.');
      } else {
        await createPost({
          platform,
          mediaType,
          caption,
          imageUrl,
          postUrl,
          isFeatured,
          isPublished,
        }).unwrap();
        notifySuccess('Social post published', 'Added to homepage & updates feed.');
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const togglePublish = async (post: SocialPost) => {
    try {
      await updatePost({ id: post.id, data: { isPublished: !post.isPublished } }).unwrap();
      notifyInfo('Visibility updated', `Post is now ${!post.isPublished ? 'published' : 'hidden'}.`);
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id).unwrap();
      notifySuccess('Post deleted', 'Removed from social media feed.');
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Social Media Feed"
        subtitle="Curate Instagram and Facebook transformations, reels, and announcements shown on the website."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Social Post
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search captions or media type..."
        totalCount={filtered.length}
        itemLabel="posts"
        filters={
          <div className="flex items-center gap-1 rounded-[4px] border border-[#E6DADC] bg-white p-1">
            {['ALL', 'INSTAGRAM', 'FACEBOOK'].map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setPlatformFilter(plat)}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  platformFilter === plat
                    ? 'bg-[#6B1222] text-[#FAF8F4]'
                    : 'text-[#5C5254] hover:text-[#2A1216]'
                }`}
              >
                {plat === 'ALL' ? 'All' : plat === 'INSTAGRAM' ? 'Instagram' : 'Facebook'}
              </button>
            ))}
          </div>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : pagination.paginatedItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6A5A5D]">No social posts found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
              {pagination.paginatedItems.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white"
                >
                  <div className="aspect-[4/3] bg-[#EFE1E3] overflow-hidden">
                    <SafeImage
                      src={post.imageUrl}
                      alt={post.caption}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#6A5A5D]">
                        <span>
                          {post.platform} · {post.mediaType}
                        </span>
                        <StatusText status={post.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#2A1216] line-clamp-3">
                        {post.caption}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#EFE4E6] pt-3">
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#6B1222] hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePublish(post)}
                          className="text-[11px] text-[#5C5254] hover:text-[#6B1222] px-1.5 cursor-pointer"
                        >
                          {post.isPublished ? 'Hide' : 'Publish'}
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5"
                          onClick={() => openEdit(post)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#9E1F32]"
                          onClick={() => setDeleteTarget(post)}
                          aria-label="Delete social post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
        title={editing ? 'Edit Social Post' : 'Create Social Post'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Platform</label>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'INSTAGRAM' | 'FACEBOOK')}
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Media Type</label>
              <Select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'IMAGE' | 'REEL')}
              >
                <option value="IMAGE">Image</option>
                <option value="REEL">Reel / Video</option>
              </Select>
            </div>
          </div>

          <AdminImageField label="Media Visual" value={imageUrl} onChange={setImageUrl} />

          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Post URL *</label>
            <Input
              required
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Caption *</label>
            <Textarea
              required
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write engaging caption for your Birgunj salon audience..."
            />
          </div>

          <div className="flex items-center gap-6 text-xs text-[#4A3B3E]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Featured on homepage
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Published
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Changes' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Social Post"
        description="Permanently remove this post from the salon social feed?"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Blog & Journal Articles ───────────────────────────────────────────────────
export function AdminBlogPage() {
  useDocumentMeta('Blog & Journal', 'Author and publish grooming, haircare, and skincare articles.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: articles = [], isLoading } = useGetAdminBlogPostsQuery();
  const [createArticle, { isLoading: creating }] = useCreateAdminBlogPostMutation();
  const [updateArticle, { isLoading: updating }] = useUpdateAdminBlogPostMutation();
  const [deleteArticle, { isLoading: deleting }] = useDeleteAdminBlogPostMutation();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Haircare');
  const [authorName, setAuthorName] = useState('The Beard Shop Editorial');
  const [readTimeMinutes, setReadTimeMinutes] = useState(4);
  const [coverImageUrl, setCoverImageUrl] = useState(SALON_IMAGE_PRESETS[3].url);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))),
    [articles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.excerpt.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [articles, search, categoryFilter]);

  const pagination = usePagination(filtered, 6);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setCategory('Haircare');
    setAuthorName('The Beard Shop Editorial');
    setReadTimeMinutes(4);
    setCoverImageUrl(SALON_IMAGE_PRESETS[3].url);
    setExcerpt('');
    setContent('');
    setIsFeatured(false);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setTitle(post.title);
    setCategory(post.category);
    setAuthorName(post.authorName);
    setReadTimeMinutes(post.readTimeMinutes);
    setCoverImageUrl(post.coverImageUrl);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setIsFeatured(post.isFeatured);
    setIsPublished(post.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateArticle({
          id: editing.id,
          data: {
            title,
            category,
            authorName,
            readTimeMinutes: Number(readTimeMinutes),
            coverImageUrl,
            excerpt,
            content,
            isFeatured,
            isPublished,
          },
        }).unwrap();
        notifySuccess('Article updated', `"${title}" saved.`);
      } else {
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
        await createArticle({
          title,
          slug,
          category,
          authorName,
          readTimeMinutes: Number(readTimeMinutes),
          coverImageUrl,
          excerpt,
          content,
          isFeatured,
          isPublished,
        }).unwrap();
        notifySuccess('Article published', `"${title}" added to journal.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArticle(deleteTarget.id).unwrap();
      notifySuccess('Article deleted', `"${deleteTarget.title}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog & Editorial Journal"
        subtitle="Publish haircare advice, skincare guides, and grooming rituals for Nepal's climate."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Write Article
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search articles by title or excerpt..."
        totalCount={filtered.length}
        itemLabel="articles"
        filters={
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-44 text-xs"
            aria-label="Filter by category"
          >
            <option value="ALL">All Topics</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                    <th className="px-5 py-3 font-medium">Article</th>
                    <th className="px-5 py-3 font-medium">Topic</th>
                    <th className="px-5 py-3 font-medium">Author</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-[#6A5A5D]">
                        No articles match your search.
                      </td>
                    </tr>
                  ) : (
                    pagination.paginatedItems.map((post) => (
                      <tr key={post.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-16 shrink-0 overflow-hidden rounded-[3px] bg-[#EFE1E3]">
                              <SafeImage
                                src={post.coverImageUrl}
                                alt={post.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-md">
                              <p className="font-medium text-[#2A1216] truncate">{post.title}</p>
                              <p className="text-[11px] text-[#7D6C70] truncate">{post.excerpt}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#5C5254] whitespace-nowrap">
                          {post.category} · {post.readTimeMinutes}m
                        </td>
                        <td className="px-5 py-3 text-[#5C5254] whitespace-nowrap">
                          {post.authorName}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <StatusText status={post.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => openEdit(post)}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#9E1F32]"
                              onClick={() => setDeleteTarget(post)}
                              aria-label={`Delete ${post.title}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
        title={editing ? 'Edit Journal Article' : 'Publish New Article'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Title *</label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Topic *</label>
              <Input required value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Author *</label>
              <Input required value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Read Min</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <AdminImageField label="Cover Image" value={coverImageUrl} onChange={setCoverImageUrl} />

          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Summary Excerpt *</label>
            <Textarea
              required
              className="min-h-[76px]"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Article Body *</label>
            <Textarea
              required
              className="min-h-[160px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6 text-xs text-[#4A3B3E]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Featured article
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Published
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Changes' : 'Publish Article'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Article"
        description={`Permanently delete "${deleteTarget?.title}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Nepal Festival & Seasonal Offers ──────────────────────────────────────────
export function AdminOffersPage() {
  useDocumentMeta('Festival & Seasonal Offers', 'Manage Dashain, Tihar, Teej, and Seasonal packages.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: offers = [], isLoading } = useGetAdminOffersQuery();
  const [createOffer, { isLoading: creating }] = useCreateAdminOfferMutation();
  const [updateOffer, { isLoading: updating }] = useUpdateAdminOfferMutation();
  const [deleteOffer, { isLoading: deleting }] = useDeleteAdminOfferMutation();

  const [search, setSearch] = useState('');
  const [festivalFilter, setFestivalFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalonOffer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalonOffer | null>(null);

  const [title, setTitle] = useState('');
  const [titleNe, setTitleNe] = useState('');
  const [festivalTag, setFestivalTag] = useState('Dashain');
  const [discountText, setDiscountText] = useState('20% Off');
  const [promoCode, setPromoCode] = useState('DASHAIN20');
  const [validFrom, setValidFrom] = useState(getKathmanduTodayIso());
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [imageUrl, setImageUrl] = useState(SALON_IMAGE_PRESETS[5].url);
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const tags = useMemo(
    () => Array.from(new Set(offers.map((o) => o.festivalTag).filter(Boolean))),
    [offers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers.filter((o) => {
      if (festivalFilter !== 'ALL' && o.festivalTag !== festivalFilter) return false;
      if (
        q &&
        !o.title.toLowerCase().includes(q) &&
        !o.promoCode.toLowerCase().includes(q) &&
        !o.festivalTag.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [offers, search, festivalFilter]);

  const pagination = usePagination(filtered, 6);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setTitleNe('');
    setFestivalTag('Dashain');
    setDiscountText('15% Off');
    setPromoCode('ATELIER15');
    setValidFrom(getKathmanduTodayIso());
    setValidUntil('2026-12-31');
    setImageUrl(SALON_IMAGE_PRESETS[5].url);
    setDescription('');
    setIsFeatured(true);
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (offer: SalonOffer) => {
    setEditing(offer);
    setTitle(offer.title);
    setTitleNe(offer.titleNe || '');
    setFestivalTag(offer.festivalTag);
    setDiscountText(offer.discountText);
    setPromoCode(offer.promoCode);
    setValidFrom(offer.validFrom);
    setValidUntil(offer.validUntil);
    setImageUrl(offer.imageUrl);
    setDescription(offer.description);
    setIsFeatured(offer.isFeatured);
    setIsPublished(offer.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        titleNe,
        festivalTag,
        discountText,
        promoCode: promoCode.trim().toUpperCase(),
        validFrom,
        validUntil,
        imageUrl,
        description,
        isFeatured,
        isPublished,
      };
      if (editing) {
        await updateOffer({ id: editing.id, data: payload }).unwrap();
        notifySuccess('Offer updated', `${title} saved.`);
      } else {
        await createOffer(payload).unwrap();
        notifySuccess('Offer created', `${title} is now live.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOffer(deleteTarget.id).unwrap();
      notifySuccess('Offer deleted', `"${deleteTarget.title}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Offers & Festival Packages"
        subtitle="Manage seasonal Dashain, Tihar, Teej, and Wedding Season privileges across the website."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Offer
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search offer title, code, or festival..."
        totalCount={filtered.length}
        itemLabel="offers"
        filters={
          <Select
            value={festivalFilter}
            onChange={(e) => setFestivalFilter(e.target.value)}
            className="h-10 w-44 text-xs"
            aria-label="Filter by festival"
          >
            <option value="ALL">All Festivals</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : pagination.paginatedItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6A5A5D]">No offers match your filter.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
              {pagination.paginatedItems.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white"
                >
                  <div className="aspect-[16/10] bg-[#EFE1E3] overflow-hidden">
                    <SafeImage
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#6A5A5D]">
                        <span className="font-medium text-[#8B1A2D]">{offer.festivalTag}</span>
                        <StatusText status={offer.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                      </div>
                      <h3 className="mt-1.5 font-serif text-xl font-medium text-[#2A1216]">
                        {offer.title}
                      </h3>
                      <p className="mt-1 font-mono text-xs font-semibold text-[#6B1222]">
                        {offer.discountText} · Code: {offer.promoCode}
                      </p>
                      <p className="mt-2 text-xs text-[#5C5254] line-clamp-2">{offer.description}</p>
                      <p className="mt-2 font-mono text-[11px] text-[#7D6C70] tabular-nums">
                        {offer.validFrom} → {offer.validUntil}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-[#EFE4E6] pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5"
                        onClick={() => openEdit(offer)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#9E1F32]"
                        onClick={() => setDeleteTarget(offer)}
                        aria-label={`Delete ${offer.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
        title={editing ? 'Edit Offer' : 'Create Seasonal Offer'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Offer Title *</label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Nepali Title</label>
              <Input value={titleNe} onChange={(e) => setTitleNe(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Festival / Tag</label>
              <Input
                required
                value={festivalTag}
                onChange={(e) => setFestivalTag(e.target.value)}
                placeholder="Dashain / Teej / Seasonal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                Discount Highlight *
              </label>
              <Input
                required
                value={discountText}
                onChange={(e) => setDiscountText(e.target.value)}
                placeholder="20% Off / Rs. 500 Off"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Promo Code *</label>
              <Input
                required
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="DASHAIN20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Valid From</label>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Valid Until</label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
          <AdminImageField label="Offer Banner Visual" value={imageUrl} onChange={setImageUrl} />
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Description *</label>
            <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center gap-6 text-xs text-[#4A3B3E]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Featured on homepage
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Published
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Offer' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Offer"
        description={`Remove "${deleteTarget?.title}" from promotions?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Client Reviews Moderation ─────────────────────────────────────────────────
export function AdminReviewsPage() {
  useDocumentMeta('Client Reviews', 'Moderate, publish, and add client testimonials.');
  const { notifySuccess, notifyError, notifyInfo } = useAdminToast();
  const { data: reviews = [], isLoading } = useGetAdminReviewsQuery();
  const [createReview, { isLoading: creating }] = useCreateAdminReviewMutation();
  const [updateReview, { isLoading: updating }] = useUpdateAdminReviewMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteAdminReviewMutation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalonReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalonReview | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [serviceName, setServiceName] = useState('Executive Haircut');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (statusFilter === 'PUBLISHED' && !r.isPublished) return false;
      if (statusFilter === 'HIDDEN' && r.isPublished) return false;
      if (
        q &&
        !r.customerName.toLowerCase().includes(q) &&
        !r.serviceName.toLowerCase().includes(q) &&
        !r.comment.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [reviews, search, statusFilter]);

  const pagination = usePagination(filtered, 8);

  const openCreate = () => {
    setEditing(null);
    setCustomerName('');
    setServiceName('Signature Beard Ritual');
    setRating(5);
    setComment('');
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (rev: SalonReview) => {
    setEditing(rev);
    setCustomerName(rev.customerName);
    setServiceName(rev.serviceName);
    setRating(rev.rating);
    setComment(rev.comment);
    setIsPublished(rev.isPublished);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customerName,
        serviceName,
        rating: Number(rating),
        comment,
        isPublished,
        isDemoReview: false,
      };
      if (editing) {
        await updateReview({ id: editing.id, data: payload }).unwrap();
        notifySuccess('Review updated', `Testimonial by ${customerName} saved.`);
      } else {
        await createReview(payload).unwrap();
        notifySuccess('Review added', `Testimonial by ${customerName} published.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const togglePublished = async (rev: SalonReview) => {
    try {
      await updateReview({ id: rev.id, data: { isPublished: !rev.isPublished } }).unwrap();
      notifyInfo(
        'Visibility updated',
        `Review by ${rev.customerName} is now ${!rev.isPublished ? 'published' : 'hidden'}.`
      );
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReview(deleteTarget.id).unwrap();
      notifySuccess('Review deleted', 'Testimonial removed permanently.');
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Client Reviews & Moderation"
        subtitle="Approve, edit, or hide client impressions shown across the salon homepage."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Review
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client name, service, or review text..."
        totalCount={filtered.length}
        itemLabel="reviews"
        filters={
          <div className="flex items-center gap-1 rounded-[4px] border border-[#E6DADC] bg-white p-1">
            {(['ALL', 'PUBLISHED', 'HIDDEN'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#6B1222] text-[#FAF8F4]'
                    : 'text-[#5C5254] hover:text-[#2A1216]'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'PUBLISHED' ? 'Published' : 'Hidden'}
              </button>
            ))}
          </div>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                    <th className="px-5 py-3 font-medium">Client & Service</th>
                    <th className="px-5 py-3 font-medium">Rating</th>
                    <th className="px-5 py-3 font-medium">Feedback</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-[#6A5A5D]">
                        No reviews match your filter.
                      </td>
                    </tr>
                  ) : (
                    pagination.paginatedItems.map((rev) => (
                      <tr key={rev.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="font-medium text-[#2A1216]">{rev.customerName}</p>
                          <p className="text-[11px] text-[#7D6C70]">{rev.serviceName}</p>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-0.5 text-[#9E1F32]">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                            ))}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-md text-[#5C5254]">
                          <p className="line-clamp-2">{rev.comment}</p>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <StatusText status={rev.isPublished ? 'PUBLISHED' : 'HIDDEN'} />
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => togglePublished(rev)}
                            >
                              {rev.isPublished ? 'Hide' : 'Publish'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => openEdit(rev)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#9E1F32]"
                              onClick={() => setDeleteTarget(rev)}
                              aria-label={`Delete review by ${rev.customerName}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
        title={editing ? 'Edit Client Review' : 'Add Client Review'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Client Name *</label>
              <Input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Service *</label>
              <Input
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Rating (1–5)</label>
            <Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              <option value={5}>5 Stars — Exceptional</option>
              <option value={4}>4 Stars — Very Good</option>
              <option value={3}>3 Stars — Good</option>
              <option value={2}>2 Stars — Fair</option>
              <option value={1}>1 Star — Needs Improvement</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Comment *</label>
            <Textarea required value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div className="flex items-center gap-6 text-xs text-[#4A3B3E]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Publish on website
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Changes' : 'Add Review'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Review"
        description={`Remove testimonial by "${deleteTarget?.customerName}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
