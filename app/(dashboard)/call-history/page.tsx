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

const STATUS_LABEL: Record<CallStatus, string> = {
  completed: "완료",
  "in-progress": "진행 중",
  escalated: "에스컬레이션",
  scheduled: "예약",
};

const CHANNEL_LABEL: Record<Channel, string> = {
  phone: "전화",
  chat: "채팅",
  email: "이메일",
  sms: "SMS",
};

const statusBadgeVariant: Record<CallStatus, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "secondary",
  "in-progress": "default",
  escalated: "destructive",
  scheduled: "outline",
};

type CallStatus = "completed" | "in-progress" | "escalated" | "scheduled";
type Channel = "phone" | "chat" | "email" | "sms";

type CallHistoryRow = {
  id: string;
  customerName: string;
  customerId: string;
  issueType: string;
  channel: Channel;
  status: CallStatus;
  agent: string;
  durationSeconds: number;
  createdAt: string;
  satisfaction: number;
};

type ApiResponse = {
  items: CallHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
};

const columns: ColumnDef<CallHistoryRow>[] = [
  {
    accessorKey: "id",
    header: "콜 ID",
  },
  {
    accessorKey: "customerName",
    header: "고객명",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium leading-none">{row.original.customerName}</div>
        <span className="text-xs text-muted-foreground">{row.original.customerId}</span>
      </div>
    ),
  },
  {
    accessorKey: "channel",
    header: "채널",
    cell: ({ row }) => CHANNEL_LABEL[row.original.channel],
  },
  {
    accessorKey: "issueType",
    header: "문의 유형",
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant[row.original.status]}>
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "agent",
    header: "담당자",
  },
  {
    accessorKey: "durationSeconds",
    header: "통화 시간",
    cell: ({ row }) => formatDuration(row.original.durationSeconds),
  },
  {
    accessorKey: "createdAt",
    header: "상담일",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "satisfaction",
    header: "만족도",
    cell: ({ row }) => `${row.original.satisfaction} / 5`,
  },
];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs.toString().padStart(2, "0")}초`;
}

function formatDateTime(value: string) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(new Date(value));
}

type Filters = {
  search: string;
  status: CallStatus | "all";
  channel: Channel | "all";
};

export default function CallHistoryPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    channel: "all",
  });
  const [searchInput, setSearchInput] = useState("");
  const [statusSelect, setStatusSelect] = useState<Filters["status"]>("all");
  const [channelSelect, setChannelSelect] = useState<Filters["channel"]>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<CallHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (filters.search) {
        params.set("search", filters.search);
      }
      if (filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.channel !== "all") {
        params.set("channel", filters.channel);
      }

      const response = await fetch(`/api/call-history?${params.toString()}`);
      if (!response.ok) {
        throw new Error("데이터를 불러오지 못했습니다.");
      }

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
  }, [filters.channel, filters.search, filters.status, pageIndex, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitFilters = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFilters({ search: searchInput, status: statusSelect, channel: channelSelect });
      setPageIndex(0);
    },
    [channelSelect, searchInput, statusSelect],
  );

  const handleReset = useCallback(() => {
    setFilters({ search: "", status: "all", channel: "all" });
    setSearchInput("");
    setStatusSelect("all");
    setChannelSelect("all");
    setPageIndex(0);
  }, []);

  const computedData = useMemo(() => data, [data]);

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-hidden p-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">상담이력</h1>
        <p className="text-sm text-muted-foreground">
          상담 채널 전반의 고객 접점을 추적하고, 처리 현황과 만족도를 분석하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">필터</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmitFilters}
            className="grid gap-4 md:grid-cols-[minmax(0,320px)_repeat(2,200px)_auto] md:items-end"
          >
            <div className="space-y-1">
              <label htmlFor="search" className="text-sm font-medium">
                검색어
              </label>
              <Input
                id="search"
                placeholder="고객명, 상담 ID, 이슈 유형"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium">
                상태
              </label>
              <Select value={statusSelect} onValueChange={(value) => setStatusSelect(value as Filters["status"])}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="in-progress">진행 중</SelectItem>
                  <SelectItem value="escalated">에스컬레이션</SelectItem>
                  <SelectItem value="scheduled">예약</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="channel" className="text-sm font-medium">
                채널
              </label>
              <Select value={channelSelect} onValueChange={(value) => setChannelSelect(value as Filters["channel"])}>
                <SelectTrigger id="channel">
                  <SelectValue placeholder="채널" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="phone">전화</SelectItem>
                  <SelectItem value="chat">채팅</SelectItem>
                  <SelectItem value="email">이메일</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
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
        onPageChange={(nextIndex) => {
          setPageIndex(nextIndex);
        }}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setPageIndex(0);
        }}
      />
    </div>
  );
}
