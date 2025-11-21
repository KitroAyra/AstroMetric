import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Brush } from 'recharts';
import { DataPoint, MetricConfig, Anomaly } from '../types';
import { AlertCircle, BrainCircuit, Check } from 'lucide-react';

interface Props {
  data: DataPoint[];
  metrics: MetricConfig[];
  anomalies: Anomaly[];
  onAnalyzeRange?: (startIndex: number, endIndex: number, selectedMetricIds: string[]) => void;
  isAnalyzingRange?: boolean;
}

export const Visualization: React.FC<Props> = ({ data, metrics, anomalies, onAnalyzeRange, isAnalyzingRange }) => {
  // Default to first metric if available
  const [activeMetricIds, setActiveMetricIds] = useState<string[]>(metrics.length > 0 ? [metrics[0].id] : []);
  const [brushRange, setBrushRange] = useState<{startIndex: number, endIndex: number}>({ startIndex: 0, endIndex: data.length - 1 });

  useEffect(() => {
      // Reset range when data changes significantly
      setBrushRange({ startIndex: 0, endIndex: data.length - 1 });
  }, [data.length]);

  const toggleMetric = (id: string) => {
    setActiveMetricIds(prev => {
        if (prev.includes(id)) {
            return prev.filter(m => m !== id);
        } else {
            return [...prev, id];
        }
    });
  };

  const handleAnalyzeClick = () => {
      if (onAnalyzeRange && activeMetricIds.length > 0) {
          onAnalyzeRange(brushRange.startIndex, brushRange.endIndex, activeMetricIds);
      }
  };

  const activeMetrics = metrics.filter(m => activeMetricIds.includes(m.id));
  
  // Filter anomalies to only those relevant to selected metrics and within range (visual helper)
  const startTime = data[brushRange.startIndex]?.timestamp || 0;
  const endTime = data[brushRange.endIndex]?.timestamp || 0;
  
  const relevantAnomalies = anomalies.filter(a => 
      activeMetricIds.includes(a.metricId) && 
      a.timestamp >= startTime && 
      a.timestamp <= endTime
  );

  // Color palette for lines if metric doesn't have one (fallback)
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 h-full flex flex-col backdrop-blur-sm relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            {/* Metric Toggles */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
                {metrics.map(m => (
                    <button
                        key={m.id}
                        onClick={() => toggleMetric(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeMetricIds.includes(m.id)
                            ? 'bg-slate-800 text-white border border-slate-600 shadow-sm shadow-black' 
                            : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:bg-slate-800'
                        }`}
                        style={activeMetricIds.includes(m.id) ? { borderLeft: `3px solid ${m.color}` } : {}}
                    >
                        {m.name}
                        {activeMetricIds.includes(m.id) && <Check size={12} />}
                    </button>
                ))}
            </div>

            {/* Range Analysis Button */}
            <div className="flex items-center gap-2">
                 <div className="text-xs text-slate-500 font-mono mr-2 hidden lg:block">
                    窗口: T+{startTime.toFixed(1)}s - T+{endTime.toFixed(1)}s
                 </div>
                 <button 
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzingRange || activeMetricIds.length === 0}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20"
                 >
                    {isAnalyzingRange ? (
                        <BrainCircuit size={16} className="animate-pulse" />
                    ) : (
                        <BrainCircuit size={16} />
                    )}
                    {isAnalyzingRange ? '分析中...' : '区间分析'}
                 </button>
            </div>
        </div>

        <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                        dataKey="timestamp" 
                        stroke="#64748b" 
                        tick={{fontSize: 12}} 
                        minTickGap={30}
                        tickFormatter={(val) => `${Number(val).toFixed(1)}`}
                    />
                    
                    {/* Primary Y Axis */}
                    <YAxis 
                        yAxisId="left"
                        stroke="#64748b" 
                        tick={{fontSize: 12}} 
                        orientation="left"
                    />
                    
                    {/* Secondary Y Axis (Only if we have more than 1 metric to attempt separate scaling) */}
                    {activeMetricIds.length > 1 && (
                         <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="#475569"
                            tick={{fontSize: 12}} 
                         />
                    )}

                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: number, name: string) => [value.toFixed(2), name]}
                        labelFormatter={(label) => `T+${Number(label).toFixed(1)}s`}
                    />
                    <Legend />
                    
                    {activeMetrics.map((m, index) => (
                        <Line 
                            key={m.id}
                            yAxisId={index === 0 ? "left" : "right"} // Simple heuristic: 1st on left, others on right. 
                            type="monotone" 
                            dataKey={m.id} 
                            stroke={m.color || colors[index % colors.length]} 
                            strokeWidth={2} 
                            dot={false}
                            activeDot={{ r: 5 }}
                            name={m.name}
                            isAnimationActive={false}
                        />
                    ))}

                    {relevantAnomalies.map((anomaly, idx) => {
                        // Find which axis this anomaly belongs to
                        const metricIndex = activeMetrics.findIndex(m => m.id === anomaly.metricId);
                        const axisId = metricIndex === 0 ? "left" : "right";
                        
                        return (
                            <ReferenceDot 
                                key={idx} 
                                yAxisId={axisId}
                                x={anomaly.timestamp} 
                                y={anomaly.value} 
                                r={4} 
                                fill="#ef4444" 
                                stroke="#fff"
                                strokeWidth={1}
                            />
                        );
                    })}
                    
                    <Brush 
                        dataKey="timestamp" 
                        height={30} 
                        stroke="#475569" 
                        fill="#1e293b" 
                        tickFormatter={(val) => `T+${Number(val).toFixed(0)}`}
                        onChange={(newRange) => {
                            if (newRange && typeof newRange.startIndex === 'number' && typeof newRange.endIndex === 'number') {
                                setBrushRange({ startIndex: newRange.startIndex, endIndex: newRange.endIndex });
                            }
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
        
        {/* Anomaly List specifically for this chart view */}
        {relevantAnomalies.length > 0 && (
            <div className="mt-4 bg-red-950/30 border border-red-900/30 rounded p-3 flex items-start gap-3 overflow-hidden">
                <div className="p-1.5 bg-red-900/20 rounded text-red-400 shrink-0">
                    <AlertCircle size={16} />
                </div>
                <div className="flex-1">
                    <h4 className="text-red-300 text-xs font-semibold uppercase mb-1">
                         可见异常 ({relevantAnomalies.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {relevantAnomalies.slice(0, 5).map((a, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-red-900/40 border border-red-900/50 rounded text-red-200">
                                T+{a.timestamp.toFixed(1)}s: {activeMetrics.find(m=>m.id===a.metricId)?.name} ({a.value.toFixed(1)})
                            </span>
                        ))}
                        {relevantAnomalies.length > 5 && <span className="text-xs text-red-400 mt-0.5">...</span>}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};