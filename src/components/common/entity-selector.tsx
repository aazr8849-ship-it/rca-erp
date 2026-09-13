"use client";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";

// Supabase配置（publishable key是公开的，可以硬编码）
const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

async function fetchTable(table: string, search: string, searchFields: string[]) {
  let url = SUPABASE_URL + "/rest/v1/" + table + "?select=*&limit=20";
  if (search && searchFields.length > 0) {
    const filters = searchFields.map(function(f){ return f + ".ilike.%" + search + "%"; }).join(",");
    url += "&or=" + filters;
  }
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
  });
  if (!res.ok) return [];
  return await res.json();
}

interface EntitySelectorProps {
  table: string;
  value: string;
  onChange: (id: string, name: string, extra?: any) => void;
  placeholder: string;
  searchFields?: string[];
  displayFields?: string[];
}

export function EntitySelector({
  table, value, onChange, placeholder, searchFields = ["name"], displayFields = ["name"],
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    if (value) fetchData("");
  }, [value]);

  useEffect(() => {
    if (open) fetchData(search);
  }, [open]);

  useEffect(() => {
    if (open && search !== "") {
      const timer = setTimeout(() => fetchData(search), 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const fetchData = async (s: string) => {
    try {
      const data = await fetchTable(table, s, searchFields);
      setItems(data || []);
      if (value && data) {
        const found = data.find((d: any) => d.id === value);
        if (found) setSelectedName(found[displayFields[0]] || "");
      }
    } catch (e) {
      console.error("EntitySelector fetch error:", e);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
          {selectedName || placeholder}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 z-[100]" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">暂无数据</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm border-b border-slate-100 dark:border-slate-700 last:border-0"
                onClick={() => {
                  onChange(item.id, item[displayFields[0]] || "", item);
                  setSelectedName(item[displayFields[0]] || "");
                  setOpen(false);
                }}
              >
                <div className="font-medium">{item[displayFields[0]] || "-"}</div>
                {displayFields[1] && item[displayFields[1]] && (
                  <div className="text-xs text-gray-500">{item[displayFields[1]]}</div>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CustomerSelector({ value, onChange }: { value: string; onChange: (id: string, name: string, extra?: any) => void }) {
  return <EntitySelector table="customers" value={value} onChange={onChange} placeholder="选择客户..." searchFields={["name", "code"]} displayFields={["name", "country"]} />;
}

export function SupplierSelector({ value, onChange }: { value: string; onChange: (id: string, name: string, extra?: any) => void }) {
  return <EntitySelector table="suppliers" value={value} onChange={onChange} placeholder="选择供应商..." searchFields={["name", "code"]} displayFields={["name", "country"]} />;
}

export function ProductSelector({ value, onChange }: { value: string; onChange: (id: string, name: string, extra?: any) => void }) {
  return <EntitySelector table="products" value={value} onChange={onChange} placeholder="选择产品..." searchFields={["name", "code", "oem_number"]} displayFields={["name", "oem_number"]} />;
}

export function OrderSelector({ value, onChange }: { value: string; onChange: (id: string, name: string, extra?: any) => void }) {
  return <EntitySelector table="orders" value={value} onChange={onChange} placeholder="选择订单..." searchFields={["code"]} displayFields={["code"]} />;
}
