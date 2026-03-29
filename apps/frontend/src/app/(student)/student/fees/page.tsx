'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import Script from 'next/script';
import { Receipt, Download, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { SkeletonCard, SkeletonTable } from '@/components/shared/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Fee {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  receiptUrl?: string;
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Paid: 'default',
  Pending: 'destructive',
  Overdue: 'destructive',
  'Partially Paid': 'secondary',
  Waived: 'outline',
};

declare global {
  interface Window { Razorpay: any; }
}

export default function StudentFeesPage() {
  const user = useAuthStore((s) => s.user);
  const studentId = user?.studentProfile?.id;
  const queryClient = useQueryClient();

  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['student-fees', studentId],
    queryFn: () => api.get('/fees', { params: { studentId } }).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['student-balance', studentId],
    queryFn: () => api.get(`/fees/student/${studentId}/balance`).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const handlePayNow = async (fee: Fee) => {
    try {
      const res = await api.post(`/fees/${fee.id}/create-order`);
      const order = res.data.data;

      const options = {
        key: order.key,
        amount: order.amount * 100,
        currency: order.currency,
        name: 'Campusphere',
        description: `${fee.type} Payment`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.post(`/fees/${fee.id}/verify-payment`, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            queryClient.invalidateQueries({ queryKey: ['student-fees'] });
            queryClient.invalidateQueries({ queryKey: ['student-balance'] });
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#3b82f6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Failed to initiate payment. Payment gateway may not be configured.');
    }
  };

  const handleDownloadReceipt = async (fee: Fee) => {
    try {
      if (fee.receiptUrl) {
        window.open(fee.receiptUrl, '_blank');
      } else {
        const response = await api.get(`/fees/${fee.id}/receipt`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt-${fee.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  const columns = useMemo<ColumnDef<Fee>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <span>₹{row.original.amount.toLocaleString()}</span>,
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => format(new Date(row.original.dueDate), 'MMM d, yyyy'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusColors[row.original.status] ?? 'secondary'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'paidDate',
        header: 'Paid Date',
        cell: ({ row }) =>
          row.original.paidDate
            ? format(new Date(row.original.paidDate), 'MMM d, yyyy')
            : '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const fee = row.original;
          if (fee.status === 'Paid') {
            return (
              <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(fee)} className="gap-1.5">
                <Download className="h-4 w-4" />Receipt
              </Button>
            );
          }
          if (fee.status === 'Pending' || fee.status === 'Overdue' || fee.status === 'Partially Paid') {
            return (
              <Button size="sm" onClick={() => handlePayNow(fee)} className="gap-1.5 rounded-lg">
                <CreditCard className="h-4 w-4" />Pay Now
              </Button>
            );
          }
          return null;
        },
      },
    ],
    [user, queryClient]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <PageHeader title="Fees" description="View your fee history and pay online" />

      {/* Balance summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balanceLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Due"
              value={`₹${balanceData?.totalDue?.toLocaleString() ?? '0'}`}
              icon={DollarSign}
              variant={balanceData?.totalDue > 0 ? 'danger' : 'success'}
            />
            <StatCard
              title="Total Paid"
              value={`₹${balanceData?.totalPaid?.toLocaleString() ?? '0'}`}
              icon={Receipt}
              variant="success"
            />
            <StatCard
              title="Pending Fees"
              value={balanceData?.pendingCount ?? 0}
              icon={Receipt}
              variant={balanceData?.pendingCount > 0 ? 'accent' : 'default'}
            />
          </>
        )}
      </div>

      {/* Fee history table */}
      {feesLoading ? (
        <SkeletonTable rows={5} />
      ) : (
        <DataTable
          columns={columns}
          data={fees ?? []}
          searchKey="type"
          searchPlaceholder="Search by fee type..."
          emptyTitle="No Fees Found"
          emptyDescription="Your fee history will appear here."
        />
      )}
    </motion.div>
  );
}
