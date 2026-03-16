"use client";

import { useState } from "react";

const mockInterviews = [
  { id: "1", name: "用户A - 资深产品经理", duration: "45分钟", date: "2024-03-10" },
  { id: "2", name: "用户B - 初级产品经理", duration: "30分钟", date: "2024-03-11" },
  { id: "3", name: "用户C - 产品总监", duration: "50分钟", date: "2024-03-12" },
];

const mockInsights = [
  {
    category: "核心痛点",
    items: [
      "需求文档撰写耗时过长，平均每份PRD需要2-3天",
      "竞品调研缺乏系统化方法，信息散落各处",
      "用户反馈量大但难以快速提炼关键问题",
    ],
  },
  {
    category: "期望功能",
    items: [
      "希望AI能根据简单描述自动生成PRD初稿",
      "需要自动化的竞品监控和对比功能",
      "希望有一站式平台整合所有PM日常工具",
    ],
  },
  {
    category: "使用习惯",
    items: [
      "大多数PM同时使用5-8个工具完成日常工作",
      "团队内部文档标准不统一是常见问题",
      "数据分析主要依赖数据团队，响应周期长",
    ],
  },
];

export default function InterviewPage() {
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);

  const handleUpload = () => setUploaded(true);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult(true);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">访谈分析</h1>
        <p className="text-text-secondary mt-1">上传访谈记录，AI自动提取关键洞察和用户需求</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Upload area */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">上传访谈记录</h3>
            <p className="text-sm text-text-secondary mb-4">
              支持上传录音文件（自动转写）或文字记录
            </p>

            {!uploaded ? (
              <div
                onClick={handleUpload}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-all"
              >
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium">点击上传或拖拽文件到这里</p>
                <p className="text-xs text-text-secondary mt-1">支持 .mp3 / .wav / .txt / .docx 格式，可批量上传</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mockInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{interview.name}</p>
                      <p className="text-xs text-text-secondary">{interview.duration} | {interview.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!uploaded || analyzing}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                分析中...（转写 + 提取洞察）
              </>
            ) : (
              `分析 ${mockInterviews.length} 场访谈`
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">访谈分析报告</h2>
            <div className="flex gap-3">
              <button
                onClick={() => { setResult(false); setUploaded(false); }}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50"
              >
                新建分析
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
                下载报告
              </button>
            </div>
          </div>

          {/* Overview */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-3">概览</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-text-secondary">访谈人数</p>
                <p className="text-xl font-bold mt-1">3 人</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-text-secondary">总时长</p>
                <p className="text-xl font-bold mt-1">125 分钟</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-text-secondary">提取洞察</p>
                <p className="text-xl font-bold mt-1">9 条</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              本次共分析3场用户访谈，受访者覆盖初级PM到产品总监不同层级。
              核心发现集中在工作效率、工具碎片化和AI辅助需求三个方向。
            </p>
          </div>

          {/* Insights */}
          {mockInsights.map((group) => (
            <div key={group.category} className="bg-surface rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-3">{group.category}</h3>
              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-primary mt-0.5">&#9679;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Cross-analysis */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-3">共性与差异</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">共识点</h4>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li>&#10003; 所有受访者都认为PRD撰写效率有提升空间</li>
                  <li>&#10003; 工具碎片化是普遍痛点</li>
                  <li>&#10003; 对AI辅助工具持开放态度</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-600 mb-2">分歧点</h4>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li>&#9888; 对AI生成内容的信任度因经验不同而异</li>
                  <li>&#9888; 高级PM更关注分析能力，初级PM更关注模板</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
