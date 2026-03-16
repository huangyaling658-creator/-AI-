"use client";

import { useState } from "react";

export default function DataPage() {
  const [uploaded, setUploaded] = useState(false);
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult(true);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">数据分析</h1>
        <p className="text-text-secondary mt-1">上传数据文件，用自然语言提问，AI自动分析并生成洞察</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Upload & Query */}
        <div className="col-span-1 space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-3">数据源</h3>
            {!uploaded ? (
              <div
                onClick={() => setUploaded(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-all"
              >
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs font-medium">上传数据文件</p>
                <p className="text-xs text-text-secondary mt-1">.csv / .xlsx</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium">user_behavior_202403.csv</p>
                  <p className="text-xs text-text-secondary">12,580 行数据</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-3">提问</h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="用自然语言描述你想了解什么，例如：&#10;- 上周DAU的变化趋势是什么？&#10;- 哪个渠道的用户留存最好？&#10;- 付费转化率下降的原因可能是什么？"
              rows={5}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <button
              onClick={handleAnalyze}
              disabled={!uploaded || analyzing}
              className="w-full mt-3 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  分析中...
                </>
              ) : (
                "开始分析"
              )}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="col-span-2">
          {!result ? (
            <div className="bg-surface rounded-xl border border-border p-12 text-center h-full flex items-center justify-center">
              <div>
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm text-text-secondary">上传数据并提问后，分析结果将在这里展示</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-surface rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-3">分析结论</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  过去一周DAU整体呈下降趋势，从周一的12,340下降至周日的10,856，降幅约12%。
                  主要原因是新用户次日留存率从35%降至28%，老用户活跃度基本持平。
                  建议关注新用户引导流程和首日体验。
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-3">数据可视化</h3>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-border">
                  <div className="flex items-end gap-3 h-32">
                    {[85, 78, 72, 80, 68, 65, 60].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 bg-primary/70 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-xs text-text-secondary">
                          {["一", "二", "三", "四", "五", "六", "日"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-surface rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-3">关键指标</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "周均DAU", value: "11,423", change: "-12%" },
                    { label: "新用户留存", value: "28%", change: "-7pp" },
                    { label: "人均使用时长", value: "18.5min", change: "+2%" },
                  ].map((m) => (
                    <div key={m.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-text-secondary">{m.label}</p>
                      <p className="text-lg font-bold mt-1">{m.value}</p>
                      <p className={`text-xs mt-0.5 ${m.change.startsWith("-") ? "text-red-500" : "text-green-500"}`}>
                        {m.change}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
