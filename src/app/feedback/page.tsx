"use client";

import { useState, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import UploadStep from "@/components/feedback/UploadStep";
import PreviewStep from "@/components/feedback/PreviewStep";
import DimensionStep, { type Dimension } from "@/components/feedback/DimensionStep";
import AnalysisStep from "@/components/feedback/AnalysisStep";
import ChartStep from "@/components/feedback/ChartStep";

type Step = "upload" | "preview" | "dimensions" | "analyzing" | "result";

interface FileInfo {
  fileName: string;
  type: string;
  rowCount: number;
  headers?: string[];
  feedbackColumn?: string | null;
}

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

const stepLabels: Record<Step, string> = {
  upload: "上传文件",
  preview: "数据预览",
  dimensions: "选择维度",
  analyzing: "分析中",
  result: "分析结果",
};

const stepOrder: Step[] = ["upload", "preview", "dimensions", "analyzing", "result"];

export default function FeedbackPage() {
  const { model, apiKey } = useSettings();
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");

  // Data flowing through steps
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [dimensionsLoading, setDimensionsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Step 1 → 2: Upload files and parse
  const handleUpload = useCallback(async (files: File[]) => {
    setError("");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/feedback/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "解析失败");
      }

      const data = await res.json();
      setFileInfos(data.files);
      setFeedbacks(data.mergedFeedbacks);
      setPreview(data.preview);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件解析失败");
    }
  }, []);

  // Step 2 → 3: Confirm preview, request dimensions
  const handlePreviewConfirm = useCallback(async () => {
    if (!apiKey) {
      setError("请先在设置中配置 API Key");
      return;
    }
    setError("");
    setStep("dimensions");
    setDimensionsLoading(true);

    try {
      const res = await fetch("/api/feedback/dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample: feedbacks.slice(0, 20),
          model,
          apiKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "维度推荐失败");
      }

      const data = await res.json();
      setDimensions(data.dimensions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "维度推荐失败");
      setStep("preview"); // go back
    } finally {
      setDimensionsLoading(false);
    }
  }, [feedbacks, model, apiKey]);

  // Step 3 → 4 → 5: Start analysis
  const handleStartAnalysis = useCallback(async (selectedDimensions: string[]) => {
    setError("");
    setStep("analyzing");

    try {
      const res = await fetch("/api/feedback/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbacks,
          dimensions: selectedDimensions,
          model,
          apiKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析失败");
      }

      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败");
      setStep("dimensions"); // go back
    }
  }, [feedbacks, model, apiKey]);

  // Export annotated data
  const handleExport = useCallback(async (format: string) => {
    if (!result?.feedbacks) return;
    try {
      const res = await fetch("/api/feedback/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbacks: result.feedbacks, format }),
      });

      if (!res.ok) throw new Error("导出失败");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-analysis.${format === "xlsx" ? "xlsx" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败");
    }
  }, [result]);

  // Export PDF report
  const handleExportReport = useCallback(async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const chartArea = document.getElementById("chart-area");
      if (!chartArea) return;

      const canvas = await html2canvas(chartArea, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = 10;
      // Title
      pdf.setFontSize(18);
      pdf.text("反馈分析报告", pageWidth / 2, y, { align: "center" });
      y += 10;
      pdf.setFontSize(10);
      pdf.text(`生成时间: ${new Date().toLocaleString("zh-CN")}`, pageWidth / 2, y, { align: "center" });
      y += 10;

      // Chart image
      if (y + imgHeight > pdf.internal.pageSize.getHeight() - 10) {
        pdf.addPage();
        y = 10;
      }
      pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);

      pdf.save("feedback-analysis-report.pdf");
    } catch (err) {
      setError("PDF 导出失败: " + (err instanceof Error ? err.message : "未知错误"));
    }
  }, []);

  // Reset to beginning
  const handleReset = useCallback(() => {
    setStep("upload");
    setFileInfos([]);
    setFeedbacks([]);
    setPreview([]);
    setDimensions([]);
    setResult(null);
    setError("");
  }, []);

  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">反馈分析</h1>
        <p className="text-text-secondary mt-1">上传用户反馈数据，AI 自动分类聚合，提炼需求痛点</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-8">
        {stepOrder.filter((s) => s !== "analyzing").map((s, i) => {
          const si = stepOrder.indexOf(s);
          const isActive = si === currentStepIndex;
          const isDone = si < currentStepIndex;
          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive ? "bg-primary text-white" :
                isDone ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-text-secondary"
              }`}>
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
                {stepLabels[s]}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-0.5 ${si < currentStepIndex ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p>{error}</p>
            {!apiKey && (
              <p className="mt-1 text-xs">点击左下角设置图标配置你的 API Key</p>
            )}
          </div>
        </div>
      )}

      {/* Steps */}
      {step === "upload" && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">导入反馈数据</h3>
          <UploadStep onUploaded={handleUpload} />
        </div>
      )}

      {step === "preview" && (
        <PreviewStep
          files={fileInfos}
          preview={preview}
          totalCount={feedbacks.length}
          onConfirm={handlePreviewConfirm}
          onBack={handleReset}
        />
      )}

      {step === "dimensions" && (
        <DimensionStep
          dimensions={dimensions}
          loading={dimensionsLoading}
          onStart={handleStartAnalysis}
          onBack={() => setStep("preview")}
        />
      )}

      {step === "analyzing" && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <AnalysisStep isAnalyzing />
        </div>
      )}

      {step === "result" && result && (
        <div id="chart-area">
          <ChartStep
            result={result}
            onExport={handleExport}
            onExportReport={handleExportReport}
            onBack={handleReset}
          />
        </div>
      )}
    </div>
  );
}
