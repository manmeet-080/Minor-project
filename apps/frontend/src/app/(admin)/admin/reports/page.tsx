'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { AreaChartWrapper } from '@/components/charts/AreaChart';
import { BarChartWrapper } from '@/components/charts/BarChart';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

type ReportType = 'occupancy' | 'fees' | 'complaints';

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'occupancy', label: 'Occupancy Report' },
  { value: 'fees', label: 'Fees Report' },
  { value: 'complaints', label: 'Complaints Report' },
];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function ReportsPage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';
  const defaults = getDefaultDateRange();

  const [reportType, setReportType] = useState<ReportType>('occupancy');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', reportType, hostelId, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (reportType === 'fees') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.get(`/reports/${reportType}/${hostelId}`, {
        params,
      });
      return res.data.data;
    },
    enabled: !!startDate && !!endDate,
  });

  const occupancyChartData = useMemo(() => {
    if (reportType !== 'occupancy' || !reportData?.trend) return [];
    return reportData.trend;
  }, [reportType, reportData]);

  const feesChartData = useMemo(() => {
    if (reportType !== 'fees' || !reportData?.trend) return [];
    return reportData.trend;
  }, [reportType, reportData]);

  const complaintsFunnelData = useMemo(() => {
    if (reportType !== 'complaints' || !reportData?.breakdown) return [];
    const bd = reportData.breakdown;
    return [
      { label: 'Open', value: bd.open ?? 0, color: '#ef4444' },
      { label: 'Assigned', value: bd.assigned ?? 0, color: '#f59e0b' },
      { label: 'In Progress', value: bd.inProgress ?? 0, color: '#3b82f6' },
      { label: 'Resolved', value: bd.resolved ?? 0, color: '#22c55e' },
    ];
  }, [reportType, reportData]);

  function handleExport(format: 'pdf' | 'excel') {
    toast.info(`Exporting ${reportType} report as ${format.toUpperCase()}...`);
    // Placeholder: in production, trigger a file download from the API
    // e.g., window.open(`${API_URL}/reports/${reportType}/export?format=${format}&...`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export hostel reports"
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg gap-1.5" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" className="rounded-lg gap-1.5" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        }
      />

      {/* Controls */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  className="pl-9 rounded-lg"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  className="pl-9 rounded-lg"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Chart */}
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <>
          {reportType === 'occupancy' && (
            <AreaChartWrapper
              title="Occupancy Over Time"
              data={occupancyChartData}
              xKey="date"
              yKeys={[
                { key: 'occupancy', color: '#3b82f6', label: 'Occupancy %' },
              ]}
            />
          )}

          {reportType === 'fees' && (
            <BarChartWrapper
              title="Fee Collection Trend"
              data={feesChartData}
              xKey="month"
              yKeys={[
                { key: 'collected', color: '#22c55e', label: 'Collected' },
                { key: 'pending', color: '#f59e0b', label: 'Pending' },
              ]}
            />
          )}

          {reportType === 'complaints' && (
            <FunnelChart title="Complaints Breakdown" data={complaintsFunnelData} />
          )}

          {/* Summary Card */}
          {reportData?.summary && (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {Object.entries(reportData.summary as Record<string, string | number>).map(
                    ([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-lg font-display font-bold">{value}</p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
