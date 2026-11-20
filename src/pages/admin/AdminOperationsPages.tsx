import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Bell,
  CheckCheck,
  Download,
  LogOut,
  Mail,
  MessageCircle,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  type AdminContactMessageRow,
  type AdminNotificationRow,
  type AdminPaymentRow,
  useCreateAdminNotificationMutation,
  useCreateAdminPaymentMutation,
  useCreateAdminUserMutation,
  useDeleteAdminNotificationMutation,
  useDeleteContactMessageMutation,
  useGetAdminBookingsQuery,
  useGetAdminNotificationsQuery,
  useGetAdminPaymentsQuery,
  useGetAdminProfileQuery,
  useGetAdminReportsQuery,
  useGetAdminSettingsQuery,
  useGetAdminUsersQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useSaveAdminSettingsMutation,
  useUpdateAdminPaymentMutation,
  useUpdateAdminProfileMutation,
  useUpdateAdminUserRoleMutation,
  useUpdateContactMessageStatusMutation,
} from '../../api/adminApi';
import { useLogoutSessionMutation } from '../../api/salonApi';
import { auth } from '../../lib/firebase';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { clearCredentials, updateAuthUser } from '../../store/slices/authSlice';
import type { OpeningHour, PaymentMethod, SalonSettings } from '../../types/salon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { buildWhatsAppLink, formatNpr } from '../../utils/nepal';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui/Primitives';
import {
  AdminPageHeader,
  AdminPagination,
  AdminToolbar,
  ConfirmModal,
  StatusText,
  extractApiError,
  useAdminToast,
  usePagination,
} from '../../components/admin/AdminPrimitives';

