// ============================================================
// 产品 Excel 导入导出工具（支持图片）
// 导出：生成 ZIP 包（Excel + images/ 文件夹）
// 导入：解析 ZIP 包（Excel + images/ 文件夹）
// ============================================================
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { toast } from "sonner";
import type { Product } from "./types";

const PRODUCT_COLUMNS = [
  { key: "code", label: "编码" },
  { key: "name", label: "产品名称" },
  { key: "name_en", label: "英文名称" },
  { key: "oem_number", label: "OEM号" },
  { key: "category_name", label: "分类" },
  { key: "brand", label: "品牌" },
  { key: "unit", label: "单位" },
  { key: "weight_kg", label: "重量(kg)" },
  { key: "package_length_cm", label: "包装长(cm)" },
  { key: "package_width_cm", label: "包装宽(cm)" },
  { key: "package_height_cm", label: "包装高(cm)" },
  { key: "cost_price", label: "成本价" },
  { key: "sale_price", label: "销售价" },
  { key: "applicable_models", label: "适用车型" },
  { key: "status", label: "状态" },
  { key: "image_files", label: "图片文件" },
  { key: "description", label: "描述" },
];

/**
 * 判断是否为 URL 格式的图片
 */
function isUrlImage(str: string): boolean {
  return typeof str === "string" && str.startsWith("http");
}

/**
 * 从 URL 下载图片为 Blob
 */
async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/**
 * 从 base64 data URL 中提取 MIME 类型和二进制数据
 */
function parseDataUrl(dataUrl: string): { mime: string; data: Uint8Array } | null {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  const binary = atob(base64);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i);
  }
  return { mime, data };
}

/**
 * 根据 MIME 类型获取文件扩展名
 */
function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] || "jpg";
}

/**
 * 导出产品数据（含图片）为 ZIP 文件
 * ZIP 结构：
 *   products.xlsx        - 产品数据（图片列引用文件名）
 *   images/              - 图片文件夹
 *     PD001-1.jpg
 *     PD001-2.jpg
 *     ...
 */
export async function exportProductsWithImages(products: Product[]) {
  if (!products || products.length === 0) {
    toast.warning("没有数据可导出");
    return;
  }

  try {
    toast.info("正在生成导出文件，请稍候...");

    const zip = new JSZip();
    const imagesFolder = zip.folder("images");

    // 收集所有图片文件名映射
    const exportData: Record<string, any>[] = [];
    let imgCount = 0;

    for (const product of products) {
      const imageFileNames: string[] = [];
      const urls = product.image_urls || [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (isUrlImage(url)) {
          // URL 图片：下载后放入 ZIP
          const blob = await fetchImageAsBlob(url);
          if (blob) {
            const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
            const fileName = `${product.code}-${i + 1}.${ext}`;
            imagesFolder?.file(fileName, blob);
            imageFileNames.push(fileName);
            imgCount++;
          } else {
            // 下载失败，记录 URL
            imageFileNames.push(`(URL下载失败)${url}`);
          }
        } else if (url.startsWith("data:")) {
          // base64 图片：解码后放入 ZIP
          const parsed = parseDataUrl(url);
          if (parsed) {
            const ext = getExtFromMime(parsed.mime);
            const fileName = `${product.code}-${i + 1}.${ext}`;
            imagesFolder?.file(fileName, parsed.data);
            imageFileNames.push(fileName);
            imgCount++;
          }
        }
      }

      // 构建导出行
      exportData.push({
        "编码": product.code,
        "产品名称": product.name,
        "英文名称": product.name_en || "",
        "OEM号": product.oem_number || "",
        "分类": product.category_name || "",
        "品牌": product.brand || "",
        "单位": product.unit,
        "重量(kg)": product.weight_kg || "",
        "包装长(cm)": product.package_length_cm || "",
        "包装宽(cm)": product.package_width_cm || "",
        "包装高(cm)": product.package_height_cm || "",
        "成本价": product.cost_price,
        "销售价": product.sale_price,
        "适用车型": (product.applicable_models || []).join(","),
        "状态": product.status,
        "图片文件": imageFileNames.join(","),
        "描述": product.description || "",
      });
    }

    // 生成 Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = PRODUCT_COLUMNS.map((c) => ({ wch: Math.max(c.label.length * 2 + 2, 12) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "产品");

    const xlsxBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    zip.file("products.xlsx", xlsxBuffer);

    // 生成 ZIP 并下载
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const fileName = `产品导出-${dateStr}.zip`;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`已导出 ${products.length} 条产品数据（含 ${imgCount} 张图片）`);
  } catch (err: any) {
    console.error(err);
    toast.error(`导出失败: ${err.message || "未知错误"}`);
  }
}

/**
 * 解析 ZIP 格式的产品导入文件
 * @param file ZIP 文件
 * @returns 解析后的产品数据数组（image_urls 已转为 base64 data URL）
 */
