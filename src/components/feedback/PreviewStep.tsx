"use client";

interface ColumnMeta {
  name: string;
  filledCount: number;
  uniqueCount: number;
  uniqueValues?: string[];
  avgLength: number;
  columnType: string;
}

interface FileInfo {
  fileName: string;
  type: string;
  rowCount: number;
  headers?: string[];
  columnMetas?: ColumnMeta[];
}

interface Props {
  files: FileInfo[];
  previewRows: Record<string, string>[];
  headers: string[];
  isTable: boolean;
  totalCount: number;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PreviewStep({ files, previewRows, headers, isTable, totalCount, onConfirm, onBack }: Props) {
  const columnMetas = files[0]?.columnMetas;

  return (
    <div className="space-y-5">
      {/* 文件信息 */}
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
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary mt-3">
          共 <span className="font-semibold text-text">{totalCount}</span> 条数据
        </p>
      </div>

      {/* 列结构概览（表格时显示） */}
      {isTable && columnMetas && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">列结构概览</h3>
          <div className="grid grid-cols-2 gap-2">
            {columnMetas.map((col) => (
              <div key={col.name} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  col.columnType === "categorical" ? "bg-blue-500" :
                  col.columnType === "text" ? "bg-green-500" :
                  col.columnType === "empty" ? "bg-gray-300" : "bg-yellow-500"
                }`} />
                <span className="font-medium">{col.name}</span>
                <span className="text-text-secondary text-xs ml-auto">
                  {col.columnType === "categorical" ? `${col.uniqueCount} 个类别` :
                   col.columnType === "text" ? `${col.uniqueCount} 种内容` :
                   col.columnType === "empty" ? "较多空值" : "ID列"}
                </span>
                <span className="text-text-secondary text-xs">
                  {col.filledCount}/{totalCount}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 分类列</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 文本列</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> 空值较多</span>
          </div>
        </div>
      )}

      {/* 数据预览 */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">数据预览（前 {Math.min(10, previewRows.length)} 条）</h3>
        {isTable && headers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-text-secondary font-medium">#</th>
                  {headers.map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-text-secondary font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-gray-50">
                    <td className="py-2 pr-3 text-text-secondary font-mono">{i + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="py-2 px-2 max-w-[200px] truncate" title={row[h] || ""}>
                        {row[h] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {previewRows.map((row, i) => (
              <div key={i} className="flex gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                <span className="text-text-secondary font-mono w-6 flex-shrink-0 text-right">{i + 1}</span>
                <p className="text-text leading-relaxed">{Object.values(row).join(" | ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors">
          重新上传
        </button>
        <button onClick={onConfirm} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          确认数据，下一步
        </button>
      </div>
    </div>
  );
}
