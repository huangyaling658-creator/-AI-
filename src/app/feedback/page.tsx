"use client";

import { useState, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import UploadStep from "@/components/feedback/UploadStep";
import PreviewStep from "@/components/feedback/PreviewStep";
import DimensionStep, { type Dimension } from "@/components/feedback/DimensionStep";
import AnalysisStep from "@/components/feedback/AnalysisStep";
import ChartStep from "@/components/feedback/ChartStep";

type Step = "upload" | "preview" | "dimensions" | "analyzing" | "result";

interface ColumnMeta {
  name: string;
  filledCount: number;
  uniqueCount: number;
  uniqueValues?: string[];
  avgLength: number;
  columnType: "categorical" | "text" | "empty" | "id";
}

interface FileInfo {
  fileName: string;
  type: string;
  rowCount: number;
  headers?: string[];
  columnMetas?: ColumnMeta[];
}

// 分析结果的新格式
interface AnalysisResult {
  summary: { total: number; analyzed: number };
  dimensions: Array<{
    name: string;
    column: string;
    type: string;
    data: Array<{ label: string; count: number; percent: number }>;
    insight: string;
  }>;
  topInsights: string[];
}

const stepLabels: Record<string, string> = {
  upload: "上传文件",
  preview: "数据预览",
  dimensions: "选择维度",
  result: "分析结果",
};

const stepOrder: Step[] = ["upload", "preview", "dimensions", "analyzing", "result"];

export default function FeedbackPage() {
  const { model, apiKey } = useSettings();
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");

  // 数据状态
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
  const [tableData, setTableData] = useState<Record<string, string>[]>([]);
  const [textFeedbacks, setTextFeedbacks] = useState<string[]>([]);
  const [isTable, setIsTable] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [dimensionsLoading, setDimensionsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Step 1 → 2: 上传解析
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
      setTableData(data.tableData || []);
      setTextFeedbacks(data.textFeedbacks || []);
      setIsTable(data.isTable);
      setPreviewRows(data.previewRows || []);

      // 提取 headers
      if (data.files?.[0]?.headers) {
        setHeaders(data.files[0].headers);
      }

      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件解析失败");
    }
  }, []);

  // Step 2 → 3: 确认预览 → 本地推荐维度（瞬间返回）
  const handlePreviewConfirm = useCallback(async () => {
    if (!apiKey) {
      setError("请先在设置中配置 API Key");
      return;
    }
    setError("");
    setStep("dimensions");
    setDimensionsLoading(true);

    try {
      const columnMetas = fileInfos[0]?.columnMetas || [];
      const totalCount = tableData.length || textFeedbacks.length;

      const res = await fetch("/api/feedback/dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnMetas, totalCount, isTable }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "维度推荐失败");
      }

      const data = await res.json();
      setDimensions(data.dimensions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "维度推荐失败");
      setStep("preview");
    } finally {
      setDimensionsLoading(false);
    }
  }, [fileInfos, tableData, textFeedbacks, isTable, apiKey]);

  // Step 3 → 4 → 5: 开始分析
  const handleStartAnalysis = useCallback(async (selectedDimensions: Dimension[]) => {
    setError("");
    setStep("analyzing");

    try {
      const res = await fetch("/api/feedback/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          apiKey,
          dimensions: selectedDimensions,
          isTable,
          tableData: isTable ? tableData : undefined,
          headers: isTable ? headers : undefined,
          textFeedbacks: !isTable ? textFeedbacks : undefined,
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
      setStep("dimensions");
    }
  }, [model, apiKey, isTable, tableData, headers, textFeedbacks]);

  // 导出标注数据
  const handleExport = useCallback(async (format: string) => {
    if (!result?.dimensions) return;
    try {
      const res = await fetch("/api/feedback/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, format }),
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

  // 导出 PDF 报告
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
      pdf.setFontSize(18);
      pdf.text("反馈分析报告", pageWidth / 2, y, { align: "center" });
      y += 10;
      pdf.setFontSize(10);
      pdf.text(`生成时间: ${new Date().toLocaleString("zh-CN")}`, pageWidth / 2, y, { align: "center" });
      y += 10;

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

  // 重置
  const handleReset = useCallback(() => {
    setStep("upload");
    setFileInfos([]);
    setTableData([]);
    setTextFeedbacks([]);
    setIsTable(false);
    setHeaders([]);
    setPreviewRows([]);
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
          const isActive = si === currentStepIndex || (s === "dimensions" && step === "analyzing");
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

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p>{error}</p>
            {!apiKey && <p className="mt-1 text-xs">点击左下角设置图标配置你的 API Key</p>}
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
          previewRows={previewRows}
          headers={headers}
          isTable={isTable}
          totalCount={tableData.length || textFeedbacks.length}
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
