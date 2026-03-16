"use client";

import { useRef, useState } from "react";

interface Props {
  onUploaded: (files: File[]) => void;
}

export default function UploadStep({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const acceptTypes = ".csv,.xlsx,.xls,.txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).slice(0, 10 - files.length);
    const updated = [...files, ...arr].slice(0, 10);
    setFiles(updated);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["csv", "xlsx", "xls"].includes(ext)) return "📊";
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "🖼️";
    return "📎";
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
        }`}
      >
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium">拖拽文件到此处，或点击选择文件</p>
        <p className="text-xs text-text-secondary mt-1">
          支持 CSV、Excel、PDF、Word、TXT、图片，最多 10 份，单文件不超过 20MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="text-lg">{getFileIcon(file.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-text-secondary">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">已选 {files.length} 个文件</p>
          <button
            onClick={() => onUploaded(files)}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            开始解析
          </button>
        </div>
      )}
    </div>
  );
}
