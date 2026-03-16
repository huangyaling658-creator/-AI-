"use client";

import { useState } from "react";

const mockFeedbacks = [
  { source: "App Store", count: 234, icon: "🍎" },
  { source: "客服工单", count: 89, icon: "🎫" },
  { source: "社群反馈", count: 156, icon: "💬" },
];

const mockCategories = [
  { name: "功能需求", count: 87, percent: 36, color: "bg-blue-500" },
  { name: "Bug反馈", count: 62, percent: 26, color: "bg-red-500" },
  { name: "体验优化", count: 53, percent: 22, color: "bg-amber-500" },
  { name: "其他", count: 37, percent: 16, color: "bg-gray-400" },
];

const mockTopIssues = [
  { issue: "加载速度慢，首页打开超过3秒", count: 45, sentiment: "negative", trend: "up" },
  { issue: "希望增加数据导出为Excel的功能", count: 38, sentiment: "neutral", trend: "stable" },
  { issue: "搜索结果不准确，经常找不到想要的内容", count: 32, sentiment: "negative", trend: "up" },
  { issue: "新版UI很好看，操作更流畅了", count: 28, sentiment: "positive", trend: "stable" },
  { issue: "推送通知太频繁，希望能自定义", count: 24, sentiment: "negative", trend: "down" },
];

export default function FeedbackPage() {
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
  };

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
        <h1 className="text-2xl font-bold">反馈分析</h1>
        <p className="text-text-secondary mt-1">导入用户反馈数据，AI自动分类、聚类，提炼高频问题</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Upload */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">导入反馈数据</h3>
            <div className="grid grid-cols-3 gap-4">
              {["App Store 评论", "客服工单 CSV", "社群聊天记录"].map((label) => (
                <div
                  key={label}
                  onClick={handleUpload}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    uploaded ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {uploaded ? "已导入" : "点击上传"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!uploaded || analyzing}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
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
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">分析结果</h2>
            <button
              onClick={() => { setResult(false); setUploaded(false); }}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50"
            >
              重新分析
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {mockFeedbacks.map((f) => (
              <div key={f.source} className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-sm font-medium">{f.source}</span>
                </div>
                <p className="text-2xl font-bold">{f.count}</p>
                <p className="text-xs text-text-secondary">条反馈</p>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">反馈分类</h3>
            <div className="space-y-3">
              {mockCategories.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-sm w-20">{c.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${c.color} rounded-full flex items-center justify-end pr-2`}
                      style={{ width: `${c.percent}%` }}
                    >
                      <span className="text-xs text-white font-medium">{c.count}</span>
                    </div>
                  </div>
                  <span className="text-sm text-text-secondary w-10">{c.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top issues */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">高频问题 TOP 5</h3>
            <div className="space-y-3">
              {mockTopIssues.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-lg font-bold text-text-secondary w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm">{item.issue}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.sentiment === "positive" ? "bg-green-100 text-green-700" :
                    item.sentiment === "negative" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {item.sentiment === "positive" ? "正面" : item.sentiment === "negative" ? "负面" : "中性"}
                  </span>
                  <span className="text-sm font-medium w-12 text-right">{item.count}次</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
