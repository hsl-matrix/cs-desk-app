import { NextRequest, NextResponse } from "next/server";

type HandoffStatus = "waiting" | "assigned" | "in-progress" | "completed" | "rejected";
type HandoffPriority = "low" | "medium" | "high" | "urgent";

type HandoffChannel = "phone" | "email" | "chat" | "onsite";

type Team = "고객상담 1팀" | "고객상담 2팀" | "기술지원" | "품질관리" | "VIP 지원" | "영업지원";

type HandoffRecord = {
  id: string;
  ticketId: string;
  title: string;
  channel: HandoffChannel;
  fromAgent: string;
  fromTeam: Team;
  toTeam: Team;
  priority: HandoffPriority;
  status: HandoffStatus;
  reason: string;
  createdAt: string;
  dueAt: string;
  lastUpdatedAt: string;
};

const TEAMS: Team[] = [
  "고객상담 1팀",
  "고객상담 2팀",
  "기술지원",
  "품질관리",
  "VIP 지원",
  "영업지원",
];

const AGENT_NAMES = [
  "이지은",
  "강원석",
  "김로하",
  "박시온",
  "윤지훈",
  "정아린",
  "최태윤",
];

const REASONS = [
  "심화 기술 상담 필요",
  "반품 승인 권한 요청",
  "VIP 고객 이관",
  "품질 이슈 분석",
  "재구매 제안 진행",
  "계약 조건 재협상",
];

const TITLES = [
  "프리미엄 고객 결제 오류",
  "B2B 파트너 물류 SLA 위반",
  "앱 크래시 긴급 대응",
  "장기 미해결 티켓 검토",
  "하이리스크 CS 재배정",
  "주문 취소 정책 문의",
];

const STATUS_POOL: HandoffStatus[] = [
  "waiting",
  "assigned",
  "in-progress",
  "completed",
  "rejected",
];

const PRIORITY_POOL: HandoffPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

const CHANNEL_POOL: HandoffChannel[] = [
  "phone",
  "email",
  "chat",
  "onsite",
];

const HANDOFFS: HandoffRecord[] = Array.from({ length: 90 }, (_, index) => {
  const created = new Date();
  created.setDate(created.getDate() - (index % 20));
  created.setHours(8 + (index % 9), (index * 11) % 60, 0, 0);

  const due = new Date(created);
  due.setHours(due.getHours() + 24 + (index % 12));

  const updated = new Date(created);
  updated.setHours(updated.getHours() + (index % 18));

  return {
    id: `HANDOFF-${(index + 1).toString().padStart(4, "0")}`,
    ticketId: `TCK-${(7200 + index).toString().padStart(5, "0")}`,
    title: TITLES[index % TITLES.length],
    channel: CHANNEL_POOL[index % CHANNEL_POOL.length],
    fromAgent: AGENT_NAMES[index % AGENT_NAMES.length],
    fromTeam: TEAMS[index % TEAMS.length],
    toTeam: TEAMS[(index + 2) % TEAMS.length],
    priority: PRIORITY_POOL[index % PRIORITY_POOL.length],
    status: STATUS_POOL[index % STATUS_POOL.length],
    reason: REASONS[index % REASONS.length],
    createdAt: created.toISOString(),
    dueAt: due.toISOString(),
    lastUpdatedAt: updated.toISOString(),
  } satisfies HandoffRecord;
});

function parseParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize")) || 10));
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const team = url.searchParams.get("team");
  const search = url.searchParams.get("search")?.trim().toLowerCase() || undefined;

  return {
    page,
    pageSize,
    status: status && status !== "all" ? (status as HandoffStatus) : undefined,
    priority: priority && priority !== "all" ? (priority as HandoffPriority) : undefined,
    team: team && team !== "all" ? (team as Team) : undefined,
    search,
  };
}

export function GET(request: NextRequest) {
  const params = parseParams(request);

  let filtered = HANDOFFS;

  if (params.status) {
    filtered = filtered.filter((record) => record.status === params.status);
  }

  if (params.priority) {
    filtered = filtered.filter((record) => record.priority === params.priority);
  }

  if (params.team) {
    filtered = filtered.filter(
      (record) => record.fromTeam === params.team || record.toTeam === params.team,
    );
  }

  if (params.search) {
    filtered = filtered.filter(
      (record) =>
        record.id.toLowerCase().includes(params.search!) ||
        record.ticketId.toLowerCase().includes(params.search!) ||
        record.title.toLowerCase().includes(params.search!) ||
        record.fromAgent.toLowerCase().includes(params.search!),
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
