"use client";

import { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number;
  pageIndex: number; // zero-based
  pageSize: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems,
  pageIndex,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  isLoading,
  emptyState,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: totalPages,
    manualPagination: true,
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  const pageNumbers = useMemo(() => getPaginationRange(pageIndex, totalPages), [
    pageIndex,
    totalPages,
  ]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <ShadTable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  if (header.isPlaceholder) {
                    return <TableHead key={header.id} />;
                  }

                  return (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  데이터를 불러오는 중입니다...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  {emptyState ?? "표시할 데이터가 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadTable>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">표시 개수</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
            disabled={!onPageSizeChange}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}개
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            총 {totalItems.toLocaleString()}건
          </span>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
          >
            이전
          </Button>
          {pageNumbers.map((pageNumber, index) =>
            typeof pageNumber === "number" ? (
              <Button
                key={`${pageNumber}-${index}`}
                variant={pageNumber - 1 === pageIndex ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber - 1)}
              >
                {pageNumber}
              </Button>
            ) : (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                …
              </span>
            ),
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages - 1, pageIndex + 1))}
            disabled={pageIndex >= totalPages - 1}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}

function getPaginationRange(currentIndex: number, totalPages: number) {
  const delta = 2;
  const range: (number | string)[] = [];
  const currentPage = currentIndex + 1;

  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  range.push(1);
  if (left > 2) {
    range.push("ellipsis-left");
  }

  for (let page = left; page <= right; page += 1) {
    range.push(page);
  }

  if (right < totalPages - 1) {
    range.push("ellipsis-right");
  }

  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}
