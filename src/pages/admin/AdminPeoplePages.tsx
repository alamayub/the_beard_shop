import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Coffee,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  useCreateAdminCustomerMutation,
  useCreateAdminHolidayMutation,
  useCreateAdminTeamMemberMutation,
  useCreateStaffBreakMutation,
  useDeleteAdminCustomerMutation,
  useDeleteAdminHolidayMutation,
  useDeleteAdminTeamMemberMutation,
  useDeleteStaffBreakMutation,
  useGetAdminBookingsQuery,
  useGetAdminCustomersQuery,
  useGetAdminHolidaysQuery,
  useGetAdminTeamQuery,
  useUpdateAdminCustomerMutation,
  useUpdateAdminHolidayMutation,
  useUpdateAdminTeamMemberMutation,
  useUpdateStaffSchedulesMutation,
} from '../../api/adminApi';
import type {
  CustomerRecord,
  SalonHoliday,
  StaffMember,
  StaffSchedule,
} from '../../types/salon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import {
  buildWhatsAppLink,
  formatBikramSambat,
  formatNpr,
  getKathmanduTodayIso,
} from '../../utils/nepal';
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Team Management ───────────────────────────────────────────────────────────
export function AdminTeamPage() {
  useDocumentMeta('Team Management', 'Manage stylists, barbers, makeup artists, and availability.');
  const { notifySuccess, notifyError, notifyInfo } = useAdminToast();
  const { data: team = [], isLoading } = useGetAdminTeamQuery();
  const [createMember, { isLoading: creating }] = useCreateAdminTeamMemberMutation();
  const [updateMember, { isLoading: updating }] = useUpdateAdminTeamMemberMutation();
  const [deleteMember, { isLoading: deleting }] = useDeleteAdminTeamMemberMutation();

  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>(
    'ALL'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [experienceYears, setExperienceYears] = useState(4);
  const [specializationsText, setSpecializationsText] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(SALON_IMAGE_PRESETS[8].url);
  const [isAvailable, setIsAvailable] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return team.filter((m) => {
      if (availabilityFilter === 'AVAILABLE' && !m.isAvailable) return false;
      if (availabilityFilter === 'UNAVAILABLE' && m.isAvailable) return false;
      if (
        q &&
        !m.fullName.toLowerCase().includes(q) &&
        !m.roleTitle.toLowerCase().includes(q) &&
        !(m.specializations || []).some((s) => s.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [team, search, availabilityFilter]);

  const pagination = usePagination(filtered, 6);

  const openCreate = () => {
    setEditing(null);
    setFullName('');
    setRoleTitle('Senior Stylist');
    setExperienceYears(4);
    setSpecializationsText('Haircut & Styling, Beard Sculpting');
    setBio('');
    setAvatarUrl(SALON_IMAGE_PRESETS[8].url);
    setIsAvailable(true);
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setFullName(member.fullName);
    setRoleTitle(member.roleTitle);
    setExperienceYears(member.experienceYears);
    setSpecializationsText((member.specializations || []).join(', '));
    setBio(member.bio || '');
    setAvatarUrl(member.avatarUrl || SALON_IMAGE_PRESETS[8].url);
    setIsAvailable(member.isAvailable);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const specs = specializationsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editing) {
        await updateMember({
          id: editing.id,
          data: {
            fullName,
            roleTitle,
            experienceYears: Number(experienceYears),
            specializations: specs,
            bio,
            avatarUrl,
            isAvailable,
            isDemoProfile: false,
          },
        }).unwrap();
        notifySuccess('Specialist updated', `${fullName} saved successfully.`);
      } else {
        await createMember({
          fullName,
          roleTitle,
          experienceYears: Number(experienceYears),
          specializations: specs,
          bio,
          avatarUrl,
          isAvailable,
          isDemoProfile: false,
        }).unwrap();
        notifySuccess('Specialist added', `${fullName} joined the team roster.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const toggleAvailability = async (member: StaffMember) => {
    try {
      await updateMember({
        id: member.id,
        data: { isAvailable: !member.isAvailable },
      }).unwrap();
      notifyInfo(
        'Availability updated',
        `${member.fullName} is now ${!member.isAvailable ? 'accepting bookings' : 'unavailable'}.`
      );
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMember(deleteTarget.id).unwrap();
      notifySuccess('Specialist removed', `${deleteTarget.fullName} deleted from roster.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Team Members"
        subtitle="Manage salon stylists, barbers, facial therapists, portraits, and booking availability."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Specialist
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, title, or specialization..."
        totalCount={filtered.length}
        itemLabel="specialists"
        filters={
          <div className="flex items-center gap-1 rounded-[4px] border border-[#E6DADC] bg-white p-1">
            {(['ALL', 'AVAILABLE', 'UNAVAILABLE'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAvailabilityFilter(tab)}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  availabilityFilter === tab
                    ? 'bg-[#6B1222] text-[#FAF8F4]'
                    : 'text-[#5C5254] hover:text-[#2A1216]'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'AVAILABLE' ? 'Available' : 'Off Roster'}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : pagination.paginatedItems.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[#6A5A5D]">
          No team members match your filter.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
            {pagination.paginatedItems.map((member) => (
              <div
                key={member.id}
                className="flex flex-col justify-between rounded-[4px] border border-[#E6DADC] bg-[#FAF8F4]/50 p-4"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#E6DADC] bg-[#EFE1E3]">
                      <SafeImage
                        src={member.avatarUrl}
                        alt={member.fullName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg font-medium text-[#2A1216] truncate">
                        {member.fullName}
                      </p>
                      <p className="text-xs font-medium text-[#8B1A2D] truncate">
                        {member.roleTitle}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6A5A5D]">
                        <span className="tabular-nums">{member.experienceYears} yrs exp</span>
                        <span>·</span>
                        <StatusText status={member.isAvailable ? 'AVAILABLE' : 'HIDDEN'} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#5C5254] line-clamp-2">
                    {member.bio || 'No biography added yet.'}
                  </p>
                  {(member.specializations || []).length > 0 && (
                    <p className="mt-2.5 text-[11px] text-[#6A5A5D] truncate">
                      {(member.specializations || []).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#E6DADC] pt-3">
                  <button
                    type="button"
                    onClick={() => toggleAvailability(member)}
                    className="text-xs font-medium text-[#6B1222] hover:underline cursor-pointer"
                  >
                    {member.isAvailable ? 'Set Unavailable' : 'Set Available'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => openEdit(member)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#9E1F32] hover:bg-[#9E1F32]/10"
                      onClick={() => setDeleteTarget(member)}
                      aria-label={`Delete ${member.fullName}`}
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
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Specialist' : 'Add Salon Specialist'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Full Name *</label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Riya Shrestha"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Role / Title *</label>
              <Input
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Master Barber & Stylist"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                Experience (Years)
              </label>
              <Input
                type="number"
                min={0}
                max={40}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                Specializations (comma-separated)
              </label>
              <Input
                value={specializationsText}
                onChange={(e) => setSpecializationsText(e.target.value)}
                placeholder="Party Makeup, Hair Coloring, Keratin"
              />
            </div>
          </div>

          <AdminImageField label="Specialist Portrait" value={avatarUrl} onChange={setAvatarUrl} />

          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
              Professional Biography
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a concise summary of training, style specialty, and client approach..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-[#4A3B3E]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="accent-[#6B1222]"
              />
              Accepting online appointments
            </label>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Changes' : 'Create Specialist'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Specialist"
        description={`Remove "${deleteTarget?.fullName}" from the salon roster? Existing historical bookings will be preserved.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Staff Schedules, Breaks & Nepal Public Holidays ──────────────────────────
export function AdminSchedulesPage() {
  useDocumentMeta(
    'Staff Schedules & Holidays',
    'Configure stylist weekly shifts, breaks, and Nepal public holidays.'
  );
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: team = [], isLoading: loadingTeam } = useGetAdminTeamQuery();
  const { data: holidays = [], isLoading: loadingHolidays } = useGetAdminHolidaysQuery();

  const [saveSchedules, { isLoading: savingSched }] = useUpdateStaffSchedulesMutation();
  const [createBreak, { isLoading: creatingBreak }] = useCreateStaffBreakMutation();
  const [deleteBreak, { isLoading: deletingBreak }] = useDeleteStaffBreakMutation();
  const [createHoliday, { isLoading: creatingHoliday }] = useCreateAdminHolidayMutation();
  const [updateHoliday, { isLoading: updatingHoliday }] = useUpdateAdminHolidayMutation();
  const [deleteHoliday, { isLoading: deletingHoliday }] = useDeleteAdminHolidayMutation();

  const [selectedStaffId, setSelectedStaffId] = useState<number>(0);
  const [draftSchedules, setDraftSchedules] = useState<StaffSchedule[]>([]);

  // Break modal
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakDate, setBreakDate] = useState('');
  const [breakStart, setBreakStart] = useState('13:30');
  const [breakEnd, setBreakEnd] = useState('14:15');
  const [breakReason, setBreakReason] = useState('Lunch Break');

  // Holiday modal + search
  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<SalonHoliday | null>(null);
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState<SalonHoliday | null>(null);
  const [holidayDate, setHolidayDate] = useState(getKathmanduTodayIso());
  const [holidayName, setHolidayName] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');
  const [holidayClosed, setHolidayClosed] = useState(true);

  useEffect(() => {
    if (team.length > 0 && !selectedStaffId) {
      setSelectedStaffId(team[0].id);
    }
  }, [team, selectedStaffId]);

  const activeStaff = useMemo(
    () => team.find((m) => m.id === selectedStaffId) || team[0] || null,
    [team, selectedStaffId]
  );

  useEffect(() => {
    if (!activeStaff) return;
    const rows: StaffSchedule[] = DAY_NAMES.map((_, dayIndex) => {
      const found = (activeStaff.schedules || []).find((s) => s.dayOfWeek === dayIndex);
      return (
        found || {
          dayOfWeek: dayIndex,
          startTime: '10:00',
          endTime: '20:00',
          isWorking: true,
        }
      );
    });
    setDraftSchedules(rows);
  }, [activeStaff]);

  const filteredHolidays = useMemo(() => {
    const q = holidaySearch.trim().toLowerCase();
    return holidays.filter(
      (h) =>
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.description || '').toLowerCase().includes(q) ||
        (h.bsDate || '').toLowerCase().includes(q) ||
        h.date.includes(q)
    );
  }, [holidays, holidaySearch]);

  const holidayPagination = usePagination(filteredHolidays, 6);

  const handleScheduleChange = (
    dayOfWeek: number,
    patch: Partial<Pick<StaffSchedule, 'startTime' | 'endTime' | 'isWorking'>>
  ) => {
    setDraftSchedules((prev) =>
      prev.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row))
    );
  };

  const handleSaveSchedule = async () => {
    if (!activeStaff) return;
    try {
      await saveSchedules({ id: activeStaff.id, schedules: draftSchedules }).unwrap();
      notifySuccess('Weekly shifts saved', `${activeStaff.fullName}'s hours updated.`);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const handleAddBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    try {
      await createBreak({
        staffId: activeStaff.id,
        breakDate: breakDate.trim() || null,
        startTime: breakStart,
        endTime: breakEnd,
        reason: breakReason,
      }).unwrap();
      notifySuccess('Break scheduled', `Blocked ${breakStart}–${breakEnd} NPT.`);
      setBreakModalOpen(false);
      setBreakDate('');
    } catch (err) {
      notifyError('Could not add break', extractApiError(err));
    }
  };

  const handleRemoveBreak = async (breakId: number) => {
    try {
      await deleteBreak(breakId).unwrap();
      notifySuccess('Break removed', 'Time slot reopened for booking availability.');
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  const openCreateHoliday = () => {
    setEditingHoliday(null);
    setHolidayDate(getKathmanduTodayIso());
    setHolidayName('');
    setHolidayDescription('');
    setHolidayClosed(true);
    setHolidayModalOpen(true);
  };

  const openEditHoliday = (h: SalonHoliday) => {
    setEditingHoliday(h);
    setHolidayDate(h.date);
    setHolidayName(h.name);
    setHolidayDescription(h.description || '');
    setHolidayClosed(h.isClosed);
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const bsDate = formatBikramSambat(holidayDate);
    try {
      if (editingHoliday) {
        await updateHoliday({
          id: editingHoliday.id,
          data: {
            date: holidayDate,
            bsDate,
            name: holidayName,
            description: holidayDescription,
            isClosed: holidayClosed,
          },
        }).unwrap();
        notifySuccess('Holiday updated', `${holidayName} saved.`);
      } else {
        await createHoliday({
          date: holidayDate,
          bsDate,
          name: holidayName,
          description: holidayDescription,
          isClosed: holidayClosed,
        }).unwrap();
        notifySuccess('Holiday added', `${holidayName} added to salon calendar.`);
      }
      setHolidayModalOpen(false);
    } catch (err) {
      notifyError('Holiday save failed', extractApiError(err));
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deleteHolidayTarget) return;
    try {
      await deleteHoliday(deleteHolidayTarget.id).unwrap();
      notifySuccess('Holiday removed', `${deleteHolidayTarget.name} removed from calendar.`);
      setDeleteHolidayTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Staff Schedules & Holidays"
        subtitle="Control weekly stylist shifts, daily breaks, and Nepal festival closure dates (Asia/Kathmandu)."
        actions={
          <Button variant="primary" size="sm" onClick={openCreateHoliday}>
            <Plus className="h-4 w-4" /> Add Holiday
          </Button>
        }
      />

      {/* Weekly Shift + Breaks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E6DADC] pb-4">
            <div className="flex items-center gap-2.5">
              <CalendarClock className="h-5 w-5 text-[#6B1222]" />
              <div>
                <h2 className="font-serif text-xl text-[#2A1216]">Weekly Shift Hours (NPT)</h2>
                <p className="text-xs text-[#6A5A5D]">
                  Live slot availability calculates directly from these working windows
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={activeStaff?.id || ''}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                className="h-10 w-52 text-xs"
                aria-label="Select specialist"
              >
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </Select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSchedule}
                disabled={savingSched || !activeStaff}
              >
                <Save className="h-3.5 w-3.5" /> {savingSched ? 'Saving...' : 'Save Shifts'}
              </Button>
            </div>
          </div>

          {loadingTeam ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#EFE4E6]">
              {draftSchedules.map((row) => (
                <div
                  key={row.dayOfWeek}
                  className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-12 sm:items-center"
                >
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <input
                      id={`work-${row.dayOfWeek}`}
                      type="checkbox"
                      checked={row.isWorking}
                      onChange={(e) =>
                        handleScheduleChange(row.dayOfWeek, { isWorking: e.target.checked })
                      }
                      className="accent-[#6B1222] h-4 w-4 cursor-pointer"
                    />
                    <label
                      htmlFor={`work-${row.dayOfWeek}`}
                      className="text-sm font-medium text-[#2A1216] cursor-pointer"
                    >
                      {DAY_NAMES[row.dayOfWeek]}
                    </label>
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      type="time"
                      value={row.startTime}
                      disabled={!row.isWorking}
                      onChange={(e) =>
                        handleScheduleChange(row.dayOfWeek, { startTime: e.target.value })
                      }
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 text-center text-xs text-[#7D6C70]">to</div>
                  <div className="sm:col-span-3">
                    <Input
                      type="time"
                      value={row.endTime}
                      disabled={!row.isWorking}
                      onChange={(e) =>
                        handleScheduleChange(row.dayOfWeek, { endTime: e.target.value })
                      }
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <StatusText status={row.isWorking ? 'ACTIVE' : 'HIDDEN'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Staff Breaks Panel */}
        <Card className="p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E6DADC] pb-4">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-[#6B1222]" />
                <h2 className="font-serif text-xl text-[#2A1216]">Stylist Breaks</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={!activeStaff}
                onClick={() => setBreakModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Break
              </Button>
            </div>
            <p className="mt-3 text-xs text-[#6A5A5D]">
              Active blocked breaks for{' '}
              <strong className="text-[#2A1216]">{activeStaff?.fullName || 'Specialist'}</strong>.
            </p>

            <div className="mt-4 space-y-2.5">
              {(activeStaff?.breaks || []).length === 0 ? (
                <p className="rounded-[4px] border border-dashed border-[#DFCFD2] p-5 text-center text-xs text-[#7D6C70]">
                  No daily or date-specific breaks configured.
                </p>
              ) : (
                (activeStaff?.breaks || []).map((br) => (
                  <div
                    key={br.id}
                    className="flex items-center justify-between gap-2 rounded-[4px] border border-[#E6DADC] bg-[#FAF8F4] px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#2A1216]">{br.reason}</p>
                      <p className="font-mono text-[11px] text-[#6A5A5D] tabular-nums">
                        {br.breakDate ? br.breakDate : 'Daily Recurring'} · {br.startTime}–{br.endTime}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={deletingBreak}
                      onClick={() => handleRemoveBreak(br.id)}
                      aria-label={`Remove break ${br.reason}`}
                      className="text-[#9E1F32] hover:bg-[#9E1F32]/10 p-1.5 rounded-[4px] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Nepal Holidays Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-[#E6DADC] p-5">
          <AdminToolbar
            search={holidaySearch}
            onSearchChange={setHolidaySearch}
            searchPlaceholder="Search Nepal public holidays or YYYY-MM-DD..."
            totalCount={filteredHolidays.length}
            itemLabel="holidays"
          />
        </div>
        {loadingHolidays ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                    <th className="px-5 py-3 font-medium">Date (AD / BS)</th>
                    <th className="px-5 py-3 font-medium">Holiday Name</th>
                    <th className="px-5 py-3 font-medium">Note</th>
                    <th className="px-5 py-3 font-medium">Salon Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {holidayPagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-[#6A5A5D]">
                        No holidays configured.
                      </td>
                    </tr>
                  ) : (
                    holidayPagination.paginatedItems.map((h) => (
                      <tr key={h.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3 font-mono tabular-nums whitespace-nowrap">
                          <span className="font-medium text-[#2A1216]">{h.date}</span>
                          <span className="ml-2 text-[#7D6C70]">
                            ({h.bsDate || formatBikramSambat(h.date)})
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-[#2A1216]">{h.name}</td>
                        <td className="px-5 py-3 text-[#5C5254]">{h.description || '—'}</td>
                        <td className="px-5 py-3">
                          <StatusText status={h.isClosed ? 'CANCELLED' : 'ACTIVE'} />
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => openEditHoliday(h)}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#9E1F32]"
                              onClick={() => setDeleteHolidayTarget(h)}
                              aria-label={`Delete ${h.name}`}
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
              page={holidayPagination.page}
              totalPages={holidayPagination.totalPages}
              totalItems={holidayPagination.totalItems}
              pageSize={holidayPagination.pageSize}
              onPageChange={holidayPagination.setPage}
              onPageSizeChange={holidayPagination.setPageSize}
            />
          </>
        )}
      </Card>

      {/* Add Break Modal */}
      <Modal
        open={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        title={`Add Break — ${activeStaff?.fullName || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddBreak} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
              Specific Date (Leave empty for daily recurring break)
            </label>
            <Input
              type="date"
              value={breakDate}
              onChange={(e) => setBreakDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Start (NPT)</label>
              <Input
                type="time"
                required
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">End (NPT)</label>
              <Input
                type="time"
                required
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Reason *</label>
            <Input
              required
              value={breakReason}
              onChange={(e) => setBreakReason(e.target.value)}
              placeholder="Lunch Break / Salon Outcall"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setBreakModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creatingBreak}>
              {creatingBreak ? 'Saving...' : 'Add Break'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Holiday Modal */}
      <Modal
        open={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title={editingHoliday ? 'Edit Holiday' : 'Add Nepal Holiday'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveHoliday} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Date (AD) *</label>
            <Input
              type="date"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Holiday Name *</label>
            <Input
              required
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="e.g. Dashain Vijaya Dashami"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
              Note / Nepali Context (Optional)
            </label>
            <Input
              value={holidayDescription}
              onChange={(e) => setHolidayDescription(e.target.value)}
              placeholder="e.g. विजया दशमी — Full day festival closure"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-[#4A3B3E] cursor-pointer">
            <input
              type="checkbox"
              checked={holidayClosed}
              onChange={(e) => setHolidayClosed(e.target.checked)}
              className="accent-[#6B1222]"
            />
            Block online bookings (Salon Closed)
          </label>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={creatingHoliday || updatingHoliday}
            >
              {creatingHoliday || updatingHoliday ? 'Saving...' : 'Save Holiday'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteHolidayTarget)}
        title="Delete Holiday"
        description={`Remove "${deleteHolidayTarget?.name}" (${deleteHolidayTarget?.date}) from the salon closure calendar?`}
        loading={deletingHoliday}
        onConfirm={handleDeleteHoliday}
        onClose={() => setDeleteHolidayTarget(null)}
      />
    </div>
  );
}

// ─── Customer Directory (CRM) ──────────────────────────────────────────────────
export function AdminCustomersPage() {
  useDocumentMeta('Customer Directory', 'Manage client profiles, stylist notes, and booking history.');
  const { notifySuccess, notifyError } = useAdminToast();
  const { data: customers = [], isLoading } = useGetAdminCustomersQuery();
  const { data: allBookings = [] } = useGetAdminBookingsQuery();
  const [createCustomer, { isLoading: creating }] = useCreateAdminCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateAdminCustomerMutation();
  const [deleteCustomer, { isLoading: deleting }] = useDeleteAdminCustomerMutation();

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<'ALL' | 'RETURNING' | 'NEW'>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [historyTarget, setHistoryTarget] = useState<CustomerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+977 ');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (segment === 'RETURNING' && c.totalVisits < 2) return false;
      if (segment === 'NEW' && c.totalVisits >= 2) return false;
      if (
        q &&
        !c.fullName.toLowerCase().includes(q) &&
        !c.phone.toLowerCase().includes(q) &&
        !(c.email || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [customers, search, segment]);

  const pagination = usePagination(filtered, 8);

  const openCreate = () => {
    setEditing(null);
    setFullName('');
    setPhone('+977 ');
    setEmail('');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (c: CustomerRecord) => {
    setEditing(c);
    setFullName(c.fullName);
    setPhone(c.phone);
    setEmail(c.email || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCustomer({
          id: editing.id,
          data: { fullName, phone, email, notes },
        }).unwrap();
        notifySuccess('Client updated', `${fullName}'s profile saved.`);
      } else {
        await createCustomer({ fullName, phone, email, notes }).unwrap();
        notifySuccess('Client added', `${fullName} added to directory.`);
      }
      setModalOpen(false);
    } catch (err) {
      notifyError('Save failed', extractApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget.id).unwrap();
      notifySuccess('Client deleted', `${deleteTarget.fullName} removed from CRM.`);
      setDeleteTarget(null);
    } catch (err) {
      notifyError('Delete failed', extractApiError(err));
    }
  };

  const customerHistory = useMemo(() => {
    if (!historyTarget) return [];
    return allBookings.filter(
      (b) => b.customerId === historyTarget.id || b.customerPhone === historyTarget.phone
    );
  }, [allBookings, historyTarget]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Directory"
        subtitle="Track Birgunj salon guests, visit frequency, lifetime NPR value, and stylist formula notes."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Add Client
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client name, phone, or email..."
        totalCount={filtered.length}
        itemLabel="clients"
        filters={
          <div className="flex items-center gap-1 rounded-[4px] border border-[#E6DADC] bg-white p-1">
            {(['ALL', 'RETURNING', 'NEW'] as const).map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegment(seg)}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  segment === seg
                    ? 'bg-[#6B1222] text-[#FAF8F4]'
                    : 'text-[#5C5254] hover:text-[#2A1216]'
                }`}
              >
                {seg === 'ALL' ? 'All Clients' : seg === 'RETURNING' ? 'Returning (2+)' : 'New'}
              </button>
            ))}
          </div>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A5A5D]">
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium text-right">Visits</th>
                    <th className="px-5 py-3 font-medium text-right">Lifetime Value</th>
                    <th className="px-5 py-3 font-medium">Notes</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4E6]">
                  {pagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-[#6A5A5D]">
                        No customers match your filter.
                      </td>
                    </tr>
                  ) : (
                    pagination.paginatedItems.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3 font-medium text-[#2A1216] whitespace-nowrap">
                          {c.fullName}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="font-mono text-[#2A1216] tabular-nums">{c.phone}</p>
                          {c.email && <p className="text-[11px] text-[#7D6C70]">{c.email}</p>}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-[#2A1216]">
                          {c.totalVisits}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums font-medium text-[#2A1216]">
                          {formatNpr(c.totalSpentNpr)}
                        </td>
                        <td className="px-5 py-3 max-w-[200px] truncate text-[#5C5254]">
                          {c.notes || '—'}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => setHistoryTarget(c)}
                            >
                              History
                            </Button>
                            <a
                              href={buildWhatsAppLink(
                                c.phone,
                                `Namaste ${c.fullName}! Greetings from The Beard Shop Beauty Salon, Birgunj.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#E6DADC] text-[#6B1222] hover:bg-[#6B1222]/5"
                              title="Message on WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#9E1F32]"
                              onClick={() => setDeleteTarget(c)}
                              aria-label={`Delete ${c.fullName}`}
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

      {/* Create / Edit Client Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Client Profile' : 'Add New Client'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Full Name *</label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Client full name"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Phone *</label>
              <Input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B3E] mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
              Internal Stylist / Formula Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferred fade guard, color shade formula, allergies..."
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating || updating}>
              {creating || updating ? 'Saving...' : editing ? 'Save Changes' : 'Add Client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Client History Modal */}
      <Modal
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={`Booking History — ${historyTarget?.fullName || ''}`}
        maxWidth="max-w-2xl"
      >
        {historyTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DADC] pb-3 text-xs text-[#5C5254]">
              <span className="font-mono">{historyTarget.phone}</span>
              <span className="font-mono tabular-nums">
                {historyTarget.totalVisits} visits · {formatNpr(historyTarget.totalSpentNpr)}
              </span>
            </div>
            {customerHistory.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#7D6C70]">
                No appointments linked to this client yet.
              </p>
            ) : (
              <div className="divide-y divide-[#EFE4E6] max-h-80 overflow-y-auto">
                {customerHistory.map((bk) => (
                  <div key={bk.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                    <div>
                      <p className="font-mono font-medium text-[#8B1A2D]">{bk.bookingRef}</p>
                      <p className="text-[#5C5254] tabular-nums">
                        {bk.appointmentDate} · {bk.startTime}–{bk.endTime} NPT · {bk.staffName}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusText status={bk.status} />
                      <p className="font-mono font-medium text-[#2A1216] tabular-nums mt-0.5">
                        {formatNpr(bk.totalPriceNpr)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Customer"
        description={`Delete "${deleteTarget?.fullName}" from the client directory? This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
