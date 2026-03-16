"use client";

import { useState } from "react";

type Step = "template" | "input" | "generate";

export default function PRDPage() {
  const [step, setStep] = useState<Step>("template");
  const [templateUploaded, setTemplateUploaded] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    background: "",
    goals: "",
    targetUsers: "",
    coreFeatures: "",
    extraData: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [docGenerated, setDocGenerated] = useState(false);

  const handleTemplateUpload = () => {
    setTemplateUploaded(true);
    setTemplateName("公司PRD标准模板v2.docx");
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setDocGenerated(true);
      setStep("generate");
    }, 2000);
  };

  const handleReset = () => {
    setStep("template");
    setTemplateUploaded(false);
    setTemplateName("");
    setFormData({ title: "", background: "", goals: "", targetUsers: "", coreFeatures: "", extraData: "" });
    setDocGenerated(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">需求文档撰写</h1>
        <p className="text-text-secondary mt-1">上传模板 → 填写信息 → 生成文档</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: "template", label: "1. 上传模板" },
          { key: "input", label: "2. 填写需求" },
          { key: "generate", label: "3. 生成文档" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                step === s.key
                  ? "bg-primary text-white"
                  : (step === "generate" || (step === "input" && i === 0))
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-text-secondary"
              }`}
            >
              {(step === "generate" || (step === "input" && i === 0)) && step !== s.key ? "✓ " : ""}{s.label}
            </div>
            {i < 2 && (
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Template */}
      {step === "template" && (
        <div className="bg-surface rounded-xl border border-border p-8">
          <h2 className="text-lg font-semibold mb-2">上传你的需求文档模板</h2>
          <p className="text-sm text-text-secondary mb-6">
            上传公司的PRD模板，AI将按照模板结构生成文档。也可以跳过使用默认模板。
          </p>

          {!templateUploaded ? (
            <div
              onClick={handleTemplateUpload}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium">点击上传模板文件</p>
              <p className="text-xs text-text-secondary mt-1">支持 .docx / .md / .pdf 格式</p>
            </div>
          ) : (
            <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium">{templateName}</p>
                <p className="text-xs text-text-secondary">模板已上传成功</p>
              </div>
              <button
                onClick={() => { setTemplateUploaded(false); setTemplateName(""); }}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                删除
              </button>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep("input")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                templateUploaded
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "border border-border hover:bg-gray-50"
              }`}
            >
              {templateUploaded ? "下一步" : "跳过，使用默认模板"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Input */}
      {step === "input" && (
        <div className="bg-surface rounded-xl border border-border p-8">
          <h2 className="text-lg font-semibold mb-6">填写需求信息</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">需求标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：用户积分系统"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">项目背景</label>
              <textarea
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                placeholder="描述项目的背景和动机，比如为什么要做这个需求..."
                rows={3}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">目标与指标</label>
              <textarea
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="希望达成什么目标？有哪些衡量指标？"
                rows={2}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">目标用户</label>
              <input
                type="text"
                value={formData.targetUsers}
                onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                placeholder="面向哪些用户群体？"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">核心功能描述</label>
              <textarea
                value={formData.coreFeatures}
                onChange={(e) => setFormData({ ...formData, coreFeatures: e.target.value })}
                placeholder="描述你想要的核心功能和交互方式..."
                rows={4}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">补充资料（可选）</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-all">
                <p className="text-sm text-text-secondary">上传已有结论、数据、参考文档等</p>
                <p className="text-xs text-text-secondary mt-1">支持 .xlsx / .csv / .pdf / .docx / .png</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep("template")}
              className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              上一步
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  生成中...
                </>
              ) : (
                "生成需求文档"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated doc */}
      {step === "generate" && docGenerated && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">需求文档已生成</h2>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                新建文档
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                下载 .docx
              </button>
              <button className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                下载 .md
              </button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-8 prose prose-sm max-w-none">
            <h1 className="text-xl font-bold border-b border-border pb-3 mb-6">
              {formData.title || "用户积分系统"} - 产品需求文档
            </h1>

            <section className="mb-6">
              <h2 className="text-base font-semibold text-primary mb-2">1. 项目背景</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {formData.background || "为提升用户活跃度和留存率，计划推出用户积分系统。通过任务奖励机制激励用户完成关键行为，同时为后续会员体系打下基础。"}
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-base font-semibold text-primary mb-2">2. 目标与指标</h2>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>提升日活用户的任务完成率 20%</li>
                <li>7日留存率提升 5个百分点</li>
                <li>用户平均使用时长提升 15%</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-base font-semibold text-primary mb-2">3. 目标用户</h2>
              <p className="text-sm text-text-secondary">
                {formData.targetUsers || "全量活跃用户，重点面向注册30天内的新用户群体"}
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-base font-semibold text-primary mb-2">4. 核心功能</h2>
              <div className="text-sm text-text-secondary space-y-3">
                <div>
                  <h4 className="font-medium text-text mb-1">4.1 积分获取</h4>
                  <p>用户完成指定任务可获得积分奖励，包括每日签到、内容创作、社交互动等。</p>
                </div>
                <div>
                  <h4 className="font-medium text-text mb-1">4.2 积分消耗</h4>
                  <p>积分可用于兑换虚拟权益、参与抽奖、解锁高级功能等。</p>
                </div>
                <div>
                  <h4 className="font-medium text-text mb-1">4.3 积分中心页面</h4>
                  <p>展示用户积分余额、获取记录、可兑换权益列表。</p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-base font-semibold text-primary mb-2">5. 验收标准</h2>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>&#9745; 用户完成任务后积分实时到账</li>
                <li>&#9745; 积分扣减操作需二次确认</li>
                <li>&#9745; 积分记录支持按时间筛选查看</li>
                <li>&#9745; 异常情况下积分可回滚</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-primary mb-2">6. 排期建议</h2>
              <p className="text-sm text-text-secondary">
                预计开发周期2个迭代，建议分Phase 1（积分获取+积分中心）和Phase 2（积分消耗+兑换）上线。
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
