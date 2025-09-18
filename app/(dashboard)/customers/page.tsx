"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type Customer = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  tier: "VIP" | "Gold" | "Silver" | "Bronze";
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  lastContactDate: string;
  totalPurchases: number;
  region: string;
};

const tierColors = {
  VIP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Silver: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  Bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Pagination state
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
    totalItems: 0,
    totalPages: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [tierFilter, setTierFilter] = useState(searchParams.get("tier") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  const columns: ColumnDef<Customer>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "customerId",
      header: "고객 ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("customerId")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => fetchCustomers({ sortBy: "name", sortOrder: column.getIsSorted() === "asc" ? "desc" : "asc" })}
          >
            이름
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => fetchCustomers({ sortBy: "email", sortOrder: column.getIsSorted() === "asc" ? "desc" : "asc" })}
          >
            이메일
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "연락처",
    },
    {
      accessorKey: "tier",
      header: "등급",
      cell: ({ row }) => {
        const tier = row.getValue("tier") as keyof typeof tierColors;
        return (
          <Badge className={tierColors[tier]} variant="secondary">
            {tier}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusColors;
        const statusLabels = {
          active: "활성",
          inactive: "비활성",
          pending: "대기중",
        };
        return (
          <Badge className={statusColors[status]} variant="secondary">
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalPurchases",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => fetchCustomers({ sortBy: "totalPurchases", sortOrder: column.getIsSorted() === "asc" ? "desc" : "asc" })}
          >
            총 구매액
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.getValue("totalPurchases") as number;
        const formatted = new Intl.NumberFormat("ko-KR", {
          style: "currency",
          currency: "KRW",
        }).format(amount);
        return <div className="text-right">{formatted}</div>;
      },
    },
    {
      accessorKey: "region",
      header: "지역",
    },
    {
      accessorKey: "registrationDate",
      header: "가입일",
      cell: ({ row }) => {
        const date = new Date(row.getValue("registrationDate"));
        return <div>{date.toLocaleDateString("ko-KR")}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">메뉴 열기</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>작업</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(customer.customerId)}
              >
                고객 ID 복사
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>고객 상세 보기</DropdownMenuItem>
              <DropdownMenuItem>상담 이력 보기</DropdownMenuItem>
              <DropdownMenuItem>메시지 보내기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const fetchCustomers = useCallback(async (options?: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setLoading(true);

    const params = new URLSearchParams();
    const page = options?.page ?? pagination.page;
    const limit = options?.limit ?? pagination.limit;
    const search = options?.search ?? searchTerm;
    const tier = options?.tier ?? tierFilter;
    const status = options?.status ?? statusFilter;
    const sortBy = options?.sortBy ?? "name";
    const sortOrder = options?.sortOrder ?? "asc";

    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (search) params.append("search", search);
    if (tier && tier !== "all") params.append("tier", tier);
    if (status && status !== "all") params.append("status", status);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);

    // Update URL
    const newParams = new URLSearchParams();
    newParams.set("page", page.toString());
    newParams.set("limit", limit.toString());
    if (search) newParams.set("search", search);
    if (tier && tier !== "all") newParams.set("tier", tier);
    if (status && status !== "all") newParams.set("status", status);

    router.push(`/customers?${newParams.toString()}`);

    try {
      const response = await fetch(`/api/customers?${params.toString()}`);
      const result = await response.json();

      setData(result.data);
      setPagination({
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, tierFilter, statusFilter, router]);

  useEffect(() => {
    fetchCustomers();
  }, []); // Initial load only

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleSearch = () => {
    fetchCustomers({ page: 1 });
  };

  const handleFilterChange = (type: "tier" | "status", value: string) => {
    if (type === "tier") {
      setTierFilter(value);
      fetchCustomers({ tier: value, page: 1 });
    } else {
      setStatusFilter(value);
      fetchCustomers({ status: value, page: 1 });
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchCustomers({ page: newPage });
  };

  const handleLimitChange = (newLimit: string) => {
    fetchCustomers({ limit: parseInt(newLimit), page: 1 });
  };

  // Generate page numbers
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum visible page numbers

    let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h1 className="text-lg font-semibold">고객 관리</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          고객 정보를 조회하고 관리합니다
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>고객 목록</CardTitle>
            <CardDescription>
              총 {pagination.totalItems}명의 고객이 등록되어 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {/* Filters */}
              <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="이름, 이메일, 고객ID, 연락처 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch} size="sm">
                    검색
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={tierFilter} onValueChange={(value) => handleFilterChange("tier", value)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="등급 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 등급</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 상태</SelectItem>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                      <SelectItem value="pending">대기중</SelectItem>
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        열 표시 <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                              }
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          );
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          데이터를 불러오는 중...
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          결과가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {table.getFilteredSelectedRowModel().rows.length}개 선택 /
                  </span>
                  <span>
                    전체 {pagination.totalItems}개 중 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.totalItems)}개 표시
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">페이지당 행 수:</span>
                    <Select value={pagination.limit.toString()} onValueChange={handleLimitChange}>
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                    >
                      처음
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      이전
                    </Button>

                    {generatePageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      다음
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      마지막
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}