"use client";

import { useState, useEffect } from "react";

export interface Dimension {
  name: string;
  description: string;
  column: string;
  analysisType: "distribution" | "classification" | "cross" | "painpoint";
  supported: boolean;
  reason: string;
  presetValues?: string[];
}

interface Props {
  dimensions: Dimension[];
  loading: boolean;
  onStart: (selected: Dimension[]) => void;
  onBack: () => void;
}

const typeIcons: Record<string, string> = {
  distribution: "📊",
  classification: "🏷️",
  cross: "🔀",
  painpoint: "🎯",
};

const typeLabels: Record<string, string> = {
  distribution: "分布统计",
  classification: "AI语义分类",
  cross: "交叉分析",
  painpoint: "痛点总结",
};

export default function DimensionStep({ dimensions, loading, onStart, onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState("");
  const [customDimensions, setCustomDimensions] = useState<Dimension[]>([]);

  // 默认全选 supported 的维度
  useEffect(() => {
    if (dimensions.length > 0) {
      setSelected(new Set(dimensions.filter((d) => d.supported !== false).map((d) => d.name)));
    }
  }, [dimensions]);

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !customDimensions.some((d) => d.name === val)) {
      const newDim: Dimension = {
        name: val,
        description: "用户自定义分析维度",
        column: "_custom",
        analysisType: "classification",
        supported: true,
        reason: "自定义",
      };
      setCustomDimensions([...customDimensions, newDim]);
      setSelected(new Set([...selected, val]));
      setCustomInput("");
    }
  };

  const allDims = [...dimensions, ...customDimensions];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="animate-spin inline-block w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full mb-4" />
        <p className="text-sm text-text-secondary">正在分析数据结构...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-1">选择分析维度</h3>
        <p className="text-sm text-text-secondary mb-4">
          已根据表格列结构自动推荐 {dimensions.length} 个分析维度，你也可以自定义新增
        </p>

        <div className="grid grid-cols-2 gap-3">
          {allDims.map((d) => (
            <button
              key={d.name}
              onClick={() => toggle(d.name)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected.has(d.name)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  selected.has(d.name) ? "border-primary bg-primary" : "border-gray-300"
                }`}>
                  {selected.has(d.name) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-semibold">{d.name}</span>
                <span className="text-xs ml-auto flex items-center gap-1">
                  <span>{typeIcons[d.analysisType] || "📋"}</span>
                  <span className="text-text-secondary">{typeLabels[d.analysisType] || d.analysisType}</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary ml-6">{d.description}</p>
              {d.presetValues && d.presetValues.length > 0 && (
                <div className="mt-2 ml-6 flex flex-wrap gap-1">
                  {d.presetValues.slice(0, 6).map((v) => (
                    <span key={v} className="text-xs bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded">{v}</span>
                  ))}
                  {d.presetValues.length > 6 && (
                    <span className="text-xs text-text-secondary">+{d.presetValues.length - 6}</span>
                  )}
                </div>
              )}
              <p className="text-xs text-text-secondary mt-1 ml-6 opacity-70">{d.reason}</p>
            </button>
          ))}
        </div>

        {/* 自定义维度 */}
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

      {/* 操作 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors">
          上一步
        </button>
        <button
          onClick={() => onStart(allDims.filter((d) => selected.has(d.name)))}
          disabled={selected.size === 0}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          开始分析（已选 {selected.size} 个维度）
        </button>
      </div>
    </div>
  );
}
