'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Receipt, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

interface FeeRecord {
  id: string;
  student: { user: { name: string }; rollNumber: string };
  feeType: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
  dueDate: string;
}

const statusStyles: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PARTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  UNPAID: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  OVERDUE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const paymentMethods = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'];

export default function FeesPage() {
  const queryClient = useQueryClient();
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';

  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; fee: FeeRecord | null }>({
    open: false,
    fee: null,
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['fees', hostelId],
    queryFn: async () => {
      const res = await api.get('/fees', { params: { hostelId } });
      return res.data.data as FeeRecord[];
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: {
      feeId: string;
      amount: number;
      method: string;
      transactionId?: string;
    }) => {
      await api.patch(`/fees/${payload.feeId}/pay`, {
        paidAmount: payload.amount,
        paymentMethod: payload.method,
        transactionId: payload.transactionId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Payment recorded successfully');
      closePaymentDialog();
    },
    onError: () => toast.error('Failed to record payment'),
  });

  function openPaymentDialog(fee: FeeRecord) {
    setPaymentDialog({ open: true, fee });
    setPaymentAmount(String(fee.amount - fee.paidAmount));
    setPaymentMethod('');
    setTransactionId('');
  }

  function closePaymentDialog() {
    setPaymentDialog({ open: false, fee: null });
    setPaymentAmount('');
    setPaymentMethod('');
    setTransactionId('');
  }

  const columns: ColumnDef<FeeRecord>[] = useMemo(
    () => [
      {
        id: 'studentName',
        header: 'Student',
        accessorFn: (row) => row.student?.user?.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.student?.user?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{row.original.student?.rollNumber}</p>
          </div>
        ),
      },
      { accessorKey: 'feeType', header: 'Fee Type' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => `₹${getValue<number>().toLocaleString('en-IN')}`,
      },
      {
        accessorKey: 'paidAmount',
        header: 'Paid',
        cell: ({ getValue }) => `₹${getValue<number>().toLocaleString('en-IN')}`,
      },
      {
        id: 'balance',
        header: 'Balance',
        cell: ({ row }) => {
          const balance = row.original.amount - row.original.paidAmount;
          return (
            <span className={balance > 0 ? 'text-destructive font-medium' : ''}>
              ₹{balance.toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge variant="secondary" className={statusStyles[status]}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          if (row.original.status === 'PAID') return null;
          return (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg gap-1.5"
              onClick={() => openPaymentDialog(row.original)}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Record Payment
            </Button>
          );
        },
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fees" description="Manage student fee payments" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Fees" description="Manage student fee payments and track outstanding balances" />

      <DataTable
        columns={columns}
        data={fees}
        searchKey="student"
        searchPlaceholder="Search by student name..."
        emptyTitle="No fee records"
        emptyDescription="There are no fee records to display."
      />

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => !open && closePaymentDialog()}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <p className="font-medium">{paymentDialog.fee?.student?.user?.name}</p>
              <p className="text-muted-foreground">
                {paymentDialog.fee?.feeType} — Balance: ₹
                {((paymentDialog.fee?.amount ?? 0) - (paymentDialog.fee?.paidAmount ?? 0)).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                className="rounded-lg"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? '')}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnId">Transaction ID (optional)</Label>
              <Input
                id="txnId"
                placeholder="e.g. UPI ref or cheque no."
                className="rounded-lg"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog}>
              Cancel
            </Button>
            <Button
              disabled={
                !paymentAmount ||
                !paymentMethod ||
                Number(paymentAmount) <= 0 ||
                recordPaymentMutation.isPending
              }
              onClick={() => {
                if (paymentDialog.fee) {
                  recordPaymentMutation.mutate({
                    feeId: paymentDialog.fee.id,
                    amount: Number(paymentAmount),
                    method: paymentMethod,
                    transactionId: transactionId || undefined,
                  });
                }
              }}
            >
              {recordPaymentMutation.isPending ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