// ─── Payments & Nepal Gateway Ledger ───────────────────────────────────────────
export function AdminPaymentsPage() {
  useDocumentMeta('Payments & Settlements', 'Track Cash, eSewa, Khalti, and Fonepay NPR receipts.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: payments = [], isLoading } = useGetAdminPaymentsQuery();
  const { data: bookings = [] } = useGetAdminBookingsQuery();
  const [createPayment, { isLoading: creating }] = useCreateAdminPaymentMutation();
  const [updatePayment, { isLoading: updating }] = useUpdateAdminPaymentMutation();

  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [bookingId, setBookingId] = useState<number>(0);
  const [provider, setProvider] = useState<PaymentMethod>('CASH');
  const [amountNpr, setAmountNpr] = useState(1200);
  const [status, setStatus] = useState('VERIFIED');
  const [transactionRef, setTransactionRef] = useState('');

  const [editTarget, setEditTarget] = useState<AdminPaymentRow | null>(null);
  const [editStatus, setEditStatus] = useState('VERIFIED');
  const [editTxRef, setEditTxRef] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (providerFilter !== 'ALL' && p.provider !== providerFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (
        q &&
        !p.bookingRef.toLowerCase().includes(q) &&
        !p.customerName.toLowerCase().includes(q) &&
        !p.transactionRef.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [payments, search, providerFilter, statusFilter]);

  const pagination = usePagination(filtered, 8);

  const summary = useMemo(() => {
    const verified = payments
      .filter((p) => p.status === 'VERIFIED')
      .reduce((s, p) => s + p.amountNpr, 0);
    const pending = payments
      .filter((p) => p.status === 'INITIATED' || p.status === 'PENDING_VERIFICATION')
      .reduce((s, p) => s + p.amountNpr, 0);
    const refunded = payments
      .filter((p) => p.status === 'REFUNDED')
      .reduce((s, p) => s + p.amountNpr, 0);

    const byChannel: Record<string, number> = { CASH: 0, ESEWA: 0, KHALTI: 0, FONEPAY: 0 };
    for (const p of payments) {
      if (p.status !== 'FAILED' && p.status !== 'REFUNDED') {
        byChannel[p.provider] = (byChannel[p.provider] || 0) + p.amountNpr;
      }
    }
    return {
      verified,
      pending,
      refunded,
      chart: Object.entries(byChannel).map(([name, amountNpr]) => ({ name, amountNpr })),
    };
  }, [payments]);

  const openRecordModal = () => {
    const defaultBooking = bookings[0];
    setBookingId(defaultBooking?.id || 0);
    setAmountNpr(defaultBooking?.totalPriceNpr || 1000);
    setProvider('CASH');
    setStatus('VERIFIED');
    setTransactionRef(`DESK-${Date.now().toString().slice(-6)}`);
    setRecordModalOpen(true);
  };

  const openEditModal = (row: AdminPaymentRow) => {
    setEditTarget(row);
    setEditStatus(row.status);
    setEditTxRef(row.transactionRef);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      notifyError('Select a booking', 'Choose an appointment to attach this settlement.');
      return;
    }
    try {
      await createPayment({
        bookingId: Number(bookingId),
        provider,
        amountNpr: Number(amountNpr),
        status,
        transactionRef,
      }).unwrap();
      notifySuccess('Payment recorded', `${formatNpr(amountNpr)} logged via ${provider}.`);
      setRecordModalOpen(false);
    } catch (err) {
      notifyError('Record failed', extractApiError(err));
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await updatePayment({
        id: editTarget.id,
        status: editStatus,
        transactionRef: editTxRef,
      }).unwrap();
      notifySuccess('Settlement updated', `${editTarget.bookingRef} marked ${editStatus}.`);
      setEditTarget(null);
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments & Settlements"
        subtitle="Audit Cash at Salon, eSewa, Khalti, and Fonepay QR transactions synced with booking statuses."
        actions={
          <Button variant="primary" size="sm" onClick={openRecordModal}>
            <Plus className="h-4 w-4" /> Record Settlement
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <Card className="p-5">
            <p className="text-xs text-[#6A5A5D]">Verified Collected</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#15803D] tabular-nums">
              {formatNpr(summary.verified)}
            </p>
            <p className="mt-1 text-[11px] text-[#7D6C70]">Confirmed receipts</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-[#6A5A5D]">Pending / Initiated</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#B45309] tabular-nums">
              {formatNpr(summary.pending)}
            </p>
            <p className="mt-1 text-[11px] text-[#7D6C70]">Awaiting settlement</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-[#6A5A5D]">Refunded Volume</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#9E1F32] tabular-nums">
              {formatNpr(summary.refunded)}
            </p>
            <p className="mt-1 text-[11px] text-[#7D6C70]">Reversed receipts</p>
          </Card>
        </div>

        <Card className="p-5 lg:col-span-5">
          <p className="font-serif text-lg text-[#2A1216] mb-2">Volume by Channel (NPR)</p>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5C5254' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5C5254' }} />
                <Tooltip formatter={(val) => [formatNpr(Number(val ?? 0)), 'Volume']} />
                <Bar dataKey="amountNpr" fill="#6B1222" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search booking ref, client, or tx ref..."
        totalCount={filtered.length}
        itemLabel="transactions"
        filters={
          <div className="flex flex-wrap gap-2">
            <Select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="h-10 w-36 text-xs"
              aria-label="Filter provider"
            >
              <option value="ALL">All Channels</option>
              <option value="CASH">Cash</option>
              <option value="ESEWA">eSewa</option>
              <option value="KHALTI">Khalti</option>
              <option value="FONEPAY">Fonepay</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-44 text-xs"
              aria-label="Filter payment status"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="INITIATED">Initiated</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                    <th className="px-5 py-3 font-medium">Booking Ref</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Channel</th>
                    <th className="px-5 py-3 font-medium">Transaction Ref</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-[#6A5A5D]">
                        No payment transactions match your filter.
                      </td>
                    </tr>
                  ) : (
                    pagination.paginatedItems.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3 font-mono text-[#8B1A2D] whitespace-nowrap">
                          {p.bookingRef}
                        </td>
                        <td className="px-5 py-3 font-medium text-[#2A1216] whitespace-nowrap">
                          {p.customerName}
                        </td>
                        <td className="px-5 py-3 text-[#5C5254] whitespace-nowrap">{p.provider}</td>
                        <td className="px-5 py-3 font-mono text-[11px] text-[#6A5A5D] whitespace-nowrap">
                          {p.transactionRef}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <StatusText status={p.status} />
                        </td>
                        <td className="px-5 py-3 font-mono text-right font-medium text-[#2A1216] tabular-nums whitespace-nowrap">
                          {formatNpr(p.amountNpr)}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => openEditModal(p)}
                          >
                            Update
                          </Button>
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

      {/* Record Manual Payment Modal */}
      <Modal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Manual Settlement"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Booking *</label>
            <Select
              value={bookingId}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setBookingId(nextId);
                const found = bookings.find((b) => b.id === nextId);
                if (found) setAmountNpr(found.totalPriceNpr);
              }}
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bookingRef} — {b.customerName} ({formatNpr(b.totalPriceNpr)})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Channel</label>
              <Select
                value={provider}
                onChange={(e) => setProvider(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash at Salon</option>
                <option value="ESEWA">eSewa</option>
                <option value="KHALTI">Khalti</option>
                <option value="FONEPAY">Fonepay QR</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Amount (NPR) *</label>
              <Input
                type="number"
                required
                min={0}
                value={amountNpr}
                onChange={(e) => setAmountNpr(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="VERIFIED">Verified / Paid</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="INITIATED">Initiated</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                Transaction Ref *
              </label>
              <Input
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Payment Status Modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Update Settlement — ${editTarget?.bookingRef || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Status</label>
            <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="VERIFIED">Verified (Marks Booking Paid)</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="INITIATED">Initiated</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
              Gateway / Desk Reference
            </label>
            <Input value={editTxRef} onChange={(e) => setEditTxRef(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={updating}>
              {updating ? 'Saving...' : 'Update Settlement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Notifications & Contact Inquiries Center ──────────────────────────────────
export function AdminNotificationsPage() {
  useDocumentMeta('Notifications & Inquiries', 'Manage desk alerts and public contact inquiries.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data, isLoading } = useGetAdminNotificationsQuery();
  const [createNotif, { isLoading: creatingNotif }] = useCreateAdminNotificationMutation();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const [deleteNotif, { isLoading: deletingNotif }] = useDeleteAdminNotificationMutation();
  const [updateMsgStatus] = useUpdateContactMessageStatusMutation();
  const [deleteMsg, { isLoading: deletingMsg }] = useDeleteContactMessageMutation();

  const [activeTab, setActiveTab] = useState<'ALERTS' | 'INQUIRIES'>('ALERTS');
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [channel, setChannel] = useState('IN_APP');
  const [recipient, setRecipient] = useState('Admin Desk');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [deleteNotifTarget, setDeleteNotifTarget] = useState<AdminNotificationRow | null>(null);
  const [deleteMsgTarget, setDeleteMsgTarget] = useState<AdminContactMessageRow | null>(null);

  const notificationsList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.notifications || []).filter((n) => {
      if (unreadOnly && n.isRead) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data?.notifications, search, unreadOnly]);

  const inquiriesList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.contactMessages || []).filter((m) => {
      if (
        q &&
        !m.fullName.toLowerCase().includes(q) &&
        !m.subject.toLowerCase().includes(q) &&
        !m.message.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [data?.contactMessages, search]);

  const notifPagination = usePagination(notificationsList, 8);
  const msgPagination = usePagination(inquiriesList, 8);

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
      notifySuccess('All caught up', 'Every notification marked as read.');
    } catch (err) {
      notifyError('Action failed', extractApiError(err));
    }
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNotif({
        type: 'MANUAL_DISPATCH',
        channel,
        recipient,
        title,
        message,
      }).unwrap();
      notifySuccess('Notification logged', `Dispatched via ${channel}.`);
      setComposeOpen(false);
      setTitle('');
      setMessage('');
    } catch (err) {
      notifyError('Dispatch failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications & Inquiries"
        subtitle="Respond to Birgunj client inquiries and review live booking & system alerts."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markingAll}>
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </Button>
            <Button variant="primary" size="sm" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4" /> Log Alert
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[4px] border border-[#E6DADC] bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab('ALERTS')}
            className={`inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-xs font-medium cursor-pointer ${
              activeTab === 'ALERTS'
                ? 'bg-[#6B1222] text-[#FAF8F4]'
                : 'text-[#5C5254] hover:text-[#2A1216]'
            }`}
          >
            <Bell className="h-3.5 w-3.5" /> System Alerts ({data?.notifications?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INQUIRIES')}
            className={`inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-xs font-medium cursor-pointer ${
              activeTab === 'INQUIRIES'
                ? 'bg-[#6B1222] text-[#FAF8F4]'
                : 'text-[#5C5254] hover:text-[#2A1216]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Contact Inquiries ({data?.contactMessages?.length || 0})
          </button>
        </div>

        {activeTab === 'ALERTS' && (
          <label className="inline-flex items-center gap-2 text-xs text-[#4A3B3E] cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="accent-[#6B1222]"
            />
            Unread only
          </label>
        )}
      </div>

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          activeTab === 'ALERTS'
            ? 'Search alerts by title or details...'
            : 'Search inquiries by sender or subject...'
        }
        totalCount={activeTab === 'ALERTS' ? notificationsList.length : inquiriesList.length}
        itemLabel={activeTab === 'ALERTS' ? 'alerts' : 'inquiries'}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : activeTab === 'ALERTS' ? (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[#EFE4E6]">
            {notifPagination.paginatedItems.length === 0 ? (
              <p className="p-10 text-center text-sm text-[#6A5A5D]">No notifications found.</p>
            ) : (
              notifPagination.paginatedItems.map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    n.isRead ? 'bg-white' : 'bg-[#FAF3F4]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-[#7D6C70]">
                      <span>{n.channel}</span>
                      <span>·</span>
                      <span>{n.recipient}</span>
                      <span>·</span>
                      <StatusText status={n.isRead ? 'SENT' : 'NEW'} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#2A1216]">{n.title}</p>
                    <p className="mt-0.5 text-xs text-[#5C5254]">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => markRead(n.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#9E1F32]"
                      onClick={() => setDeleteNotifTarget(n)}
                      aria-label="Delete alert"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <AdminPagination
            page={notifPagination.page}
            totalPages={notifPagination.totalPages}
            totalItems={notifPagination.totalItems}
            pageSize={notifPagination.pageSize}
            onPageChange={notifPagination.setPage}
            onPageSizeChange={notifPagination.setPageSize}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[#EFE4E6]">
            {msgPagination.paginatedItems.length === 0 ? (
              <p className="p-10 text-center text-sm text-[#6A5A5D]">No contact inquiries yet.</p>
            ) : (
              msgPagination.paginatedItems.map((msg) => (
                <div key={msg.id} className="p-5 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2A1216]">{msg.subject}</p>
                      <p className="text-xs text-[#6A5A5D]">
                        {msg.fullName} · <span className="font-mono">{msg.phone}</span>
                        {msg.email ? ` · ${msg.email}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={msg.status}
                        onChange={async (e) => {
                          try {
                            await updateMsgStatus({
                              id: msg.id,
                              status: e.target.value as 'NEW' | 'REPLIED' | 'ARCHIVED',
                            }).unwrap();
                            notifySuccess('Inquiry status updated');
                          } catch (err) {
                            notifyError('Update failed', extractApiError(err));
                          }
                        }}
                        className="h-8 w-32 text-xs py-0"
                        aria-label="Inquiry status"
                      >
                        <option value="NEW">New</option>
                        <option value="REPLIED">Replied</option>
                        <option value="ARCHIVED">Archived</option>
                      </Select>
                      <a
                        href={buildWhatsAppLink(
                          msg.phone,
                          `Namaste ${msg.fullName}, thank you for contacting The Beard Shop Beauty Salon regarding "${msg.subject}".`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#E6DADC] px-2.5 text-xs font-medium text-[#6B1222] hover:bg-[#6B1222]/5"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#9E1F32]"
                        onClick={() => setDeleteMsgTarget(msg)}
                        aria-label="Delete inquiry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[#4A3B3E]">{msg.message}</p>
                </div>
              ))
            )}
          </div>
          <AdminPagination
            page={msgPagination.page}
            totalPages={msgPagination.totalPages}
            totalItems={msgPagination.totalItems}
            pageSize={msgPagination.pageSize}
            onPageChange={msgPagination.setPage}
            onPageSizeChange={msgPagination.setPageSize}
          />
        </Card>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Dispatch Desk Alert" maxWidth="max-w-md">
        <form onSubmit={handleCompose} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Channel</label>
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="IN_APP">In-App Desk</option>
                <option value="WHATSAPP">WhatsApp Log</option>
                <option value="SMS">SMS Ready Log</option>
                <option value="EMAIL">Email Log</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Recipient *</label>
              <Input required value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Title *</label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Message *</label>
            <Textarea required value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creatingNotif}>
              {creatingNotif ? 'Sending...' : 'Log Notification'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteNotifTarget)}
        title="Delete Notification"
        description={`Remove "${deleteNotifTarget?.title}"?`}
        loading={deletingNotif}
        onConfirm={async () => {
          if (!deleteNotifTarget) return;
          try {
            await deleteNotif(deleteNotifTarget.id).unwrap();
            notifySuccess('Notification deleted');
            setDeleteNotifTarget(null);
          } catch (err) {
            notifyError('Delete failed', extractApiError(err));
          }
        }}
        onClose={() => setDeleteNotifTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteMsgTarget)}
        title="Delete Contact Inquiry"
        description={`Permanently delete inquiry from "${deleteMsgTarget?.fullName}"?`}
        loading={deletingMsg}
        onConfirm={async () => {
          if (!deleteMsgTarget) return;
          try {
            await deleteMsg(deleteMsgTarget.id).unwrap();
            notifySuccess('Inquiry deleted');
            setDeleteMsgTarget(null);
          } catch (err) {
            notifyError('Delete failed', extractApiError(err));
          }
        }}
        onClose={() => setDeleteMsgTarget(null)}
      />
    </div>
  );
}

// ─── Reports & CSV Export ──────────────────────────────────────────────────────
export function AdminReportsPage() {
  useDocumentMeta('Reports & Analytics', 'Revenue reports, staff utilization, and CSV export.');
  const { notifySuccess, notifyError } = useAdminToast();
  const token = useAppSelector((s) => s.auth.token);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useGetAdminReportsQuery(period);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.bookings || []).filter(
      (b) =>
        !q ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
    );
  }, [data?.bookings, search]);

  const pagination = usePagination(filteredBookings, 8);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}&format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-beard-shop-${period}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notifySuccess('CSV exported', `Downloaded ${period} ledger report.`);
    } catch {
      notifyError('Export failed', 'Could not download CSV report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Financial & Staff Reports"
        subtitle="Analyze salon gross revenue, collected cash/wallets, service demand, and specialist performance."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-[4px] border border-[#E6DADC] bg-white p-1">
              {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-[3px] px-3 py-1.5 text-xs font-medium capitalize cursor-pointer ${
                    period === p
                      ? 'bg-[#6B1222] text-[#FAF8F4]'
                      : 'text-[#5C5254] hover:text-[#2A1216]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button variant="primary" size="sm" onClick={handleExportCsv} disabled={exporting}>
              <Download className="h-4 w-4" /> {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs text-[#6A5A5D]">Total Bookings</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#2A1216] tabular-nums">
                {data.totalBookings}
              </p>
              <p className="mt-1 text-[11px] text-[#7D6C70]">
                {data.completedBookings} completed · {data.cancelledBookings} cancelled
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[#6A5A5D]">Gross Scheduled Value</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#2A1216] tabular-nums">
                {formatNpr(data.grossRevenueNpr)}
              </p>
              <p className="mt-1 text-[11px] text-[#7D6C70]">Excludes cancelled/rejected</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[#6A5A5D]">Collected Revenue</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#15803D] tabular-nums">
                {formatNpr(data.collectedRevenueNpr)}
              </p>
              <p className="mt-1 text-[11px] text-[#7D6C70]">Verified paid bookings</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[#6A5A5D]">Collection Ratio</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#6B1222] tabular-nums">
                {data.grossRevenueNpr > 0
                  ? `${Math.round((data.collectedRevenueNpr / data.grossRevenueNpr) * 100)}%`
                  : '0%'}
              </p>
              <p className="mt-1 text-[11px] text-[#7D6C70]">Settled vs scheduled</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-serif text-xl text-[#2A1216] mb-4">Service Revenue (NPR)</h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.servicePerformance.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#5C5254' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={135}
                      tick={{ fontSize: 11, fill: '#2A1216' }}
                    />
                    <Tooltip formatter={(val) => [formatNpr(Number(val ?? 0)), 'Revenue']} />
                    <Bar dataKey="revenueNpr" fill="#6B1222" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-serif text-xl text-[#2A1216] mb-4">Specialist Revenue (NPR)</h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.staffPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                    <XAxis
                      dataKey="fullName"
                      tick={{ fontSize: 10, fill: '#5C5254' }}
                      tickFormatter={(v) => String(v).split(' ')[0]}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#5C5254' }} />
                    <Tooltip formatter={(val) => [formatNpr(Number(val ?? 0)), 'Revenue']} />
                    <Bar dataKey="revenueNpr" fill="#9E1F32" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-[#E6DADC] p-5">
              <AdminToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Filter ledger by booking ref, client, or status..."
                totalCount={filteredBookings.length}
                itemLabel="bookings"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Date & Time</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.map((bk) => (
                    <tr key={bk.id} className="hover:bg-[#FAF8F4]/70">
                      <td className="px-5 py-3 font-mono text-[#8B1A2D] whitespace-nowrap">
                        {bk.bookingRef}
                      </td>
                      <td className="px-5 py-3 font-mono tabular-nums text-[#5C5254] whitespace-nowrap">
                        {bk.appointmentDate} · {bk.startTime}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#2A1216] whitespace-nowrap">
                        {bk.customerName}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <StatusText status={bk.status} />
                      </td>
                      <td className="px-5 py-3 text-[#5C5254] whitespace-nowrap">
                        {bk.paymentMethod} · <StatusText status={bk.paymentStatus} />
                      </td>
                      <td className="px-5 py-3 font-mono text-right font-medium text-[#2A1216] tabular-nums whitespace-nowrap">
                        {formatNpr(bk.totalPriceNpr)}
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
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Editable Website Settings & Opening Hours ─────────────────────────────────
export function AdminSettingsPage() {
  useDocumentMeta('Website Settings', 'Edit business profile, Birgunj location, and opening hours.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: settings, isLoading } = useGetAdminSettingsQuery();
  const [saveSettings, { isLoading: saving }] = useSaveAdminSettingsMutation();

  const [form, setForm] = useState<Partial<SalonSettings>>({});
  const [hours, setHours] = useState<OpeningHour[]>([]);

  useEffect(() => {
    if (!settings) return;
    setForm(settings);
    setHours(
      settings.openingHours || [
        { day: 'Sunday', open: '10:00', close: '20:00', closed: false },
        { day: 'Monday', open: '10:00', close: '20:00', closed: false },
        { day: 'Tuesday', open: '10:00', close: '20:00', closed: false },
        { day: 'Wednesday', open: '10:00', close: '20:00', closed: false },
        { day: 'Thursday', open: '10:00', close: '20:00', closed: false },
        { day: 'Friday', open: '10:00', close: '20:00', closed: false },
        { day: 'Saturday', open: '10:00', close: '20:00', closed: false },
      ]
    );
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        businessName: form.businessName,
        tagline: form.tagline,
        taglineNe: form.taglineNe,
        address: form.address,
        city: form.city,
        province: form.province,
        country: form.country,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        phone: form.phone,
        whatsappNumber: form.whatsappNumber,
        email: form.email,
        instagramUrl: form.instagramUrl,
        facebookUrl: form.facebookUrl,
        googleMapsUrl: form.googleMapsUrl,
        showBikramSambat: Boolean(form.showBikramSambat),
        cancellationPolicy: form.cancellationPolicy,
        openingHours: hours,
      }).unwrap();
      notifySuccess('Settings saved', 'Public website & booking engine updated immediately.');
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <AdminPageHeader
        title="Website & Business Settings"
        subtitle="All public contact info, map coordinates, policies, and opening hours are live-editable here."
        actions={
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-7 space-y-4">
          <h2 className="font-serif text-xl text-[#2A1216] border-b border-[#E6DADC] pb-3">
            Brand & Contact Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Business Name</label>
              <Input
                value={form.businessName || ''}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Email</label>
              <Input
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Tagline (EN)</label>
              <Input
                value={form.tagline || ''}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Tagline (NE)</label>
              <Input
                value={form.taglineNe || ''}
                onChange={(e) => setForm({ ...form, taglineNe: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Phone</label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                WhatsApp Digits (977...)
              </label>
              <Input
                value={form.whatsappNumber || ''}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Street Address</label>
            <Input
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">City</label>
              <Input
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Province</label>
              <Input
                value={form.province || ''}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Latitude</label>
              <Input
                type="number"
                step="0.000001"
                value={form.latitude ?? 27.014045}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Longitude</label>
              <Input
                type="number"
                step="0.000001"
                value={form.longitude ?? 84.8482375}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Instagram URL</label>
              <Input
                value={form.instagramUrl || ''}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Google Maps URL</label>
              <Input
                value={form.googleMapsUrl || ''}
                onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
              Cancellation & Reschedule Policy
            </label>
            <Textarea
              value={form.cancellationPolicy || ''}
              onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-[#4A3B3E] cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.showBikramSambat)}
              onChange={(e) => setForm({ ...form, showBikramSambat: e.target.checked })}
              className="accent-[#6B1222]"
            />
            Display Bikram Sambat (B.S.) dates alongside AD dates
          </label>
        </Card>

        <Card className="p-6 lg:col-span-5 space-y-4">
          <h2 className="font-serif text-xl text-[#2A1216] border-b border-[#E6DADC] pb-3">
            Salon Opening Hours (NPT)
          </h2>
          <p className="text-xs text-[#6A5A5D]">
            Controls public footer hours and the booking engine's open/close window.
          </p>
          <div className="divide-y divide-[#EFE4E6]">
            {hours.map((row, idx) => (
              <div key={row.day} className="grid grid-cols-12 items-center gap-2 py-2.5">
                <div className="col-span-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!row.closed}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((h, i) => (i === idx ? { ...h, closed: !e.target.checked } : h))
                      )
                    }
                    className="accent-[#6B1222]"
                  />
                  <span className="text-xs font-medium text-[#2A1216]">{row.day}</span>
                </div>
                <div className="col-span-4">
                  <Input
                    type="time"
                    disabled={row.closed}
                    value={row.open}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((h, i) => (i === idx ? { ...h, open: e.target.value } : h))
                      )
                    }
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    type="time"
                    disabled={row.closed}
                    value={row.close}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((h, i) => (i === idx ? { ...h, close: e.target.value } : h))
                      )
                    }
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </form>
  );
}

// ─── Users, Roles & Security Audit Trail ───────────────────────────────────────
export function AdminUsersPage() {
  useDocumentMeta('Users & Roles', 'Manage staff RBAC access and review audit trail.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data, isLoading } = useGetAdminUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateAdminUserMutation();
  const [updateRole] = useUpdateAdminUserRoleMutation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('MANAGER');

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.users || []).filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data?.users, search, roleFilter]);

  const filteredLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return (data?.auditLogs || []).filter(
      (l) =>
        !q ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q)
    );
  }, [data?.auditLogs, auditSearch]);

  const logPagination = usePagination(filteredLogs, 8);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({ email, fullName, phone, role }).unwrap();
      notifySuccess('Staff authorized', `${email} pre-authorized as ${role}.`);
      setInviteOpen(false);
      setEmail('');
      setFullName('');
      setPhone('');
    } catch (err) {
      notifyError('Invite failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Users, Roles & Audit Logs"
        subtitle="Pre-authorize salon staff emails, enforce RBAC permissions, and monitor security audit events."
        actions={
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Authorize Staff
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[#E6DADC] p-5">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search staff by name or email..."
            totalCount={filteredUsers.length}
            itemLabel="accounts"
            filters={
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 w-44 text-xs"
                aria-label="Filter role"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="CUSTOMER">Customer</option>
              </Select>
            }
          />
        </div>
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                  <th className="px-5 py-3 font-medium">Staff Member</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Account Status</th>
                  <th className="px-5 py-3 font-medium text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE4E6]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F4]/70">
                    <td className="px-5 py-3 font-medium text-[#2A1216] whitespace-nowrap">
                      {u.fullName}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#5C5254] whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Select
                        value={u.role}
                        onChange={async (e) => {
                          try {
                            await updateRole({ id: u.id, role: e.target.value }).unwrap();
                            notifySuccess('Role updated', `${u.fullName} is now ${e.target.value}.`);
                          } catch (err) {
                            notifyError('Role update failed', extractApiError(err));
                          }
                        }}
                        className="h-8 w-40 py-0 text-xs"
                        aria-label={`Role for ${u.fullName}`}
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                      </Select>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusText status={u.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={async () => {
                          try {
                            await updateRole({
                              id: u.id,
                              role: u.role,
                              isActive: u.isActive === false,
                            }).unwrap();
                            notifySuccess(
                              u.isActive === false ? 'Account reactivated' : 'Account suspended'
                            );
                          } catch (err) {
                            notifyError('Status change failed', extractApiError(err));
                          }
                        }}
                      >
                        {u.isActive === false ? 'Reactivate' : 'Suspend'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Audit Trail */}
      <Card className="overflow-hidden">
        <div className="border-b border-[#E6DADC] p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#6B1222]" />
            <h2 className="font-serif text-xl text-[#2A1216]">Security Audit Trail</h2>
          </div>
          <Input
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder="Filter audit events..."
            className="h-9 sm:w-64 text-xs"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Resource</th>
                <th className="px-5 py-3 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE4E6]">
              {logPagination.paginatedItems.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF8F4]/70">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="font-medium text-[#2A1216]">{log.actorEmail}</span>
                    <span className="ml-2 text-[#7D6C70]">({log.actorRole})</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[#8B1A2D] whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-5 py-3 text-[#5C5254] whitespace-nowrap">
                    {log.entityType} #{log.entityId}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[#7D6C70] tabular-nums whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-NP', {
                      timeZone: 'Asia/Kathmandu',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={logPagination.page}
          totalPages={logPagination.totalPages}
          totalItems={logPagination.totalItems}
          pageSize={logPagination.pageSize}
          onPageChange={logPagination.setPage}
          onPageSizeChange={logPagination.setPageSize}
        />
      </Card>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Authorize Staff Account" maxWidth="max-w-md">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Full Name *</label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Google / Login Email *</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@thebeardshop.np"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Assigned Role</label>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? 'Authorizing...' : 'Authorize Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Personal Staff Profile ────────────────────────────────────────────────────
export function AdminProfilePage() {
  useDocumentMeta('My Profile', 'Manage your staff profile and recent administrative activity.');
  const { notifySuccess, notifyError } = useAdminToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, isLoading } = useGetAdminProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateAdminProfileMutation();
  const [logoutSession] = useLogoutSessionMutation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!data?.user) return;
    setFullName(data.user.fullName || '');
    setPhone(data.user.phone || '');
  }, [data]);

  const activityPagination = usePagination(data?.recentActivity || [], 6);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({ fullName, phone }).unwrap();
      dispatch(updateAuthUser({ fullName: updated.fullName, phone: updated.phone }));
      notifySuccess('Profile saved', 'Your display name and phone number are updated.');
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  const handleSignOut = async () => {
    await logoutSession().unwrap().catch(() => {});
    await signOut(auth).catch(() => {});
    dispatch(clearCredentials());
    navigate('/admin/login');
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Staff Profile"
        subtitle="Manage your account details and review your personal security activity log."
        actions={
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="p-6 lg:col-span-5">
            <h2 className="font-serif text-xl text-[#2A1216] border-b border-[#E6DADC] pb-3 mb-4">
              Account Details
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Email</label>
                <Input value={data?.user.email || ''} disabled />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Assigned Role</label>
                <Input value={data?.user.role?.replace(/_/g, ' ') || ''} disabled />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Full Name *</label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden lg:col-span-7">
            <div className="border-b border-[#E6DADC] px-6 py-4">
              <h2 className="font-serif text-xl text-[#2A1216]">My Recent Activity</h2>
            </div>
            <div className="divide-y divide-[#EFE4E6]">
              {activityPagination.paginatedItems.length === 0 ? (
                <p className="p-8 text-center text-xs text-[#6A5A5D]">
                  No administrative actions logged yet.
                </p>
              ) : (
                activityPagination.paginatedItems.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 text-xs"
                  >
                    <div>
                      <p className="font-mono font-medium text-[#8B1A2D]">{act.action}</p>
                      <p className="text-[#6A5A5D]">
                        {act.entityType} #{act.entityId}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#7D6C70] tabular-nums">
                      {new Date(act.createdAt).toLocaleString('en-NP', {
                        timeZone: 'Asia/Kathmandu',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <AdminPagination
              page={activityPagination.page}
              totalPages={activityPagination.totalPages}
              totalItems={activityPagination.totalItems}
              pageSize={activityPagination.pageSize}
              onPageChange={activityPagination.setPage}
              onPageSizeChange={activityPagination.setPageSize}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
