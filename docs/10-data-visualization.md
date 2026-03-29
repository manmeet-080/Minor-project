# Data Visualization & Charts

## Overview

Campusphere includes 8 chart components built with Recharts, plus a custom SVG progress ring and calendar heatmap. These are used across the admin dashboard, reports page, and student attendance page.

## Chart Components

### 1. Area Chart (`AreaChartWrapper`)
- **Library**: Recharts
- **Used in**: Admin dashboard (revenue trend), Reports (occupancy)
- **Features**: Gradient fill, multiple series, responsive, themed tooltips
- **Props**: `title`, `data`, `xKey`, `yKeys: { key, color, label }[]`

### 2. Bar Chart (`BarChartWrapper`)
- **Library**: Recharts
- **Used in**: Reports (fees, visitors, mess bookings)
- **Features**: Rounded top corners, multiple series, themed tooltips
- **Props**: Same as Area Chart

### 3. Stacked Bar Chart (`StackedBarChart`)
- **Library**: Recharts
- **Used in**: Reports (fee breakdown by type)
- **Features**: Stacked bars, legend, multiple series
- **Props**: Same as Area Chart

### 4. Donut Chart (`DonutChart`)
- **Library**: Recharts (PieChart)
- **Used in**: Admin dashboard (complaints), Reports (gate passes, complaints)
- **Features**: Inner/outer radius, percentage tooltips, legend, animated
- **Props**: `title`, `data: { name, value, color }[]`

### 5. Radar Chart (`RadarChartWrapper`)
- **Library**: Recharts
- **Used in**: Reports (complaint categories comparison)
- **Features**: Polar grid, angle axis labels, filled area
- **Props**: `title`, `data`, `dataKey`, `nameKey`, `color`

### 6. Horizontal Bar Chart (`HorizontalBarChart`)
- **Library**: Recharts (vertical layout)
- **Used in**: Reports (category rankings)
- **Features**: Horizontal bars, Y-axis labels, themed tooltips
- **Props**: `title`, `data: { name, value }[]`, `color`

### 7. Progress Ring (`ProgressRing`)
- **Library**: Custom SVG
- **Used in**: Admin dashboard (occupancy %), Student attendance (attendance rate)
- **Features**: Animated stroke, percentage label, configurable size/color
- **Props**: `value` (0-100), `size`, `strokeWidth`, `color`, `label`

### 8. Calendar Heatmap (`CalendarHeatmap`)
- **Library**: Custom HTML grid
- **Used in**: Reports (visitor frequency)
- **Features**: 12-week view, opacity-based intensity, tooltip on hover, legend
- **Props**: `title`, `data: Record<string, number>`, `color`

### 9. Sparkline (`Sparkline`)
- **Library**: Recharts (LineChart mini)
- **Used in**: Available for inline trend indicators in stat cards
- **Features**: No axes, no grid, minimal — just a small trend line
- **Props**: `data: number[]`, `color`, `height`, `width`

## Where Charts Are Used

### Admin Dashboard (`/admin/dashboard`)
| Chart | Data | Purpose |
|-------|------|---------|
| AreaChartWrapper | 6-month revenue trend | Collected vs charged |
| DonutChart | Complaint status breakdown | Visual status distribution |
| ProgressRing | Occupancy rate | Beds filled percentage |
| OccupancyGrid | Room status | Color-coded room grid |

### Reports Page (`/admin/reports`)
| Report Type | Charts |
|-------------|--------|
| Occupancy | AreaChart (occupancy over time) |
| Fees | BarChart (collection trend) |
| Complaints | DonutChart (by status) + RadarChart (by category) |
| Gate Passes | DonutChart (by type) |
| Visitors | BarChart (by month) |
| Mess | BarChart (bookings by meal type) |

### Student Attendance (`/student/attendance`)
| Chart | Data | Purpose |
|-------|------|---------|
| ProgressRing | Attendance rate | Present+Late / Total |

## Theming

All charts use CSS variables for consistent theming:
- Tooltip background: `hsl(var(--card))`
- Tooltip border: `hsl(var(--border))`
- Grid lines: `stroke-border` class
- Text: `currentColor` for automatic dark mode support

## Files

| File | Component |
|------|-----------|
| `components/charts/AreaChart.tsx` | AreaChartWrapper |
| `components/charts/BarChart.tsx` | BarChartWrapper |
| `components/charts/StackedBarChart.tsx` | StackedBarChart |
| `components/charts/DonutChart.tsx` | DonutChart |
| `components/charts/RadarChart.tsx` | RadarChartWrapper |
| `components/charts/HorizontalBarChart.tsx` | HorizontalBarChart |
| `components/charts/ProgressRing.tsx` | ProgressRing |
| `components/charts/CalendarHeatmap.tsx` | CalendarHeatmap |
| `components/charts/Sparkline.tsx` | Sparkline |
| `components/charts/FunnelChart.tsx` | FunnelChart (horizontal bars) |
