"use client";

import { useEffect, useState } from "react";

const steps = [
  "数据清洗中...",
  "语义分析中...",
  "聚类归组中...",
  "生成结论中...",
];

interface Props {
  isAnalyzing: boolean;
}

export default function AnalysisStep({ isAnalyzing }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) return;
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16 mb-6">
        <span className="absolute inset-0 animate-spin border-4 border-primary/20 border-t-primary rounded-full" />
      </div>

      <h3 className="text-lg font-semibold mb-6">AI 正在分析反馈数据</h3>

      <div className="w-full max-w-sm space-y-3">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            {i < currentStep ? (
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : i === currentStep ? (
              <span className="w-5 h-5 flex-shrink-0 animate-spin border-2 border-primary/30 border-t-primary rounded-full" />
            ) : (
              <span className="w-5 h-5 flex-shrink-0 rounded-full border-2 border-gray-200" />
            )}
            <span className={`text-sm ${
              i < currentStep ? "text-green-600" : i === currentStep ? "text-text font-medium" : "text-text-secondary"
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
