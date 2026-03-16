"use client";

import { useState } from "react";

interface Competitor {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  website: string;
  selected: boolean;
}

const mockCompetitors: Competitor[] = [
  {
    id: "1",
    name: "ProductA",
    category: "直接竞品",
    description: "一款面向中小团队的项目管理工具，支持看板、甘特图和文档协作功能。",
    features: ["看板管理", "甘特图", "文档协作", "时间追踪"],
    website: "producta.example.com",
    selected: false,
  },
  {
    id: "2",
    name: "ProductB",
    category: "直接竞品",
    description: "企业级产品管理平台，提供需求管理、路线图规划和数据分析能力。",
    features: ["需求管理", "路线图", "数据看板", "API集成"],
    website: "productb.example.com",
    selected: false,
  },
  {
    id: "3",
    name: "ProductC",
    category: "间接竞品",
    description: "通用型协作平台，包含文档、数据库、项目管理等多种功能模块。",
    features: ["文档编辑", "数据库", "项目管理", "知识库"],
    website: "productc.example.com",
    selected: false,
  },
  {
    id: "4",
    name: "ProductD",
    category: "潜在竞品",
    description: "AI驱动的工作效率工具，近期开始涉足产品管理领域。",
    features: ["AI助手", "自动化工作流", "智能分析", "报告生成"],
    website: "productd.example.com",
    selected: false,
  },
];

type Step = "search" | "select" | "report";

export default function CompetitorPage() {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setCompetitors(mockCompetitors);
      setIsSearching(false);
      setStep("select");
    }, 1500);
  };

  const toggleSelect = (id: string) => {
    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectedCount = competitors.filter((c) => c.selected).length;

  const handleAnalyze = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
      setStep("report");
    }, 2000);
  };

  const handleReset = () => {
    setStep("search");
    setSearchQuery("");
    setCompetitors([]);
    setReportGenerated(false);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">竞品分析</h1>
        <p className="text-text-secondary mt-1">搜索竞品 → 选择对比 → 生成报告</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: "search", label: "1. 搜索竞品" },
          { key: "select", label: "2. 选择竞品" },
          { key: "report", label: "3. 分析报告" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                step === s.key
                  ? "bg-primary text-white"
                  : step === "report" || (step === "select" && i === 0)
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-text-secondary"
              }`}
            >
              {(step === "report" || (step === "select" && i === 0)) && step !== s.key ? "✓" : ""} {s.label}
            </div>
            {i < 2 && (
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Search */}
      {step === "search" && (
        <div className="bg-surface rounded-xl border border-border p-8">
          <h2 className="text-lg font-semibold mb-2">描述你想做的产品或功能</h2>
          <p className="text-sm text-text-secondary mb-6">
            AI 将搜索具有类似功能的所有竞品，并进行分类和介绍
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="例如：一个面向产品经理的AI辅助工作平台，帮助PM自动化需求分析和竞品调研"
              className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  搜索中...
                </>
              ) : (
                "搜索竞品"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select */}
      {step === "select" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                找到 {competitors.length} 个相关竞品
              </h2>
              <p className="text-sm text-text-secondary">
                选择你想详细分析的竞品（已选 {selectedCount} 个）
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                重新搜索
              </button>
              <button
                onClick={handleAnalyze}
                disabled={selectedCount < 2 || isGenerating}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    生成报告中...
                  </>
                ) : (
                  `分析选中竞品 (${selectedCount})`
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((comp) => (
              <div
                key={comp.id}
                onClick={() => toggleSelect(comp.id)}
                className={`bg-surface rounded-xl border-2 p-5 cursor-pointer transition-all ${
                  comp.selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{comp.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                        comp.category === "直接竞品"
                          ? "bg-red-100 text-red-700"
                          : comp.category === "间接竞品"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {comp.category}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      comp.selected
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {comp.selected && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-3">{comp.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {comp.features.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Report */}
      {step === "report" && reportGenerated && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">竞品分析报告</h2>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                新建分析
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                下载报告
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-3">概览</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                本次分析针对「{searchQuery}」方向，共对比了 {selectedCount} 款竞品。
                以下从产品定位、核心功能、用户体验、商业模式四个维度进行详细对比分析。
              </p>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">功能对比矩阵</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 pr-4 font-medium text-text-secondary">功能维度</th>
                      {competitors
                        .filter((c) => c.selected)
                        .map((c) => (
                          <th key={c.id} className="text-left py-3 px-4 font-medium">
                            {c.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["需求管理", "数据分析", "AI能力", "团队协作", "移动端"].map(
                      (feature) => (
                        <tr key={feature} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-text-secondary">{feature}</td>
                          {competitors
                            .filter((c) => c.selected)
                            .map((c) => (
                              <td key={c.id} className="py-3 px-4">
                                {Math.random() > 0.3 ? (
                                  <span className="text-green-600">&#10003;</span>
                                ) : (
                                  <span className="text-gray-300">&#10005;</span>
                                )}
                              </td>
                            ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-3">核心差异与机会点</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#9679;</span>
                  大部分竞品缺乏深度AI集成，主要停留在基础自动化层面
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#9679;</span>
                  针对产品经理场景的专业化工具存在市场空白
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#9679;</span>
                  数据分析和反馈分析的一体化能力是重要差异化方向
                </li>
              </ul>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-3">建议</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                建议优先切入"AI + 需求文档"和"AI + 竞品分析"两个场景，
                这两个领域竞品覆盖较弱且PM痛点明确。可在MVP阶段快速验证价值主张，
                后续再扩展到数据分析和用户反馈等模块。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