export async function parseProductZipFile(file: File): Promise<any[]> {
  const zip = new JSZip();
  const zipData = await zip.loadAsync(file);

  // 找到 Excel 文件
  let xlsxFile: JSZip.JSZipObject | null = null;
  let xlsxName = "";
  for (const name of Object.keys(zipData.files)) {
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      xlsxFile = zipData.files[name];
      xlsxName = name;
      break;
    }
  }

  if (!xlsxFile) {
    throw new Error("ZIP 包中未找到 Excel 文件");
  }

  // 解析 Excel
  const xlsxArrayBuffer = await xlsxFile.async("arraybuffer");
  const workbook = XLSX.read(new Uint8Array(xlsxArrayBuffer), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rawData.length === 0) {
    throw new Error("Excel 文件为空或没有有效数据行");
  }

  // 收集 images/ 文件夹中的所有图片
  const imageFiles: Record<string, JSZip.JSZipObject> = {};
  for (const name of Object.keys(zipData.files)) {
    if (name.startsWith("images/") && !zipData.files[name].dir) {
      const baseName = name.replace("images/", "");
      imageFiles[baseName] = zipData.files[name];
    }
  }

  // 解析每行数据
  const products: any[] = [];
  for (const row of rawData) {
    const product: any = {};

    // 中文表头映射
    product.code = row["编码"] || "";
    product.name = row["产品名称"] || "";
    product.name_en = row["英文名称"] || "";
    product.oem_number = row["OEM号"] || "";
    product.category_name = row["分类"] || "";
    product.brand = row["品牌"] || "";
    product.unit = row["单位"] || "个";
    product.weight_kg = Number(row["重量(kg)"]) || 0;
    product.package_length_cm = Number(row["包装长(cm)"]) || 0;
    product.package_width_cm = Number(row["包装宽(cm)"]) || 0;
    product.package_height_cm = Number(row["包装高(cm)"]) || 0;
    product.cost_price = Number(row["成本价"]) || 0;
    product.sale_price = Number(row["销售价"]) || 0;
    product.applicable_models = row["适用车型"]
      ? String(row["适用车型"]).split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
      : [];
    product.status = row["状态"] || "active";
    product.description = row["描述"] || "";

    // 处理图片
    const imageFilesStr = row["图片文件"] || "";
    const image_urls: string[] = [];

    if (imageFilesStr) {
      const fileNames = String(imageFilesStr).split(",").map((s) => s.trim()).filter(Boolean);
      for (const fileName of fileNames) {
        // 跳过 URL 下载失败的标记
        if (fileName.startsWith("(URL下载失败)")) {
          const url = fileName.replace("(URL下载失败)", "");
          image_urls.push(url); // 保留原始 URL
          continue;
        }

        // 从 ZIP 中查找图片文件
        const imgFile = imageFiles[fileName];
        if (imgFile) {
          const base64 = await imgFile.async("base64");
          // 根据扩展名推断 MIME
          const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
          const mimeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            gif: "image/gif",
          };
          const mime = mimeMap[ext] || "image/jpeg";
          image_urls.push(`data:${mime};base64,${base64}`);
        }
      }
    }

    product.image_urls = image_urls;
    products.push(product);
  }

  return products;
}

/**
 * 导出模板（不含图片，仅 Excel）
 */
export async function downloadProductTemplate() {
  const { downloadTemplate } = await import("./excel-utils");
  downloadTemplate("产品导入模板", [
    { key: "code", label: "编码", example: "留空则自动生成" },
    { key: "name", label: "产品名称", required: true, example: "前制动片" },
    { key: "name_en", label: "英文名称", example: "Front Brake Pad" },
    { key: "oem_number", label: "OEM号", example: "OEM-TOYOTA-001" },
    { key: "category_name", label: "分类", example: "制动系统" },
    { key: "brand", label: "品牌", example: "Bosch" },
    { key: "unit", label: "单位", required: true, example: "套" },
    { key: "weight_kg", label: "重量(kg)", example: "1.2" },
    { key: "package_length_cm", label: "包装长(cm)", example: "25" },
    { key: "package_width_cm", label: "包装宽(cm)", example: "18" },
    { key: "package_height_cm", label: "包装高(cm)", example: "5" },
    { key: "cost_price", label: "成本价", example: "35.00" },
    { key: "sale_price", label: "销售价", required: true, example: "58.00" },
    { key: "applicable_models", label: "适用车型", example: "Toyota Camry,Corolla" },
    { key: "status", label: "状态", example: "active/discontinued" },
    { key: "image_files", label: "图片文件", example: "PD001-1.jpg,PD001-2.png" },
    { key: "description", label: "描述", example: "适用于丰田卡罗拉" },
  ]);
}
