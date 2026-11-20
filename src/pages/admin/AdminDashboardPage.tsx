import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, RefreshCw } from 'lucide-react';
import {
  useGetAdminDashboardQuery,
  useUpdateAdminBookingMutation,
} from '../../api/adminApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { formatNpr } from '../../utils/nepal';
import { Button, Card, Skeleton } from '../../components/ui/Primitives';
import {
  AdminPageHeader,
  StatusText,
  extractApiError,
  useAdminToast,
} from '../../components/admin/AdminPrimitives';

const BAR_COLORS = ['#6B1222', '#9E1F32', '#B83348', '#4A0D18', '#D46A7A', '#884A54'];

export function AdminDashboardPage() {
  useDocumentMeta('Admin Dashboard', 'Real-time bookings, NPR revenue analytics, and salon KPIs.');
  const { data, isLoading, isFetching, isError, refetch } = useGetAdminDashboardQuery();
  const [updateBooking, { isLoading: updating }] = useUpdateAdminBookingMutation();
  const { notifySuccess, notifyError } = useAdminToast();

  const handleQuickStatus = async (id: number, ref: string, status: string) => {
    try {
      await updateBooking({ id, status }).unwrap();
      notifySuccess(`Booking ${ref} updated`, `Status changed to ${status.replace('_', ' ')}.`);
    } catch (err) {
      notifyError('Update failed', extractApiError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-72 w-full lg:col-span-7" />
          <Skeleton className="h-72 w-full lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-10 text-center">
        <p className="font-serif text-2xl text-[#2A0810]">Unable to load analytics</p>
        <p className="mt-1 text-xs text-[#6A655D]">
          Verify your session or PostgreSQL connection and try again.
        </p>
        <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const kpiCards = [
    { label: 'Total Bookings', value: String(data.kpis.totalBookings), sub: 'All time' },
    { label: "Today's Visits", value: String(data.kpis.todaysBookings), sub: 'Scheduled NPT' },
    { label: 'Pending Approval', value: String(data.kpis.pendingBookings), sub: 'Awaiting desk' },
    { label: 'Completed Visits', value: String(data.kpis.completedBookings), sub: 'Settled chairs' },
    { label: 'Client Directory', value: String(data.kpis.totalCustomers), sub: 'Unique clients' },
    { label: 'Monthly Revenue', value: formatNpr(data.kpis.monthlyRevenueNpr), sub: 'Current month' },
  ];

  const paymentChart = data.paymentBreakdown || [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Atelier Overview"
        subtitle="Live PostgreSQL metrics · Timezone: Asia/Kathmandu · Currency: NPR"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/admin/bookings">
              <Button variant="primary" size="sm">
                Manage Bookings
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="gold" size="sm">
                Export Reports
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs text-[#6A655D]">{item.label}</p>
            <p className="mt-2 font-mono text-xl font-semibold text-[#2A0810] tabular-nums">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] text-[#8A8379]">{item.sub}</p>
          </Card>
        ))}
      </div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl text-[#2A0810]">7-Day Revenue Trend (NPR)</h2>
              <p className="text-xs text-[#6A655D]">
                Active scheduled & completed appointment value
              </p>
            </div>
            <span className="font-mono text-xs text-[#8B1A2D] tabular-nums">
              Total Collected: {formatNpr(data.kpis.totalRevenueNpr)}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5C5852' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5C5852' }} />
                <Tooltip
                  formatter={(value) => [formatNpr(Number(value ?? 0)), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FAF8F4',
                    borderColor: '#E6DADC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenueNpr"
                  stroke="#6B1222"
                  fill="#9E1F32"
                  fillOpacity={0.28}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-5">
          <h2 className="font-serif text-xl text-[#2A0810]">Booking Status Breakdown</h2>
          <p className="text-xs text-[#6A655D] mb-4">Distribution across workflow states</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.statusChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#5C5852' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5C5852' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F4',
                    borderColor: '#E6DADC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {data.statusChart.map((entry, idx) => (
                    <Cell key={entry.status} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Secondary Analytics Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl text-[#2A0810]">Top Services by Revenue</h2>
              <p className="text-xs text-[#6A655D]">Highest grossing treatments in NPR</p>
            </div>
            <Link
              to="/admin/services"
              className="text-xs font-medium text-[#8B1A2D] hover:underline"
            >
              Manage Catalog
            </Link>
          </div>
          {data.popularServices.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#777777]">
              No booked services recorded yet.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.popularServices} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5C5852' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: '#222222' }}
                  />
                  <Tooltip
                    formatter={(value) => [formatNpr(Number(value ?? 0)), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#FAF8F4',
                      borderColor: '#E6DADC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenueNpr" fill="#9E1F32" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl text-[#2A0810]">Payment Channels (NPR)</h2>
              <p className="text-xs text-[#6A655D]">Cash at Salon vs eSewa, Khalti & Fonepay</p>
            </div>
            <Link
              to="/admin/payments"
              className="text-xs font-medium text-[#8B1A2D] hover:underline"
            >
              Payment Ledger
            </Link>
          </div>
          {paymentChart.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#777777]">
              No payment transactions logged yet.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE4E6" />
                  <XAxis dataKey="provider" tick={{ fontSize: 11, fill: '#5C5852' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#5C5852' }} />
                  <Tooltip
                    formatter={(value) => [formatNpr(Number(value ?? 0)), 'Volume']}
                    contentStyle={{
                      backgroundColor: '#FAF8F4',
                      borderColor: '#E6DADC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amountNpr" fill="#6B1222" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Bookings Quick Queue */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6DADC] px-6 py-4">
          <div>
            <h2 className="font-serif text-xl text-[#2A0810]">Recent Appointments</h2>
            <p className="text-xs text-[#6A655D]">Quick-approve or complete incoming desk bookings</p>
          </div>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#8B1A2D] hover:text-[#2A0810]"
          >
            View All Bookings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6DADC] bg-[#FAF8F4] text-[#6A655D]">
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Schedule (NPT)</th>
                <th className="px-5 py-3 font-medium">Specialist</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE4E6]">
              {data.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#6A655D]">
                    No appointments recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-[#FAF8F4]/70 transition-colors">
                    <td className="px-5 py-3 font-mono text-[#8B1A2D] whitespace-nowrap">
                      {bk.bookingRef}
                    </td>
                    <td className="px-5 py-3 font-medium text-[#2A0810] whitespace-nowrap">
                      {bk.customerName}
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-[#5C5852] whitespace-nowrap">
                      {bk.appointmentDate} · {bk.startTime}
                    </td>
                    <td className="px-5 py-3 text-[#5C5852] whitespace-nowrap">{bk.staffName}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusText status={bk.status} />
                    </td>
                    <td className="px-5 py-3 font-mono text-right tabular-nums text-[#2A0810] whitespace-nowrap">
                      {formatNpr(bk.totalPriceNpr)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {bk.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-8 px-3 text-[11px]"
                          disabled={updating}
                          onClick={() => handleQuickStatus(bk.id, bk.bookingRef, 'APPROVED')}
                        >
                          Approve
                        </Button>
                      ) : bk.status === 'APPROVED' ? (
                        <Button
                          size="sm"
                          variant="gold"
                          className="h-8 px-3 text-[11px]"
                          disabled={updating}
                          onClick={() => handleQuickStatus(bk.id, bk.bookingRef, 'COMPLETED')}
                        >
                          Complete
                        </Button>
                      ) : (
                        <Link
                          to="/admin/bookings"
                          className="text-xs text-[#6A655D] hover:text-[#2A0810]"
                        >
                          Inspect
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
