import { NextRequest, NextResponse } from "next/server";

type CallStatus = "completed" | "in-progress" | "escalated" | "scheduled";
type Channel = "phone" | "chat" | "email" | "sms";

interface CallHistoryEntry {
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
}

const ISSUE_TYPES = [
  "배송 지연",
  "환불 요청",
  "기술 지원",
  "계정 잠김",
  "요금 문의",
  "상품 문의",
];

const AGENTS = [
  "김지원",
  "박민수",
  "이서연",
  "최성호",
  "한지윤",
  "정우진",
  "문서현",
];

const CUSTOMER_NAMES = [
  "홍길동",
  "김하늘",
  "박철수",
  "이민정",
  "최윤호",
  "정다은",
  "강서준",
  "심유나",
  "류지훈",
  "황예린",
];

const CALL_HISTORY_DATA: CallHistoryEntry[] = Array.from({ length: 160 }, (_, index) => {
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - (index % 45));
  createdDate.setHours(9 + (index % 8), (index * 13) % 60, 0, 0);

  const statusPool: CallStatus[] = ["completed", "in-progress", "escalated", "scheduled"];
  const channelPool: Channel[] = ["phone", "chat", "email", "sms"];

  return {
    id: `CALL-${(index + 1).toString().padStart(5, "0")}`,
    customerName: CUSTOMER_NAMES[index % CUSTOMER_NAMES.length],
    customerId: `CUST-${(1000 + index).toString().padStart(4, "0")}`,
    issueType: ISSUE_TYPES[index % ISSUE_TYPES.length],
    channel: channelPool[index % channelPool.length],
    status: statusPool[index % statusPool.length],
    agent: AGENTS[index % AGENTS.length],
    durationSeconds: 180 + (index * 17) % 420,
    createdAt: createdDate.toISOString(),
    satisfaction: 3 + (index % 3),
  } satisfies CallHistoryEntry;
});

type FilterParams = {
  page: number;
  pageSize: number;
  status?: CallStatus;
  channel?: Channel;
  search?: string;
};

function parseParams(request: NextRequest): FilterParams {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize")) || 10));
  const statusParam = url.searchParams.get("status");
  const channelParam = url.searchParams.get("channel");
  const search = url.searchParams.get("search")?.trim() || undefined;

  return {
    page,
    pageSize,
    status: statusParam && statusParam !== "all" ? (statusParam as CallStatus) : undefined,
    channel: channelParam && channelParam !== "all" ? (channelParam as Channel) : undefined,
    search,
  };
}

export function GET(request: NextRequest) {
  const params = parseParams(request);

  let filtered = CALL_HISTORY_DATA;

  if (params.status) {
    filtered = filtered.filter((item) => item.status === params.status);
  }

  if (params.channel) {
    filtered = filtered.filter((item) => item.channel === params.channel);
  }

  if (params.search) {
    const query = params.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.customerName.toLowerCase().includes(query) ||
        item.customerId.toLowerCase().includes(query) ||
        item.issueType.toLowerCase().includes(query) ||
        item.agent.toLowerCase().includes(query),
    );
  }

  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filtered.slice(start, end);

  return NextResponse.json({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}
