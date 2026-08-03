// ============================================================
// Excel 导入导出工具
// ============================================================
import * as XLSX from "xlsx";
import { toast } from "sonner";

/**
 * 导出数据到 Excel 文件
 * @param data 数据数组
 * @param filename 文件名（不含扩展名）
 * @param sheetName 工作表名
 * @param columns 列配置（可选，用于自定义列顺序和表头）
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = "Sheet1",
  columns?: { key: keyof T; label: string }[],
) {
  if (!data || data.length === 0) {
    toast.warning("没有数据可导出");
    return;
  }

  try {
    // 如果指定了列配置，按顺序提取
    const exportData = columns
      ? data.map((row) => {
          const obj: Record<string, any> = {};
          columns.forEach((col) => {
            obj[col.label] = row[col.key];
          });
          return obj;
        })
      : data;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    // 设置列宽
    if (columns) {
      worksheet["!cols"] = columns.map((c) => ({
        wch: Math.max(c.label.length * 2 + 2, 12),
      }));
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `${filename}-${dateStr}.xlsx`);
    toast.success(`已导出 ${data.length} 条数据`);
  } catch (err: any) {
    console.error(err);
    toast.error(`导出失败: ${err.message || "未知错误"}`);
  }
}

/**
 * 下载导入模板
 * @param filename 文件名
 * @param columns 列配置（包含字段名、中文标签、是否必填、示例值）
 */
export function downloadTemplate(
  filename: string,
  columns: { key: string; label: string; required?: boolean; example?: string }[],
) {
  try {
    // 创建表头行（带 * 标记必填）
    const headerRow: Record<string, string> = {};
    columns.forEach((col) => {
      headerRow[col.label] = col.required ? `${col.label}*` : col.label;
    });
    // 创建示例行
    const exampleRow: Record<string, string> = {};
    columns.forEach((col) => {
      exampleRow[col.label] = col.example || "";
    });

    const worksheet = XLSX.utils.json_to_sheet([headerRow, exampleRow], {
      skipHeader: true,
    });
    worksheet["!cols"] = columns.map((c) => ({
      wch: Math.max(c.label.length * 2 + 4, 16),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "导入模板");
    XLSX.writeFile(workbook, `${filename}-导入模板.xlsx`);
    toast.success("模板已下载");
  } catch (err: any) {
    console.error(err);
    toast.error(`模板下载失败: ${err.message || "未知错误"}`);
  }
}

/**
 * 解析 Excel 文件为 JSON 数据
 * @param file 用户上传的 Excel 文件
 * @param headerMap 表头中文 → 字段名的映射
 * @returns 解析后的数据数组
 */
export async function parseExcelFile<T = any>(
  file: File,
  headerMap: Record<string, string>,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 用 raw: false 让日期、数字按字符串解析，避免时区问题
        const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
        });

        if (rawData.length === 0) {
          reject(new Error("Excel 文件为空或没有有效数据行"));
          return;
        }

        // 把中文表头映射回字段名
        const mappedData = rawData.map((row) => {
          const obj: Record<string, any> = {};
          for (const [cnKey, value] of Object.entries(row)) {
            // 去掉表头的 * 标记后做匹配
            const cleanKey = (cnKey as string).replace(/\s*\*?\s*$/, "").trim();
            const fieldName = headerMap[cleanKey] || headerMap[cnKey as string];
            if (fieldName) {
              obj[fieldName] = typeof value === "string" ? value.trim() : value;
            }
          }
          return obj;
        });

        resolve(mappedData as T[]);
      } catch (err: any) {
        reject(new Error(`Excel 解析失败: ${err.message || "未知错误"}`));
      }
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 校验导入数据，返回错误列表
 * @param data 解析后的数据
 * @param requiredFields 必填字段配置
 * @returns 错误信息数组（按行号）
 */
export function validateImportData<T extends Record<string, any>>(
  data: T[],
  requiredFields: { key: keyof T; label: string }[],
): { row: number; field: string; message: string }[] {
  const errors: { row: number; field: string; message: string }[] = [];
  data.forEach((row, idx) => {
    requiredFields.forEach((field) => {
      const value = row[field.key];
      if (value === undefined || value === null || value === "") {
        errors.push({
          row: idx + 2, // +2 因为Excel第1行是表头，第2行才是第1条数据
          field: field.label,
          message: `第${idx + 2}行「${field.label}」不能为空`,
        });
      }
    });
  });
  return errors;
}
