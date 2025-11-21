
export interface MetricConfig {
  id: string;
  name: string;
  unit: string;
  color: string;
  isDefault: boolean;
}

export interface DataPoint {
  timestamp: number; // Seconds from T-0
  [key: string]: number;
}

export interface FlightDataSet {
  name: string;
  data: DataPoint[];
  metrics: MetricConfig[];
}

export interface Anomaly {
  timestamp: number;
  metricId: string;
  value: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisReport {
  summary: string;
  status: 'success' | 'warning' | 'critical' | 'unknown';
  keyInsights: string[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string;
}

export interface ModelSettings {
  modelName: string;
  thinkingBudget: number;
}
