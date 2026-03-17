"use client";

import { useState, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface AnalysisResult {
  summary: { total: number; valid: number; deduplicated: number };
  categories: Array<{ name: string; count: number; percent: number; feedbackIds: number[] }>;
  sentiments: {
    positive: { count: number; percent: number };
    negative: { count: number; percent: number };
    neutral: { count: number; percent: number };
  };
  topIssues: Array<{ issue: string; count: number; sentiment: string; keywords: string[] }>;
  keywords: Array<{ word: string; count: number }>;
  feedbacks: Array<{
    id: number; content: string; category: string;
    sentiment: string; sentimentScore: number; keywords: string[];
  }>;
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#6366F1"];
const SENTIMENT_COLORS = { positive: "#10B981", negative: "#EF4444", neutral: "#9CA3AF" };

interface Props {
  result: AnalysisResult;
  onExport: (format: string) => void;
  onExportReport: () => void;
  onBack: () => void;
}

export default function ChartStep({ result, onExport, onExportReport, onBack }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  const sentimentData = [
    { name: "正面", value: result.sentiments.positive.count, color: SENTIMENT_COLORS.positive },
    { name: "负面", value: result.sentiments.negative.count, color: SENTIMENT_COLORS.negative },
    { name: "中立", value: result.sentiments.neutral.count, color: SENTIMENT_COLORS.neutral },
  ];

  const categoryData = result.categories.map((c, i) => ({
    name: c.name,
    count: c.count,
    fill: COLORS[i % COLORS.length],
  }));

  // 获取分类下的原始反馈
  const getExpandedFeedbacks = () => {
    if (!expandedCategory) return [];
    const cat = result.categories.find((c) => c.name === expandedCategory);
    if (!cat) return [];
    return cat.feedbackIds
      .map((id) => result.feedbacks.find((f) => f.id === id))
      .filter(Boolean)
      .slice(0, 20);
  };

  return (
    <div className="space-y-6" ref={chartAreaRef}>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{result.summary.total}</p>
          <p className="text-xs text-text-secondary mt-1">原始反馈数</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{result.summary.valid}</p>
          <p className="text-xs text-text-secondary mt-1">有效反馈数</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{result.summary.deduplicated}</p>
          <p className="text-xs text-text-secondary mt-1">去重后数量</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Category bar chart */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">反馈分类分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="数量" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.fill}
                    cursor="pointer"
                    onClick={() => setExpandedCategory(
                      expandedCategory === entry.name ? null : entry.name
                    )}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment pie chart */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">情感分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={((props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expanded category feedbacks (原文溯源) */}
      {expandedCategory && (
        <div className="bg-surface rounded-xl border border-primary/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              「{expandedCategory}」原始反馈
              <span className="text-sm text-text-secondary font-normal ml-2">
                （点击柱状图切换分类）
              </span>
            </h3>
            <button
              onClick={() => setExpandedCategory(null)}
              className="text-sm text-text-secondary hover:text-text"
            >
              收起
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {getExpandedFeedbacks().map((f) =>
              f ? (
                <div key={f.id} className="flex gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                    f.sentiment === "positive" ? "bg-green-100 text-green-700" :
                    f.sentiment === "negative" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {f.sentiment === "positive" ? "正面" : f.sentiment === "negative" ? "负面" : "中立"}
                  </span>
                  <p>{f.content}</p>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Keywords (word cloud alternative - tag cloud) */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">高频关键词</h3>
        <div className="flex flex-wrap gap-2">
          {result.keywords.slice(0, 20).map((kw, i) => {
            const maxCount = result.keywords[0]?.count || 1;
            const ratio = kw.count / maxCount;
            const size = ratio > 0.7 ? "text-lg" : ratio > 0.4 ? "text-base" : "text-sm";
            const opacity = ratio > 0.7 ? "bg-primary/20 text-primary" : ratio > 0.4 ? "bg-primary/10 text-primary/80" : "bg-gray-100 text-text-secondary";
            return (
              <span
                key={i}
                className={`inline-block px-3 py-1.5 rounded-full font-medium ${size} ${opacity}`}
              >
                {kw.word}
                <span className="text-xs ml-1 opacity-60">{kw.count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Top issues */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">高频问题 TOP {Math.min(10, result.topIssues.length)}</h3>
        <div className="space-y-3">
          {result.topIssues.slice(0, 10).map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <span className={`text-lg font-bold w-8 text-center flex-shrink-0 ${
                i < 3 ? "text-primary" : "text-text-secondary"
              }`}>
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.issue}</p>
                <div className="flex gap-1 mt-1">
                  {item.keywords.map((kw) => (
                    <span key={kw} className="text-xs bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                item.sentiment === "positive" ? "bg-green-100 text-green-700" :
                item.sentiment === "negative" ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {item.sentiment === "positive" ? "正面" : item.sentiment === "negative" ? "负面" : "中立"}
              </span>
              <span className="text-sm font-semibold w-14 text-right flex-shrink-0">{item.count} 次</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown (饼图) */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">分类占比</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={result.categories.map((c) => ({ name: c.name, value: c.count }))}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={((props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(1)}%`) as any}
            >
              {result.categories.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-surface rounded-xl border border-border p-4">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          重新分析
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => onExport("csv")}
            className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            下载标注数据 (CSV)
          </button>
          <button
            onClick={() => onExport("xlsx")}
            className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            下载标注数据 (Excel)
          </button>
          <button
            onClick={onExportReport}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            导出 PDF 报告
          </button>
        </div>
      </div>
    </div>
  );
}
