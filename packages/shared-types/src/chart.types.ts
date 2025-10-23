// Chart Data Types for Dashboard Visualizations

// Revenue Chart Data
export interface RevenueChartData {
  month: string;
  revenue: number;
  loads: number;
  [key: string]: string | number;
}

// Load Status Chart Data
export interface LoadStatusChartData {
  status: string;
  count: number;
  [key: string]: string | number;
}

// Performance Chart Data
export interface PerformanceChartData {
  week: string;
  pickups: number;
  deliveries: number;
  [key: string]: string | number;
}

// Carrier Performance Chart Data
export interface CarrierPerformanceChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

// Chart Props Interfaces
export interface ChartProps {
  data:
    | RevenueChartData[]
    | LoadStatusChartData[]
    | PerformanceChartData[]
    | CarrierPerformanceChartData[];
}

// Specific Chart Props
export interface RevenueChartProps extends ChartProps {
  data: RevenueChartData[];
}

export interface LoadStatusChartProps extends ChartProps {
  data: LoadStatusChartData[];
}

export interface PerformanceChartProps extends ChartProps {
  data: PerformanceChartData[];
}

export interface CarrierPerformanceChartProps extends ChartProps {
  data: CarrierPerformanceChartData[];
}

// Dashboard Chart Data Collection
export interface DashboardChartData {
  revenue: RevenueChartData[];
  loadStatus: LoadStatusChartData[];
  performance: PerformanceChartData[];
  carrierPerformance: CarrierPerformanceChartData[];
}

// Chart Tooltip Props
export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// Pie Chart Label Props (compatible with Recharts)
export interface PieChartLabelProps {
  name?: string;
  percent?: number;
  value?: number;
  [key: string]: unknown;
}
