"use client";

import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";

const presetModels = [
  { value: "claude-opus", label: "Claude Opus", provider: "Anthropic" },
  { value: "claude-sonnet", label: "Claude Sonnet", provider: "Anthropic" },
  { value: "claude-haiku", label: "Claude Haiku", provider: "Anthropic" },
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "deepseek-chat", label: "DeepSeek Chat", provider: "DeepSeek" },
  { value: "openrouter/auto", label: "OpenRouter Auto", provider: "OpenRouter" },
];

type ValidationStatus = "idle" | "loading" | "valid" | "invalid";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { model, apiKey, updateSettings } = useSettings();
  const [localModel, setLocalModel] = useState(model);
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync from settings when loaded
  useEffect(() => {
    setLocalModel(model);
    setLocalKey(apiKey);
  }, [model, apiKey]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced validation on key change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!localKey.trim()) {
      setStatus("idle");
      setErrorMsg("");
      return;
    }

    setStatus("loading");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/validate-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: localModel, apiKey: localKey }),
        });
        const data = await res.json();
        if (data.valid) {
          setStatus("valid");
          setErrorMsg("");
          updateSettings({ model: localModel, apiKey: localKey });
        } else {
          setStatus("invalid");
          setErrorMsg(data.error || "Key不可用");
        }
      } catch {
        setStatus("invalid");
        setErrorMsg("验证请求失败");
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localKey, localModel, updateSettings]);

  const handleModelChange = (value: string) => {
    setLocalModel(value);
    setShowDropdown(false);
    updateSettings({ model: value });
    if (localKey.trim()) {
      setStatus("loading");
    }
  };

  // Filter presets based on input
  const filtered = presetModels.filter(
    (m) =>
      m.value.toLowerCase().includes(localModel.toLowerCase()) ||
      m.label.toLowerCase().includes(localModel.toLowerCase()) ||
      m.provider.toLowerCase().includes(localModel.toLowerCase())
  );

  // Find display label for current model
  const currentPreset = presetModels.find((m) => m.value === localModel);

  // Get provider hint for API key placeholder
  const getProviderHint = () => {
    if (currentPreset) return currentPreset.provider;
    if (localModel.includes("openrouter")) return "OpenRouter";
    if (localModel.includes("claude")) return "Anthropic";
    if (localModel.includes("gpt")) return "OpenAI";
    if (localModel.includes("deepseek")) return "DeepSeek";
    return "";
  };

  // Get key help link
  const getKeyHelpText = () => {
    const m = localModel.toLowerCase();
    if (m.includes("claude")) return "获取 Key: console.anthropic.com";
    if (m.includes("gpt") || m.includes("openai")) return "获取 Key: platform.openai.com";
    if (m.includes("deepseek")) return "获取 Key: platform.deepseek.com";
    if (m.includes("openrouter")) return "获取 Key: openrouter.ai/keys";
    return "请输入对应提供商的 API Key";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">设置</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Model selector - combobox style */}
        <div className="mb-5 relative">
          <label className="block text-sm font-medium mb-2">AI 模型</label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={currentPreset ? `${currentPreset.label} (${currentPreset.provider})` : localModel}
              onChange={(e) => {
                setLocalModel(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="选择或输入模型名称，如 openrouter/meta-llama/llama-3"
              className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filtered.length > 0 ? (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleModelChange(opt.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${
                      localModel === opt.value ? "bg-primary/5 text-primary" : ""
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-xs text-text-secondary">{opt.provider}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-text-secondary">
                  <p>无匹配预设，将使用自定义模型：</p>
                  <p className="font-mono text-text mt-1">{localModel}</p>
                </div>
              )}
              {localModel && !presetModels.find((m) => m.value === localModel) && filtered.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ model: localModel });
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-t border-border text-primary"
                >
                  使用自定义模型: {localModel}
                </button>
              )}
            </div>
          )}
        </div>

        {/* API Key input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder={`输入你的 ${getProviderHint()} API Key`}
              className="w-full px-4 py-2.5 pr-20 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              >
                {showKey ? (
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>

              {/* Validation status icon */}
              {status === "loading" && (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" />
              )}
              {status === "valid" && (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === "invalid" && (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Validation message */}
          {status === "valid" && (
            <p className="text-xs text-green-600 mt-1.5">Key 可用，已保存</p>
          )}
          {status === "invalid" && (
            <p className="text-xs text-red-500 mt-1.5">{errorMsg}</p>
          )}
          {status === "loading" && (
            <p className="text-xs text-text-secondary mt-1.5">验证中...</p>
          )}
        </div>

        {/* Tip */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-text-secondary">
          <p>API Key 仅保存在本地浏览器中，不会上传到服务器。</p>
          <p className="mt-1">{getKeyHelpText()}</p>
        </div>
      </div>
    </div>
  );
}
