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
import { DonutChart } from '@/components/charts/DonutChart';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { RadarChartWrapper } from '@/components/charts/RadarChart';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

type ReportType = 'occupancy' | 'fees' | 'complaints' | 'gate-passes' | 'visitors' | 'mess';

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'occupancy', label: 'Occupancy Report' },
  { value: 'fees', label: 'Fees Report' },
  { value: 'complaints', label: 'Complaints Report' },
  { value: 'gate-passes', label: 'Gate Pass Report' },
  { value: 'visitors', label: 'Visitor Report' },
  { value: 'mess', label: 'Mess Report' },
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
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? '';
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
    enabled: !!hostelId && !!startDate && !!endDate,
  });

  const occupancyChartData = useMemo(() => {
    if (reportType !== 'occupancy' || !reportData?.trend) return [];
    return reportData.trend;
  }, [reportType, reportData]);

  const feesChartData = useMemo(() => {
    if (reportType !== 'fees' || !reportData?.trend) return [];
    return reportData.trend;
  }, [reportType, reportData]);

  const complaintsDonutData = useMemo(() => {
    if (reportType !== 'complaints' || !reportData?.byStatus) return [];
    const bd = reportData.byStatus;
    return [
      { name: 'Open', value: bd.OPEN ?? 0, color: '#ef4444' },
      { name: 'Assigned', value: bd.ASSIGNED ?? 0, color: '#f59e0b' },
      { name: 'In Progress', value: bd.IN_PROGRESS ?? 0, color: '#3b82f6' },
      { name: 'Resolved', value: bd.RESOLVED ?? 0, color: '#22c55e' },
      { name: 'Closed', value: bd.CLOSED ?? 0, color: '#6b7280' },
    ].filter(d => d.value > 0);
  }, [reportType, reportData]);

  const complaintCategoryData = useMemo(() => {
    if (reportType !== 'complaints' || !reportData?.byCategory) return [];
    return Object.entries(reportData.byCategory).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      count: value as number,
    }));
  }, [reportType, reportData]);

  const gatePassDonutData = useMemo(() => {
    if (reportType !== 'gate-passes' || !reportData?.byType) return [];
    const colors: Record<string, string> = { LOCAL: '#3b82f6', HOME: '#22c55e', EMERGENCY: '#ef4444', MEDICAL: '#f59e0b' };
    return Object.entries(reportData.byType).map(([name, value]) => ({
      name, value: value as number, color: colors[name] || '#6b7280',
    }));
  }, [reportType, reportData]);

  const messBarData = useMemo(() => {
    if (reportType !== 'mess' || !reportData?.mealStats) return [];
    return reportData.mealStats;
  }, [reportType, reportData]);

  function handleExport(format: 'pdf' | 'csv') {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    if (format === 'csv') {
      let csvContent = '';
      const summary = reportData.summary || reportData;
      const rows = Object.entries(summary).filter(([, v]) => typeof v !== 'object');
      const csvEscape = (s: string) => String(s).replace(/"/g, '""');
      csvContent += 'Metric,Value\n';
      rows.forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        csvContent += `"${csvEscape(label)}","${csvEscape(String(value))}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } else {
      window.print();
      toast.success('Print dialog opened');
    }
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
              Print
            </Button>
            <Button variant="outline" className="rounded-lg gap-1.5" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4" />
              CSV
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DonutChart title="Complaints by Status" data={complaintsDonutData} />
              <RadarChartWrapper
                title="Complaints by Category"
                data={complaintCategoryData}
                dataKey="count"
                nameKey="name"
                color="#8b5cf6"
              />
            </div>
          )}

          {reportType === 'gate-passes' && (
            <DonutChart title="Gate Passes by Type" data={gatePassDonutData} />
          )}

          {reportType === 'mess' && (
            <BarChartWrapper
              title="Meal Bookings & Ratings"
              data={messBarData}
              xKey="meal"
              yKeys={[
                { key: 'bookings', color: '#3b82f6', label: 'Bookings' },
              ]}
            />
          )}

          {reportType === 'visitors' && reportData?.byMonth && (
            <BarChartWrapper
              title="Visitors by Month"
              data={Object.entries(reportData.byMonth).map(([month, count]) => ({ month, visits: count }))}
              xKey="month"
              yKeys={[
                { key: 'visits', color: '#8b5cf6', label: 'Visits' },
              ]}
            />
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
