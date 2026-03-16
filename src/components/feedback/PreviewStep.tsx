"use client";

interface FileInfo {
  fileName: string;
  type: string;
  rowCount: number;
  headers?: string[];
  feedbackColumn?: string | null;
}

interface Props {
  files: FileInfo[];
  preview: string[];
  totalCount: number;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PreviewStep({ files, preview, totalCount, onConfirm, onBack }: Props) {
  return (
    <div className="space-y-5">
      {/* File summary */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">文件解析结果</h3>
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="font-medium flex-1 truncate">{f.fileName}</span>
              <span className="text-text-secondary">
                {f.type === "table" ? "表格" : f.type === "image" ? "图片" : "文本"}
              </span>
              <span className="text-text-secondary">{f.rowCount} 条</span>
              {f.feedbackColumn && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  反馈列: {f.feedbackColumn}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary mt-3">
          共提取 <span className="font-semibold text-text">{totalCount}</span> 条反馈数据
        </p>
      </div>

      {/* Data preview */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">数据预览（前 {Math.min(10, preview.length)} 条）</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {preview.map((text, i) => (
            <div key={i} className="flex gap-3 text-sm py-2 border-b border-border/50 last:border-0">
              <span className="text-text-secondary font-mono w-6 flex-shrink-0 text-right">{i + 1}</span>
              <p className="text-text leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          重新上传
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          确认数据，下一步
        </button>
      </div>
    </div>
  );
}
