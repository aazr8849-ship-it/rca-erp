"use client";
import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
  example?: string;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** 模块名（用于显示） */
  moduleName: string;
  /** 列定义 */
  columns: ImportColumn[];
  /** 表头中文 → 字段名映射（自动从columns生成） */
  headerMap?: Record<string, string>;
  /** 必填字段（自动从columns的required生成） */
  requiredFields?: { key: string; label: string }[];
  /** 导入回调，返回错误数组（空数组表示全部成功） */
  onImport: (data: any[]) => Promise<{ success: number; errors: { row: number; message: string }[] }> | { success: number; errors: { row: number; message: string }[] };
  /** 模板下载文件名 */
  templateFilename?: string;
  /** 自定义文件解析函数（支持ZIP等格式） */
  customParse?: (file: File) => Promise<any[]>;
  /** 自定义接受的文件类型 */
  fileAccept?: string;
  /** 自定义模板下载函数 */
  customDownloadTemplate?: () => Promise<void>;
  /** 额外提示文本（显示在上传区域下方） */
  extraHint?: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  moduleName,
  columns,
  onImport,
  templateFilename,
  customParse,
  fileAccept,
  customDownloadTemplate,
  extraHint,
}: ImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动生成 headerMap
  const headerMap: Record<string, string> = {};
  columns.forEach((col) => {
    headerMap[col.label] = col.key;
  });

  const requiredFields = columns
    .filter((c) => c.required)
    .map((c) => ({ key: c.key, label: c.label }));

  const reset = () => {
    setStep("upload");
    setParsedData([]);
    setFileName("");
    setImporting(false);
    setResult(null);
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setFileName(file.name);
    setParsing(true);

    try {
      let data: any[];
      if (customParse) {
        data = await customParse(file);
      } else {
        const { parseExcelFile } = await import("@/lib/excel-utils");
        data = await parseExcelFile(file, headerMap);
      }
      if (data.length === 0) {
        setParseError("文件为空或没有有效数据");
        setParsing(false);
        return;
      }
      setParsedData(data);
      setStep("preview");
    } catch (err: any) {
      setParseError(err.message || "文件解析失败");
    } finally {
      setParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (customDownloadTemplate) {
      await customDownloadTemplate();
    } else {
      const { downloadTemplate } = await import("@/lib/excel-utils");
      downloadTemplate(templateFilename || moduleName, columns);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await onImport(parsedData);
      setResult(res);
      setStep("result");
    } catch (err: any) {
      setResult({ success: 0, errors: [{ row: 0, message: err.message || "导入失败" }] });
      setStep("result");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#38BDF8]" />
            导入{moduleName}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: 上传文件 */}
        {step === "upload" && (
          <div className="py-2 space-y-4">
            <div className="bg-sky-50 border border-sky-200 rounded-md p-3 text-xs text-sky-800">
              <div className="font-medium mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                导入说明
              </div>
              <ul className="space-y-0.5 ml-5 list-disc">
                <li>请先下载导入模板，按模板格式填写数据</li>
                <li>表头带 <span className="font-bold">*</span> 的字段为必填</li>
                <li>支持 .xlsx / .xls / .csv 格式</li>
                <li>编码自动按客户编码规则生成（无需填写）</li>
                <li>重复编码将自动跳过</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                下载导入模板
              </Button>
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer",
                parsing ? "border-[#38BDF8] bg-sky-50/40" : "border-slate-300 hover:border-[#38BDF8] hover:bg-sky-50/40",
              )}
              onClick={() => !parsing && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#38BDF8]", "bg-sky-50/40"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-[#38BDF8]", "bg-sky-50/40"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-[#38BDF8]", "bg-sky-50/40");
                if (e.dataTransfer.files[0]) {
                  if (fileInputRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(e.dataTransfer.files[0]);
                    fileInputRef.current.files = dt.files;
                    fileInputRef.current.dispatchEvent(new Event("change"));
                  }
                }
              }}
            >
              {parsing ? (
                <>
                  <div className="inline-block animate-spin h-8 w-8 border-3 border-[#38BDF8] border-t-transparent rounded-full mb-2" />
                  <div className="text-sm text-[#38BDF8] font-medium">正在解析文件...</div>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <div className="text-sm text-slate-600 mb-1">
                    点击或拖拽文件到此处上传
                  </div>
                  <div className="text-xs text-slate-400">
                    {fileAccept?.includes("zip") ? "支持 .zip / .xlsx / .xls / .csv 文件" : "支持 .xlsx / .xls / .csv 文件"}
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={fileAccept || ".xlsx,.xls,.csv"}
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {extraHint && (
              <div className="bg-sky-50 border border-sky-200 rounded-md p-2.5 text-xs text-sky-800">
                {extraHint}
              </div>
            )}

            {fileName && (
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" />
                <span className="font-medium">{fileName}</span>
              </div>
            )}

            {parseError && (
              <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-700 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>{parseError}</div>
              </div>
            )}

            {/* 字段说明 */}
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                字段说明
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium text-slate-600">字段</th>
                      <th className="text-left px-3 py-1.5 font-medium text-slate-600">必填</th>
                      <th className="text-left px-3 py-1.5 font-medium text-slate-600">示例</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col) => (
                      <tr key={col.key} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 text-slate-700">{col.label}</td>
                        <td className="px-3 py-1.5">{col.required ? <span className="text-rose-500">是</span> : <span className="text-slate-400">否</span>}</td>
                        <td className="px-3 py-1.5 text-slate-500">{col.example || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 数据预览 */}
        {step === "preview" && (
          <div className="py-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                共解析到 <span className="font-bold text-[#38BDF8]">{parsedData.length}</span> 条数据
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="text-xs">
                <X className="h-3 w-3 mr-1" />重新上传
              </Button>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium w-10">#</th>
                      {columns.map((col) => (
                        <th key={col.key} className="px-2 py-2 text-left text-slate-600 font-medium whitespace-nowrap">
                          {col.label}{col.required && <span className="text-rose-500">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="px-2 py-1.5 text-slate-400">{idx + 1}</td>
                        {columns.map((col) => {
                          const val = row[col.key];
                          const isEmpty = (val === undefined || val === null || val === "") && col.required;
                          return (
                            <td key={col.key} className={cn("px-2 py-1.5 text-slate-700 whitespace-nowrap", isEmpty && "bg-rose-50 text-rose-600")}>
                              {val === undefined || val === null || val === "" ? (col.required ? "⚠ 必填" : "-") : String(val).slice(0, 30)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 50 && (
                <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 text-center border-t">
                  仅显示前 50 条，共 {parsedData.length} 条数据
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>请检查上方预览数据，标红的必填字段为空将无法导入。确认无误后点击下方按钮开始导入。</div>
            </div>
          </div>
        )}

        {/* Step 3: 导入结果 */}
        {step === "result" && result && (
          <div className="py-4 space-y-4 text-center">
            {result.errors.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-800">导入成功</div>
                  <div className="text-sm text-slate-500 mt-1">
                    成功导入 <span className="font-bold text-emerald-600">{result.success}</span> 条{moduleName}数据
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-9 w-9 text-amber-600" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-800">部分导入成功</div>
                  <div className="text-sm text-slate-500 mt-1">
                    成功 <span className="font-bold text-emerald-600">{result.success}</span> 条，
                    失败 <span className="font-bold text-rose-600">{result.errors.length}</span> 条
                  </div>
                </div>
                <div className="border border-slate-200 rounded-md max-h-40 overflow-y-auto text-left">
                  <div className="bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 border-b border-rose-100">
                    错误详情
                  </div>
                  {result.errors.map((err, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs text-slate-600 border-b border-slate-100 last:border-b-0">
                      {err.message}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>取消</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>重新上传</Button>
              <Button onClick={handleImport} disabled={importing} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">
                {importing ? "导入中..." : `确认导入 ${parsedData.length} 条`}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={handleClose} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">完成</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
