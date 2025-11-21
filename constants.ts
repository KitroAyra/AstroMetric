
import { MetricConfig, DataPoint, ModelSettings } from './types';

export const DEFAULT_METRICS: MetricConfig[] = [
  { id: 'altitude', name: '高度', unit: 'm', color: '#3b82f6', isDefault: true }, // Blue
  { id: 'velocity', name: '速度', unit: 'm/s', color: '#10b981', isDefault: true }, // Emerald
  { id: 'acceleration', name: '加速度', unit: 'm/s²', color: '#f59e0b', isDefault: true }, // Amber
  { id: 'pressure', name: '动压 (Q)', unit: 'kPa', color: '#8b5cf6', isDefault: false }, // Violet
  { id: 'temp_engine', name: '引擎温度', unit: '°C', color: '#ef4444', isDefault: false }, // Red
  { id: 'vibration', name: '震动', unit: 'g', color: '#ec4899', isDefault: false }, // Pink
];

export const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (推荐 - 强推理)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (快速)' },
];

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  modelName: 'gemini-3-pro-preview',
  thinkingBudget: 2048,
};

export const generateDemoData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  const duration = 300; // 5 minutes
  
  // Loop with integer to avoid floating point accumulation errors
  // 0.1s resolution means 10 steps per second
  for (let i = 0; i <= duration * 10; i++) {
    const t = i / 10; 
    
    // Simulate a basic flight profile
    const isPowered = t < 150;
    const altitude = isPowered ? 0.5 * 30 * t * t : 337500 + 4500 * (t - 150) - 0.5 * 9.8 * (t - 150) * (t - 150);
    
    // Add some noise and anomalies
    const noise = (Math.random() - 0.5) * 10;
    // Artificial anomaly around T+120 (widened slightly for 0.1s sampling)
    const anomaly = Math.abs(t - 120) < 0.5 ? 500 : 0; 

    data.push({
      timestamp: t,
      altitude: Math.max(0, altitude + noise),
      velocity: isPowered ? 30 * t : 4500 - 9.8 * (t - 150),
      acceleration: isPowered ? 30 + Math.random() : -9.8 + Math.random(),
      temp_engine: isPowered ? 800 + t * 2 + anomaly : 1100 - (t - 150) * (t - 150) / 50, // Fixed formula typo
      pressure: Math.max(0, (0.5 * 1.225 * Math.pow(isPowered ? 30 * t : 4500, 2)) / 1000 * Math.exp(-altitude / 8000)),
    });
  }
  return data;
};
