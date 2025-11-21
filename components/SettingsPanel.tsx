
import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Server, Key, Cpu } from 'lucide-react';
import { ModelSettings } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ModelSettings;
  onSave: (settings: ModelSettings) => void;
}

export const SettingsPanel: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ModelSettings>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-blue-400" />
            后台模型配置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* API Key Status (ReadOnly) */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-500 font-bold flex items-center gap-2">
              <Key size={12} />
              API 认证
            </label>
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-sm text-slate-400 font-mono">API Key</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                已通过 Env 安全加载
              </span>
            </div>
            <p className="text-[10px] text-slate-600">
              出于安全考虑，API 密钥由环境变量 (process.env.API_KEY) 统一管理，不可在前端修改。
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-500 font-bold flex items-center gap-2">
              <Server size={12} />
              模型选择
            </label>
            <div className="relative">
              <select
                value={localSettings.modelName}
                onChange={(e) => setLocalSettings({ ...localSettings, modelName: e.target.value })}
                className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Thinking Budget */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-500 font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={12} />
                思考预算 (Thinking Budget)
              </div>
              <span className="text-blue-400 font-mono">{localSettings.thinkingBudget} Tokens</span>
            </label>
            <input
              type="range"
              min="0"
              max="16000"
              step="128"
              value={localSettings.thinkingBudget}
              onChange={(e) => setLocalSettings({ ...localSettings, thinkingBudget: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              增加预算可提升复杂问题的推理能力，但会增加响应延迟。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
