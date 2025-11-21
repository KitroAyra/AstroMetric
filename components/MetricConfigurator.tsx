import React, { useState } from 'react';
import { MetricConfig } from '../types';
import { Plus, X, RotateCcw } from 'lucide-react';
import { DEFAULT_METRICS } from '../constants';

interface Props {
  metrics: MetricConfig[];
  setMetrics: (m: MetricConfig[]) => void;
}

export const MetricConfigurator: React.FC<Props> = ({ metrics, setMetrics }) => {
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('');

  const toggleMetric = (id: string) => {
     setMetrics(metrics.filter(m => m.id !== id));
  };

  const addMetric = () => {
    if (!newMetricName) return;
    const id = newMetricName.toLowerCase().replace(/\s+/g, '_');
    const newMetric: MetricConfig = {
        id,
        name: newMetricName,
        unit: newMetricUnit,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
        isDefault: false
    };
    setMetrics([...metrics, newMetric]);
    setNewMetricName('');
    setNewMetricUnit('');
  };

  const resetToDefault = () => {
      setMetrics(DEFAULT_METRICS);
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
            配置
            <span className="text-xs text-slate-500 font-normal uppercase tracking-wider border border-slate-700 px-2 py-0.5 rounded">阶段 1</span>
        </h2>
        <button onClick={resetToDefault} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
            <RotateCcw size={14} /> 重置默认
        </button>
      </div>

      <div className="space-y-4">
        {/* Active Metrics List */}
        <div className="flex flex-wrap gap-2">
            {metrics.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                    <span className="text-slate-200">{m.name} <span className="text-slate-500">({m.unit})</span></span>
                    <button onClick={() => toggleMetric(m.id)} className="text-slate-500 hover:text-red-400 ml-1">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>

        {/* Add New Metric */}
        <div className="flex gap-2 mt-4 border-t border-slate-700 pt-4">
            <input 
                type="text" 
                placeholder="指标名称 (如: 舱压)" 
                className="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
            />
            <input 
                type="text" 
                placeholder="单位 (如: bar)" 
                className="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg w-24 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={newMetricUnit}
                onChange={(e) => setNewMetricUnit(e.target.value)}
            />
            <button 
                onClick={addMetric}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
                <Plus size={16} /> 添加
            </button>
        </div>
      </div>
    </div>
  );
};