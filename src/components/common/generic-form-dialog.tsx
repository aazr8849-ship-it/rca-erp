"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CustomerSelector, SupplierSelector, ProductSelector, OrderSelector } from "@/components/common/entity-selector";
import { toast } from "sonner";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "entity-customer" | "entity-supplier" | "entity-product" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface FormConfig {
  moduleName: string;
  fields: FormField[];
  // 明细行配置（可选）
  itemFields?: FormField[];
  itemLabel?: string;
  // 提交函数
  onSubmit: (data: any) => Promise<void>;
}

interface GenericFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: FormConfig;
  onSuccess?: () => void;
}

export function GenericFormDialog({ open, onOpenChange, config, onSuccess }: GenericFormDialogProps) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initForm: Record<string, any> = {};
      config.fields.forEach(f => { initForm[f.key] = f.defaultValue ?? ""; });
      setForm(initForm);
      if (config.itemFields) {
        setItems([createEmptyItem(config.itemFields)]);
      }
    }
  }, [open]);

  const createEmptyItem = (itemFields: FormField[]) => {
    const item: Record<string, any> = {};
    itemFields.forEach(f => { item[f.key] = f.defaultValue ?? ""; });
    return item;
  };

  const handleSubmit = async () => {
    // 校验必填
    for (const f of config.fields) {
      if (f.required && !form[f.key]) {
        toast.error(`请填写${f.label}`);
        return;
      }
    }
    if (config.itemFields) {
      for (let i = 0; i < items.length; i++) {
        for (const f of config.itemFields) {
          if (f.required && !items[i][f.key]) {
            toast.error(`第${i + 1}行请填写${f.label}`);
            return;
          }
        }
      }
    }

    setSaving(true);
    console.log('FORM DATA:', JSON.stringify(form));
    console.log('ITEMS:', JSON.stringify(items));
    try {
      console.log('SUBMITTING:', JSON.stringify({ ...form, items: config.itemFields ? items.filter(it => it.product_id) : undefined }));
      await config.onSubmit({ ...form, items: config.itemFields ? items.filter(it => it.product_id) : undefined });
      toast.success(`${config.moduleName}创建成功`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('CREATE ERROR:', err);
      toast.error(err.message || "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField, value: any, onChange: (v: any) => void) => {
    switch (field.type) {
      case "text":
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
      case "number":
        return <Input type="number" value={value || 0} onChange={(e) => onChange(Number(e.target.value))} placeholder={field.placeholder} />;
      case "textarea":
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder={field.placeholder} /></SelectTrigger>
            <SelectContent>
              {field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "entity-customer":
        return <CustomerSelector value={value} onChange={(id) => onChange(id)} />;
      case "entity-supplier":
        return <SupplierSelector value={value} onChange={(id) => onChange(id)} />;
      case "entity-product":
        return <ProductSelector value={value} onChange={(id) => onChange(id)} />;
      case "entity-order":
        return <OrderSelector value={value} onChange={(id) => onChange(id)} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle>新建{config.moduleName}</DialogTitle>
        </DialogHeader>
        
        {/* 主表字段 */}
        <div className="grid grid-cols-2 gap-4 py-2">
          {config.fields.map(f => (
            <div key={f.key} className={f.type === "textarea" ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
              <Label className="text-xs text-slate-700">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              {renderField(f, form[f.key], (v) => setForm({ ...form, [f.key]: v }))}
            </div>
          ))}
        </div>

        {/* 明细行 */}
        {config.itemFields && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">{config.itemLabel || "明细"}</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, createEmptyItem(config.itemFields!)])}>
                <Plus className="h-3.5 w-3.5 mr-1" />添加行
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start p-2 border border-slate-200 rounded-md">
                  {config.itemFields.map(f => (
                    <div key={f.key} className={f.key === "product_id" ? "col-span-5" : f.key === "notes" ? "col-span-3" : "col-span-2"}>
                      <Label className="text-[10px] text-slate-500">{f.label}</Label>
                      <div className="mt-0.5">
                        {renderField(f, item[f.key], (v) => {
                          const newItems = [...items];
                          newItems[idx][f.key] = v;
                          setItems(newItems);
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-1 flex items-end pb-0.5">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#0B4BB8] hover:bg-[#093a8f]">
            {saving ? "创建中..." : `创建${config.moduleName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
