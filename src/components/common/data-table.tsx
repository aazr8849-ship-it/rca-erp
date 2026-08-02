"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onSort?: (key: string, order: "asc" | "desc") => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSizeOptions?: number[];
}

export function GenericDataTable<T>({
  data,
  columns,
  loading,
  pagination,
  selectable,
  selectedIds = [],
  onSelectionChange,
  onSort,
  sortKey,
  sortOrder,
  rowKey = (row: any) => row.id,
  onRowClick,
  emptyTitle = "暂无数据",
  emptyDescription = "没有符合条件的数据",
  pageSizeOptions = [10, 20, 50],
}: DataTableProps<T>) {
  const allChecked =
    data.length > 0 && data.every((row) => selectedIds.includes(rowKey(row)));
  const someChecked =
    data.some((row) => selectedIds.includes(rowKey(row))) && !allChecked;

  const handleSelectAll = () => {
    if (allChecked) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(rowKey));
    }
  };

  const handleRowSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    const newOrder = sortKey === col.key && sortOrder === "asc" ? "desc" : "asc";
    onSort(col.key, newOrder);
  };

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`sk-${i}`}>
        {selectable && (
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
        )}
        {columns.map((col) => (
          <TableCell key={col.key}>
            <Skeleton className="h-4 w-full max-w-[120px]" />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <div className="flex flex-col bg-white rounded-md border border-gray-200">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#364e5b] hover:bg-[#364e5b] border-none">
              {selectable && (
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={allChecked || (someChecked && "indeterminate")}
                    onCheckedChange={handleSelectAll}
                    className="border-white/60 data-[state=checked]:bg-[#3298cb] data-[state=checked]:border-[#3298cb]"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-white font-medium text-xs",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable && "cursor-pointer select-none hover:bg-white/5",
                  )}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      col.align === "right" && "justify-end",
                      col.align === "center" && "justify-center",
                    )}
                  >
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown
                        size={12}
                        className={cn(
                          "transition-colors",
                          sortKey === col.key
                            ? "text-[#3298cb] bg-white"
                            : "text-white/60",
                        )}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : data.length === 0 ? (
              <TableRow className="border-none">
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-0"
                >
                  <EmptyState
                    icon={Inbox}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const id = rowKey(row);
                const checked = selectedIds.includes(id);
                return (
                  <TableRow
                    key={id || idx}
                    className={cn(
                      "border-b border-gray-100 text-sm cursor-default",
                      idx % 2 === 0 ? "bg-white" : "bg-[#eeeff0]/40",
                      "hover:bg-[#eaf4fa] transition-colors",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell
                        className="px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleRowSelect(id)}
                          className="data-[state=checked]:bg-[#3298cb] data-[state=checked]:border-[#3298cb]"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          "py-2.5",
                        )}
                      >
                        {col.render
                          ? col.render(row, idx)
                          : (row as any)[col.key] ?? "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pagination && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span>
              共 <span className="font-medium text-gray-800">{pagination.total}</span> 条
            </span>
            <div className="flex items-center gap-1">
              <span>每页</span>
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  pagination.onPageSizeChange?.(Number(e.target.value))
                }
                className="h-6 px-1 border border-gray-200 rounded text-xs bg-white"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span>条</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs">
              第 <span className="font-medium text-gray-800">{pagination.page}</span> /{" "}
              {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
