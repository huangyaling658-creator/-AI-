"use client";

import { useState } from "react";

export interface Dimension {
  name: string;
  description: string;
  supported: boolean;
  reason: string;
}

interface Props {
  dimensions: Dimension[];
  loading: boolean;
  onStart: (selected: string[]) => void;
  onBack: () => void;
}

export default function DimensionStep({ dimensions, loading, onStart, onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(dimensions.filter((d) => d.supported).map((d) => d.name))
  );
  const [customInput, setCustomInput] = useState("");
  const [customDimensions, setCustomDimensions] = useState<string[]>([]);

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !customDimensions.includes(val)) {
      setCustomDimensions([...customDimensions, val]);
      setSelected(new Set([...selected, val]));
      setCustomInput("");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="animate-spin inline-block w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full mb-4" />
        <p className="text-sm text-text-secondary">AI 正在分析数据特征，推荐分析维度...</p>
      </div>
    );
  }

  const allNames = [...dimensions.map((d) => d.name), ...customDimensions];

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-1">选择分析维度</h3>
        <p className="text-sm text-text-secondary mb-4">AI 已根据数据特征推荐以下维度，你也可以自定义新增</p>

        <div className="grid grid-cols-2 gap-3">
          {dimensions.map((d) => (
            <button
              key={d.name}
              onClick={() => d.supported && toggle(d.name)}
              disabled={!d.supported}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                !d.supported
                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  : selected.has(d.name)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  selected.has(d.name)
                    ? "border-primary bg-primary"
                    : "border-gray-300"
                }`}>
                  {selected.has(d.name) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-semibold">{d.name}</span>
              </div>
              <p className="text-xs text-text-secondary ml-6">{d.description}</p>
              {!d.supported && (
                <p className="text-xs text-amber-600 mt-1 ml-6">{d.reason}</p>
              )}
            </button>
          ))}

          {/* Custom dimensions */}
          {customDimensions.map((name) => (
            <button
              key={name}
              onClick={() => toggle(name)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected.has(name) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  selected.has(name) ? "border-primary bg-primary" : "border-gray-300"
                }`}>
                  {selected.has(name) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-semibold">{name}</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-auto">自定义</span>
              </div>
            </button>
          ))}
        </div>

        {/* Add custom dimension */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="输入自定义分析维度..."
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            新增
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          上一步
        </button>
        <button
          onClick={() => onStart(allNames.filter((n) => selected.has(n)))}
          disabled={selected.size === 0}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          开始分析（已选 {selected.size} 个维度）
        </button>
      </div>
    </div>
  );
}
