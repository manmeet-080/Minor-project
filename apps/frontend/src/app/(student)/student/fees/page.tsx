'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { Receipt, Download, DollarSign } from 'lucide-react';
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

export default function StudentFeesPage() {
  const user = useAuthStore((s) => s.user);
  const studentId = user?.studentProfile?.id;

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
        cell: ({ row }) =>
          row.original.status === 'Paid' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadReceipt(row.original)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Receipt
            </Button>
          ) : null,
      },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader title="Fees" description="View your fee history and download receipts" />

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
