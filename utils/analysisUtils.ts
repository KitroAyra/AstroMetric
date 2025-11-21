import { DataPoint, Anomaly, MetricConfig } from '../types';

export const parseCSV = (csvContent: string, metrics: MetricConfig[]): DataPoint[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const result: DataPoint[] = [];

  // Map CSV headers to metric IDs
  const metricMap: Record<number, string> = {};
  headers.forEach((h, index) => {
    if (h.includes('time') || h.includes('sec')) {
      metricMap[index] = 'timestamp';
    } else {
      const found = metrics.find(m => h.includes(m.name.toLowerCase()) || h.includes(m.id));
      if (found) metricMap[index] = found.id;
    }
  });

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 2) continue;

    const point: any = {};
    let hasTime = false;

    values.forEach((v, idx) => {
      if (metricMap[idx]) {
        const num = parseFloat(v.trim());
        if (!isNaN(num)) {
          point[metricMap[idx]] = num;
          if (metricMap[idx] === 'timestamp') hasTime = true;
        }
      }
    });

    // Auto-generate timestamp if missing, assuming 1Hz
    if (!hasTime) point.timestamp = i;
    
    if (Object.keys(point).length > 1) {
        result.push(point);
    }
  }
  return result;
};

export const detectAnomalies = (data: DataPoint[], metrics: MetricConfig[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  metrics.forEach(metric => {
    // Extract values
    const values = data.map(d => d[metric.id]).filter(v => v !== undefined);
    if (values.length === 0) return;

    // Calculate Mean and StdDev
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sqDiff = values.map(v => Math.pow(v - mean, 2));
    const stdDev = Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / values.length);

    // Identify outliers (Z-score > 3)
    data.forEach(point => {
        if (point[metric.id] === undefined) return;
        const zScore = Math.abs((point[metric.id] - mean) / (stdDev || 1)); // Avoid divide by zero
        
        if (zScore > 3) {
            anomalies.push({
                timestamp: point.timestamp,
                metricId: metric.id,
                value: point[metric.id],
                zScore,
                severity: zScore > 5 ? 'high' : 'medium'
            });
        }
    });
  });

  return anomalies;
};

export const summarizeDataForAI = (data: DataPoint[], metrics: MetricConfig[], anomalies: Anomaly[]): string => {
  const summaryLines: string[] = [];
  summaryLines.push(`飞行时长: ${data[data.length-1]?.timestamp.toFixed(1)} 秒。`);
  summaryLines.push(`分析指标: ${metrics.map(m => m.name).join(', ')}。`);
  summaryLines.push(`检测到的异常总数: ${anomalies.length}。`);
  
  metrics.forEach(m => {
      const vals = data.map(d => d[m.id]).filter(v => v !== undefined);
      if(vals.length > 0) {
        const max = Math.max(...vals);
        const min = Math.min(...vals);
        summaryLines.push(`- ${m.name}: 最大值 ${max.toFixed(2)}${m.unit}, 最小值 ${min.toFixed(2)}${m.unit}。`);
      }
  });

  if (anomalies.length > 0) {
      summaryLines.push("\n显著异常:");
      anomalies.slice(0, 10).forEach(a => {
          summaryLines.push(`- T+${a.timestamp.toFixed(1)}s: ${a.metricId} 数值 ${a.value.toFixed(2)} (Z-Score: ${a.zScore.toFixed(1)})`);
      });
  }

  return summaryLines.join('\n');
};

export const summarizeRangeData = (data: DataPoint[], metrics: MetricConfig[], startIdx: number, endIdx: number): string => {
    const slice = data.slice(startIdx, endIdx + 1);
    if (slice.length === 0) return "该范围内无数据。";

    const summary: string[] = [];
    const startTime = slice[0].timestamp;
    const endTime = slice[slice.length - 1].timestamp;

    summary.push(`时间范围: T+${startTime.toFixed(1)}s 到 T+${endTime.toFixed(1)}s`);
    summary.push(`分析指标: ${metrics.map(m => m.name).join(', ')}`);
    
    metrics.forEach(m => {
        const values = slice.map(d => d[m.id] || 0);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a,b) => a+b,0) / values.length;
        summary.push(`- ${m.name}: 最小 ${min.toFixed(2)}, 最大 ${max.toFixed(2)}, 平均 ${avg.toFixed(2)} ${m.unit}`);
    });

    summary.push("\n采样数据点 (用于趋势分析):");
    const steps = 5;
    const stepSize = Math.max(1, Math.floor(slice.length / steps));
    
    for(let i = 0; i < slice.length; i += stepSize) {
        const d = slice[i];
        const pointStr = metrics.map(m => `${m.name}: ${d[m.id]?.toFixed(2)}`).join(', ');
        summary.push(`@ T+${d.timestamp.toFixed(1)}s: ${pointStr}`);
    }

    return summary.join('\n');
};