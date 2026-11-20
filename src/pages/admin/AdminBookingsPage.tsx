import { useMemo, useState } from 'react';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import {
  useCreateAdminBookingMutation,
  useDeleteAdminBookingMutation,
  useGetAdminBookingsQuery,
  useGetAdminServicesQuery,
  useGetAdminTeamQuery,
  useUpdateAdminBookingMutation,
} from '../../api/adminApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import type { BookingRecord, PaymentMethod } from '../../types/salon';
import { buildWhatsAppLink, formatNpr } from '../../utils/nepal';
import { Button, Card, Input, Modal, Select, Skeleton, Textarea } from '../../components/ui/Primitives';
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

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'];

export function AdminBookingsPage() {
  useDocumentMeta('Booking Management', 'Approve, reschedule, complete, or create client appointments.');
  const { notifySuccess, notifyError } = useAdminToast();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: bookings = [], isLoading } = useGetAdminBookingsQuery({
    status: statusFilter,
    q: search,
  });
  const { data: services = [] } = useGetAdminServicesQuery();
  const { data: team = [] } = useGetAdminTeamQuery();

  const [createBooking, { isLoading: creating }] = useCreateAdminBookingMutation();
  const [updateBooking, { isLoading: updating }] = useUpdateAdminBookingMutation();
  const [deleteBooking, { isLoading: deleting }] = useDeleteAdminBookingMutation();

  // Manage modal state
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStaffId, setEditStaffId] = useState<string>('');
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Create Walk-in / Desk booking modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('+977');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('11:00');
  const [newStaffId, setNewStaffId] = useState<string>('');
  const [newServiceIds, setNewServiceIds] = useState<number[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('CASH');
  const [newPaymentStatus, setNewPaymentStatus] = useState('UNPAID');
  const [newNotes, setNewNotes] = useState('');

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<BookingRecord | null>(null);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (paymentFilter !== 'ALL' && b.paymentStatus !== paymentFilter) return false;
      if (dateFilter && b.appointmentDate !== dateFilter) return false;
      return true;
    });
  }, [bookings, paymentFilter, dateFilter]);

  const pagination = usePagination(filteredBookings, 8);

  const handleStatusChange = async (id: number, ref: string, status: string) => {
    try {
      await updateBooking({ id, status }).unwrap();
      notifySuccess(`Booking ${ref} updated`, `Status set to ${status.replace('_', ' ')}.`);
    } catch (err) {
      notifyError('Failed to update status', extractApiError(err));
    }
  };

  const handleMarkPaid = async (id: number, ref: string) => {
    try {
      await updateBooking({ id, paymentStatus: 'PAID' }).unwrap();
      notifySuccess(`Payment settled`, `${ref} marked as PAID.`);
    } catch (err) {
      notifyError('Payment update failed', extractApiError(err));
    }
  };

  const openManageModal = (bk: BookingRecord) => {
    setActiveBooking(bk);
    setEditDate(bk.appointmentDate);
    setEditTime(bk.startTime);
    setEditStaffId(bk.staffId ? String(bk.staffId) : '');
    setEditStatus(bk.status);
    setEditPaymentStatus(bk.paymentStatus);
    setEditNotes(bk.notes || '');
  };

  const handleSaveManage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;
    try {
      await updateBooking({
        id: activeBooking.id,
        appointmentDate: editDate,
        startTime: editTime,
        staffId: editStaffId ? Number(editStaffId) : null,
        status: editStatus,
        paymentStatus: editPaymentStatus,
        notes: editNotes,
      }).unwrap();
      notifySuccess('Appointment saved', `${activeBooking.bookingRef} has been updated.`);
      setActiveBooking(null);
    } catch (err) {
      notifyError('Could not update booking', extractApiError(err));
    }
  };

  const toggleNewService = (id: number) => {
    setNewServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTotalNpr = services
    .filter((s) => newServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.priceNpr, 0);

  const handleCreateDeskBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newServiceIds.length === 0) {
      notifyError('Select a service', 'Choose at least one salon service for this appointment.');
      return;
    }
    try {
      const created = await createBooking({
        customerName: newCustomerName,
        customerPhone: newCustomerPhone,
        customerEmail: newCustomerEmail,
        appointmentDate: newDate,
        startTime: newTime,
        staffId: newStaffId ? Number(newStaffId) : null,
        serviceIds: newServiceIds,
        paymentMethod: newPaymentMethod,
        paymentStatus: newPaymentStatus,
        status: 'APPROVED',
        notes: newNotes,
      }).unwrap();
      notifySuccess('Walk-in booking created', `Reference ${created.bookingRef} confirmed.`);
      setCreateOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('+977');
      setNewCustomerEmail('');
      setNewServiceIds([]);
      setNewNotes('');
    } catch (err) {
      notifyError('Could not create booking', extractApiError(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBooking(deleteTarget.id).unwrap();
      notifySuccess('Booking deleted', `${deleteTarget.bookingRef} was removed.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Booking Management"
        subtitle="Create walk-in appointments, approve online requests, reschedule slots, reassign specialists, and settle payments."
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Desk Booking
          </Button>
        }
      />

      {/* Status Segmented Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setStatusFilter(tab);
              pagination.setPage(1);
            }}
            className={`shrink-0 rounded-[4px] px-3.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === tab
                ? 'bg-[#6B1222] text-[#FAF8F4]'
                : 'bg-white border border-[#E6DADC] text-[#5C5852] hover:border-[#9E1F32] hover:text-[#2A0810]'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search & Additional Filters */}
      <AdminToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search ref, client, phone, or stylist..."
        totalCount={filteredBookings.length}
        itemLabel="appointments"
        filters={
          <>
            <Select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                pagination.setPage(1);
              }}
              className="h-10 w-44 text-xs"
              aria-label="Filter by payment status"
            >
              <option value="ALL">All Payments</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                pagination.setPage(1);
              }}
              className="h-10 w-40 text-xs"
              aria-label="Filter by appointment date"
            />
            {dateFilter && (
              <Button size="sm" variant="ghost" onClick={() => setDateFilter('')}>
                Clear Date
              </Button>
            )}
          </>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-serif text-2xl text-[#2A0810]">No matching appointments</p>
            <p className="mt-1 text-xs text-[#6A655D]">
              Adjust your search filters or log a new desk appointment.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New Desk Booking
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A655D]">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Schedule (NPT)</th>
                    <th className="px-4 py-3 font-medium">Specialist</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.map((bk) => (
                    <tr key={bk.id} className="hover:bg-[#FAF8F4]/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[#8B1A2D] whitespace-nowrap">
                        {bk.bookingRef}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#2A0810]">{bk.customerName}</p>
                        <p className="text-[11px] text-[#777777] tabular-nums">{bk.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono tabular-nums whitespace-nowrap text-[#33312E]">
                        {bk.appointmentDate} · {bk.startTime}
                      </td>
                      <td className="px-4 py-3.5 text-[#5C5852] whitespace-nowrap">
                        {bk.staffName}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusText status={bk.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[#5C5852]">
                        <span>{bk.paymentMethod}</span>
                        <span className="mx-1.5 text-[#B5AEA2]">·</span>
                        <StatusText status={bk.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-right font-medium tabular-nums text-[#2A0810] whitespace-nowrap">
                        {formatNpr(bk.totalPriceNpr)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {bk.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-8 px-2.5 text-[11px]"
                                disabled={updating}
                                onClick={() => handleStatusChange(bk.id, bk.bookingRef, 'APPROVED')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[11px]"
                                disabled={updating}
                                onClick={() => handleStatusChange(bk.id, bk.bookingRef, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {bk.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="gold"
                              className="h-8 px-2.5 text-[11px]"
                              disabled={updating}
                              onClick={() => handleStatusChange(bk.id, bk.bookingRef, 'COMPLETED')}
                            >
                              Complete
                            </Button>
                          )}
                          {bk.paymentStatus !== 'PAID' && bk.status !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              variant="subtle"
                              className="h-8 px-2.5 text-[11px]"
                              disabled={updating}
                              onClick={() => handleMarkPaid(bk.id, bk.bookingRef)}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-[11px]"
                            onClick={() => openManageModal(bk)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label={`Delete ${bk.bookingRef}`}
                            onClick={() => setDeleteTarget(bk)}
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

      {/* New Desk / Walk-in Booking Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Walk-In / Desk Booking"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateDeskBooking} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Client Name *</label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Phone (+977) *
              </label>
              <Input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="+97798XXXXXXXX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Date *</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Start Time (NPT) *
              </label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Specialist</label>
              <Select value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)}>
                <option value="">Any Available Specialist</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#4A4640]">Select Services *</label>
              <span className="font-mono text-xs text-[#8B1A2D] tabular-nums">
                Total: {formatNpr(selectedTotalNpr)}
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-[4px] border border-[#DCCBD0] bg-white divide-y divide-[#EFE4E6]">
              {services.map((svc) => {
                const checked = newServiceIds.includes(svc.id);
                return (
                  <label
                    key={svc.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-[#FAF8F4]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleNewService(svc.id)}
                        className="accent-[#111111]"
                      />
                      <span className="truncate font-medium text-[#2A0810]">{svc.name}</span>
                      <span className="text-[#777777] shrink-0">({svc.durationMinutes}m)</span>
                    </span>
                    <span className="font-mono tabular-nums text-[#5C5852] shrink-0">
                      {formatNpr(svc.priceNpr)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">Email</label>
              <Input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Payment Method
              </label>
              <Select
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash at Salon</option>
                <option value="ESEWA">eSewa</option>
                <option value="KHALTI">Khalti</option>
                <option value="FONEPAY">Fonepay QR</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4640] mb-1">
                Payment Status
              </label>
              <Select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A4640] mb-1">Desk Notes</label>
            <Textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Stylist preferences or special instructions..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? 'Scheduling...' : 'Confirm Desk Booking'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit & Reschedule Modal */}
      <Modal
        open={Boolean(activeBooking)}
        onClose={() => setActiveBooking(null)}
        title={`Manage ${activeBooking?.bookingRef || ''}`}
      >
        {activeBooking && (
          <form onSubmit={handleSaveManage} className="space-y-4 text-sm">
            <div className="rounded-[4px] border border-[#E6DADC] bg-white p-3.5 text-xs space-y-1">
              <p className="font-medium text-sm text-[#2A0810]">{activeBooking.customerName}</p>
              <p className="text-[#5C5852] tabular-nums">
                {activeBooking.customerPhone} · {activeBooking.customerEmail || 'No email'}
              </p>
              <p className="text-[#5C5852]">
                Services: {(activeBooking.services || []).map((s) => s.serviceName).join(', ') || 'Standard visit'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#5C5852] mb-1">Appointment Date</label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[#5C5852] mb-1">Start Time (NPT)</label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-[#5C5852] mb-1">Assigned Specialist</label>
                <Select value={editStaffId} onChange={(e) => setEditStaffId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-[#5C5852] mb-1">Booking Status</label>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {STATUS_TABS.filter((s) => s !== 'ALL').map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-[#5C5852] mb-1">Payment Status</label>
                <Select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#5C5852] mb-1">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6DADC] pt-4">
              <a
                href={buildWhatsAppLink(
                  activeBooking.customerPhone,
                  `Namaste ${activeBooking.customerName}, regarding your appointment ${activeBooking.bookingRef} at The Beard Shop on ${editDate} at ${editTime} NPT.`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" size="sm" variant="gold">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Client
                </Button>
              </a>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveBooking(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Appointment"
        description={`Are you sure you want to permanently remove booking ${deleteTarget?.bookingRef} for ${deleteTarget?.customerName}?`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
