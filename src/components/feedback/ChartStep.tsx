"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#14b8a6", "#a855f7", "#e11d48"];

interface DimensionResult {
  name: string;
  column: string;
  type: string;
  data: Array<{ label: string; count: number; percent: number }>;
  insight: string;
}

interface AnalysisResult {
  summary: { total: number; analyzed: number };
  dimensions: DimensionResult[];
  topInsights: string[];
}

interface Props {
  result: AnalysisResult;
  onExport: (format: string) => void;
  onExportReport: () => void;
  onBack: () => void;
}

export default function ChartStep({ result, onExport, onExportReport, onBack }: Props) {
  return (
    <div className="space-y-6">
      {/* 概览 */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">分析结果</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onExport("xlsx")}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              导出 Excel
            </button>
            <button
              onClick={onExportReport}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              导出 PDF 报告
            </button>
          </div>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{result.summary?.total || 0}</p>
            <p className="text-xs text-text-secondary mt-1">总数据量</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{result.dimensions?.length || 0}</p>
            <p className="text-xs text-text-secondary mt-1">分析维度</p>
          </div>
        </div>

        {/* 核心洞察 */}
        {result.topInsights && result.topInsights.length > 0 && (
          <div className="bg-primary/5 rounded-lg p-4 mb-2">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <span>💡</span> 核心洞察
            </h4>
            <ul className="space-y-1.5">
              {result.topInsights.map((insight, i) => (
                <li key={i} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-primary font-semibold">{i + 1}.</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 每个维度的图表 */}
      {result.dimensions?.map((dim, dimIdx) => (
        <DimensionChart key={dim.name} dim={dim} index={dimIdx} />
      ))}

      {/* 底部操作 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors">
          重新分析
        </button>
        <div className="flex gap-2">
          <button onClick={() => onExport("csv")} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors">
            导出 CSV
          </button>
          <button onClick={() => onExport("xlsx")} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            导出 Excel
          </button>
        </div>
      </div>
    </div>
  );
}

function DimensionChart({ dim, index }: { dim: DimensionResult; index: number }) {
  const data = dim.data || [];
  const maxItems = 15;
  const displayData = data.slice(0, maxItems);

  // 决定用饼图还是柱状图
  const usePie = data.length <= 8 && (dim.type === "distribution" || dim.type === "sentiment");

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold">{dim.name}</h4>
        <span className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded">{dim.column}</span>
      </div>
      {dim.insight && (
        <p className="text-sm text-text-secondary mb-4">{dim.insight}</p>
      )}

      <div className="flex gap-6">
        {/* 图表 */}
        <div className="flex-1" style={{ minHeight: usePie ? 280 : Math.max(200, displayData.length * 35) }}>
          <ResponsiveContainer width="100%" height="100%">
            {usePie ? (
              <PieChart>
                <Pie
                  data={displayData.map((d) => ({ name: d.label, value: d.count }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  dataKey="value"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={((props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
                >
                  {displayData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <BarChart
                data={displayData.map((d) => ({ name: d.label, count: d.count, percent: d.percent }))}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => name === "count" ? [value, "数量"] : [value, name]) as any}
                />
                <Bar dataKey="count" fill={COLORS[index % COLORS.length]} radius={[0, 4, 4, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 数据表格 */}
        <div className="w-56 flex-shrink-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 font-medium text-text-secondary">分类</th>
                <th className="text-right py-1.5 font-medium text-text-secondary">数量</th>
                <th className="text-right py-1.5 font-medium text-text-secondary">占比</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((d, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[120px]" title={d.label}>{d.label}</span>
                  </td>
                  <td className="text-right py-1.5 font-mono">{d.count}</td>
                  <td className="text-right py-1.5 font-mono">{d.percent}%</td>
                </tr>
              ))}
              {data.length > maxItems && (
                <tr>
                  <td colSpan={3} className="py-1.5 text-text-secondary text-center">
                    +{data.length - maxItems} 更多...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
