"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const STATUS_LABEL: Record<HandoffStatus, string> = {
  waiting: "대기",
  assigned: "배정 완료",
  "in-progress": "처리 중",
  completed: "완료",
  rejected: "반려",
};

const PRIORITY_LABEL: Record<HandoffPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const PRIORITY_VARIANT: Record<HandoffPriority, "outline" | "secondary" | "default" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

type HandoffStatus = "waiting" | "assigned" | "in-progress" | "completed" | "rejected";
type HandoffPriority = "low" | "medium" | "high" | "urgent";

type HandoffRow = {
  id: string;
  ticketId: string;
  title: string;
  channel: string;
  fromAgent: string;
  fromTeam: string;
  toTeam: string;
  priority: HandoffPriority;
  status: HandoffStatus;
  reason: string;
  createdAt: string;
  dueAt: string;
  lastUpdatedAt: string;
};

type ApiResponse = {
  items: HandoffRow[];
  total: number;
  page: number;
  pageSize: number;
};

const columns: ColumnDef<HandoffRow>[] = [
  {
    accessorKey: "id",
    header: "이관 ID",
  },
  {
    accessorKey: "title",
    header: "요청 제목",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium leading-none">{row.original.title}</p>
        <span className="text-xs text-muted-foreground">티켓 {row.original.ticketId}</span>
      </div>
    ),
  },
  {
    accessorKey: "fromTeam",
    header: "요청 팀",
    cell: ({ row }) => (
      <div>
        <div>{row.original.fromTeam}</div>
        <p className="text-xs text-muted-foreground">담당 {row.original.fromAgent}</p>
      </div>
    ),
  },
  {
    accessorKey: "toTeam",
    header: "이관 대상",
  },
  {
    accessorKey: "priority",
    header: "우선순위",
    cell: ({ row }) => (
      <Badge variant={PRIORITY_VARIANT[row.original.priority]}>
        {PRIORITY_LABEL[row.original.priority]}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => STATUS_LABEL[row.original.status],
  },
  {
    accessorKey: "dueAt",
    header: "SLA 마감",
    cell: ({ row }) => formatDateTime(row.original.dueAt),
  },
  {
    accessorKey: "lastUpdatedAt",
    header: "최근 업데이트",
    cell: ({ row }) => formatRelative(row.original.lastUpdatedAt),
  },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return `${diffMinutes}분 전`;
  }
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}일 전`;
}

type Filters = {
  search: string;
  status: HandoffStatus | "all";
  priority: HandoffPriority | "all";
  team: string | "all";
};

export default function HandoffsPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    priority: "all",
    team: "all",
  });
  const [searchInput, setSearchInput] = useState("");
  const [statusSelect, setStatusSelect] = useState<Filters["status"]>("all");
  const [prioritySelect, setPrioritySelect] = useState<Filters["priority"]>("all");
  const [teamSelect, setTeamSelect] = useState<Filters["team"]>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<HandoffRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (filters.search) params.set("search", filters.search);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.priority !== "all") params.set("priority", filters.priority);
      if (filters.team !== "all") params.set("team", filters.team);

      const response = await fetch(`/api/handoffs?${params.toString()}`);
      if (!response.ok) throw new Error("업무 이관 데이터를 불러오지 못했습니다.");

      const json = (await response.json()) as ApiResponse;
      setData(json.items);
      setTotal(json.total);
    } catch (error) {
      console.error(error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters.priority, filters.search, filters.status, filters.team, pageIndex, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitFilters = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFilters({
        search: searchInput,
        status: statusSelect,
        priority: prioritySelect,
        team: teamSelect,
      });
      setPageIndex(0);
    },
    [prioritySelect, searchInput, statusSelect, teamSelect],
  );

  const handleReset = useCallback(() => {
    setFilters({ search: "", status: "all", priority: "all", team: "all" });
    setSearchInput("");
    setStatusSelect("all");
    setPrioritySelect("all");
    setTeamSelect("all");
    setPageIndex(0);
  }, []);

  const computedData = useMemo(() => data, [data]);

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-hidden p-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">업무이관</h1>
        <p className="text-sm text-muted-foreground">
          SLA 기반 이관 현황을 추적하고, 우선순위와 책임 팀을 조정해 처리 병목을 줄이세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">필터</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmitFilters}
            className="grid gap-4 md:grid-cols-[minmax(0,260px)_repeat(3,200px)_auto] md:items-end"
          >
            <div className="space-y-1">
              <label htmlFor="search" className="text-sm font-medium">
                검색어
              </label>
              <Input
                id="search"
                placeholder="이관 ID, 티켓, 담당자"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium">
                상태
              </label>
              <Select
                value={statusSelect}
                onValueChange={(value) => setStatusSelect(value as Filters["status"])}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="waiting">대기</SelectItem>
                  <SelectItem value="assigned">배정</SelectItem>
                  <SelectItem value="in-progress">처리 중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="priority" className="text-sm font-medium">
                우선순위
              </label>
              <Select
                value={prioritySelect}
                onValueChange={(value) => setPrioritySelect(value as Filters["priority"])}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="team" className="text-sm font-medium">
                대상 팀
              </label>
              <Select
                value={teamSelect}
                onValueChange={(value) => setTeamSelect(value as Filters["team"])}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="팀" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="고객상담 1팀">고객상담 1팀</SelectItem>
                  <SelectItem value="고객상담 2팀">고객상담 2팀</SelectItem>
                  <SelectItem value="기술지원">기술지원</SelectItem>
                  <SelectItem value="품질관리">품질관리</SelectItem>
                  <SelectItem value="VIP 지원">VIP 지원</SelectItem>
                  <SelectItem value="영업지원">영업지원</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">검색</Button>
              <Button type="button" variant="ghost" onClick={handleReset}>
                초기화
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <DataTable
        columns={columns}
        data={computedData}
        totalItems={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={(next) => setPageIndex(next)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />
    </div>
  );
}
