
import React, { useState, useCallback } from 'react';
import { MetricConfig, DataPoint, Anomaly, AnalysisReport as AnalysisReportType, ModelSettings } from './types';
import { DEFAULT_METRICS, generateDemoData, DEFAULT_MODEL_SETTINGS } from './constants';
import { MetricConfigurator } from './components/MetricConfigurator';
import { Visualization } from './components/Visualization';
import { AIChat } from './components/AIChat';
import { SettingsPanel } from './components/SettingsPanel';
import { parseCSV, detectAnomalies, summarizeDataForAI, summarizeRangeData } from './utils/analysisUtils';
import { analyzeFlightTelemetry, analyzeRangeTelemetry } from './services/geminiService';
import { Rocket, Upload, Activity, BrainCircuit, CheckCircle, X, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricConfig[]>(DEFAULT_METRICS);
  const [data, setData] = useState<DataPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisReportType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataSummary, setDataSummary] = useState<string>('');
  
  // Model Config State
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Range Analysis State
  const [isAnalyzingRange, setIsAnalyzingRange] = useState(false);
  const [rangeAnalysisResult, setRangeAnalysisResult] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      processData(text);
    };
    reader.readAsText(file);
  };

  const loadDemoData = () => {
    const demo = generateDemoData();
    runPipeline(demo);
  };

  const processData = (csvText: string) => {
    const parsed = parseCSV(csvText, metrics);
    runPipeline(parsed);
  };

  const runPipeline = useCallback(async (rawData: DataPoint[]) => {
    setData(rawData);
    setAnalysis(null); // Reset global analysis
    setRangeAnalysisResult(null); 
    
    // 1. Detect Anomalies (Client Side)
    const detected = detectAnomalies(rawData, metrics);
    setAnomalies(detected);

    // 2. Summarize for AI
    const summary = summarizeDataForAI(rawData, metrics, detected);
    setDataSummary(summary);

    // 3. AI Analysis
    setIsAnalyzing(true);
    const report = await analyzeFlightTelemetry(summary, modelSettings);
    setAnalysis(report);
    setIsAnalyzing(false);
  }, [metrics, modelSettings]); // Re-run pipeline logic if needed, though usually triggered by data load. 
  // Note: changing settings doesn't auto re-run pipeline unless user re-uploads or manually triggers, 
  // but we can allow it to apply to next actions.

  const handleRangeAnalysis = async (startIdx: number, endIdx: number, selectedMetricIds: string[]) => {
      setIsAnalyzingRange(true);
      const selectedMetrics = metrics.filter(m => selectedMetricIds.includes(m.id));
      const summary = summarizeRangeData(data, selectedMetrics, startIdx, endIdx);
      const result = await analyzeRangeTelemetry(summary, modelSettings);
      setRangeAnalysisResult(result);
      setIsAnalyzingRange(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-[#020617]/90 backdrop-blur sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow shadow-blue-500/50">
                <Rocket className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">AstroMetric</h1>
                <p className="text-xs text-slate-400 font-mono">飞行遥测分析仪</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             {data.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
                    {isAnalyzing ? 'AI 分析中...' : '系统就绪'}
                </div>
             )}
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="模型配置"
             >
                <Settings size={20} />
             </button>
        </div>
      </nav>

      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Config & Global Analysis */}
            <div className="lg:col-span-4 space-y-6">
                <MetricConfigurator metrics={metrics} setMetrics={setMetrics} />
                
                {/* Data Ingest Card */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
                            数据导入
                            <span className="text-xs text-slate-500 font-normal uppercase tracking-wider border border-slate-700 px-2 py-0.5 rounded">阶段 2</span>
                        </h2>
                    </div>
                    
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 transition-colors bg-slate-950/50">
                        <Upload className="text-slate-500" size={32} />
                        <div className="text-center">
                            <p className="text-slate-300 font-medium">上传遥测 CSV 文件</p>
                            <p className="text-xs text-slate-500 mt-1">表头必须与指标名称匹配</p>
                        </div>
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
                            选择文件
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </label>
                        <div className="text-xs text-slate-600 font-mono">或</div>
                        <button onClick={loadDemoData} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4">
                            生成模拟数据
                        </button>
                    </div>
                </div>

                {/* Global Mission Report */}
                {analysis && (
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold text-purple-400 flex items-center gap-2">
                                <BrainCircuit size={20} />
                                任务报告
                            </h2>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                analysis.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                analysis.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                                {analysis.status === 'success' ? '正常' : analysis.status === 'warning' ? '警告' : '严重'}
                            </span>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <p className="text-slate-300 leading-relaxed italic border-l-2 border-purple-500/30 pl-3">
                                "{analysis.summary}"
                            </p>
                            
                            <div>
                                <h4 className="text-slate-500 font-semibold uppercase text-xs mb-2">关键见解</h4>
                                <ul className="space-y-2">
                                    {analysis.keyInsights.map((insight, i) => (
                                        <li key={i} className="flex gap-2 text-slate-300">
                                            <Activity size={14} className="mt-0.5 text-blue-400 shrink-0" />
                                            {insight}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                             <div>
                                <h4 className="text-slate-500 font-semibold uppercase text-xs mb-2">建议</h4>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li key={i} className="flex gap-2 text-slate-300">
                                            <CheckCircle size={14} className="mt-0.5 text-green-400 shrink-0" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Visualization & Deep Dive */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Chart Section */}
                <div className="h-[500px] min-h-[400px]">
                    {data.length > 0 ? (
                        <Visualization 
                            data={data} 
                            metrics={metrics} 
                            anomalies={anomalies}
                            onAnalyzeRange={handleRangeAnalysis}
                            isAnalyzingRange={isAnalyzingRange}
                        />
                    ) : (
                        <div className="h-full rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-slate-600 p-12 text-center">
                            <Activity size={64} className="mb-4 opacity-20" />
                            <h3 className="text-xl font-semibold text-slate-500">等待遥测数据</h3>
                            <p className="max-w-md mt-2 opacity-60">配置指标并上传数据以开始分析。系统将自动识别异常并生成任务报告。</p>
                        </div>
                    )}
                </div>

                {/* Range Analysis Result Card */}
                {rangeAnalysisResult && (
                    <div className="bg-purple-900/10 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 relative">
                        <button 
                            onClick={() => setRangeAnalysisResult(null)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                            <BrainCircuit size={18} />
                            联合区间分析
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            <p>{rangeAnalysisResult}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Floating Chat Bot */}
      {data.length > 0 && <AIChat contextSummary={dataSummary} modelSettings={modelSettings} />}
      
      {/* Settings Modal */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={modelSettings} 
        onSave={setModelSettings}
      />
      
    </div>
  );
};

export default App;
