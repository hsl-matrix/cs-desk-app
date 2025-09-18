"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MessageSquareText,
  X,
  AudioLines,
  Send,
  Paperclip,
  Mic,
  Sparkles,
  Phone,
  Headphones,
  User,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDashboard, type DashboardTab } from "./dashboard-context";

const TAB_SCROLL_AMOUNT = 200;

export default function DashboardPage() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useDashboard();
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 스크롤 가능 여부 체크
  const checkScrollability = useCallback(() => {
    const scrollEl = scrollViewportRef.current;
    if (!scrollEl) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const scrollEl = scrollViewportRef.current;
    if (!scrollEl) return;

    checkScrollability();
    scrollEl.addEventListener("scroll", checkScrollability);
    
    // ResizeObserver로 크기 변경 감지
    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(scrollEl);

    return () => {
      scrollEl.removeEventListener("scroll", checkScrollability);
      resizeObserver.disconnect();
    };
  }, [checkScrollability]);

  // 탭 개수가 변경될 때 스크롤 체크
  useEffect(() => {
    setTimeout(checkScrollability, 0);
  }, [tabs.length, checkScrollability]);

  // 활성 탭으로 스크롤
  useEffect(() => {
    const activeEl = tabRefs.current[activeTabId];
    const scrollEl = scrollViewportRef.current;

    if (!scrollEl || !activeEl) return;

    const tabLeft = activeEl.offsetLeft;
    const tabWidth = activeEl.offsetWidth;
    const scrollLeft = scrollEl.scrollLeft;
    const scrollWidth = scrollEl.clientWidth;

    if (tabLeft < scrollLeft) {
      scrollEl.scrollTo({ left: tabLeft - 20, behavior: "smooth" });
    } else if (tabLeft + tabWidth > scrollLeft + scrollWidth) {
      scrollEl.scrollTo({
        left: tabLeft + tabWidth - scrollWidth + 20,
        behavior: "smooth",
      });
    }
  }, [activeTabId]);

  // 화살표 버튼 클릭 핸들러
  const handleScroll = useCallback((direction: "left" | "right") => {
    const scrollEl = scrollViewportRef.current;
    if (!scrollEl) return;

    const delta = direction === "left" ? -TAB_SCROLL_AMOUNT : TAB_SCROLL_AMOUNT;
    scrollEl.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const handleCloseTab = useCallback(
    (id: string) => {
      closeTab(id);
      delete tabRefs.current[id];
    },
    [closeTab]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs
        value={activeTabId}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col min-h-0 overflow-hidden"
      >
        <div className="relative shrink-0 bg-background/95">
          {/* 왼쪽 스크롤 버튼 */}
          {canScrollLeft && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleScroll("left")}
              className="absolute left-0 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full bg-background/95 shadow-md hover:bg-background"
              aria-label="이전 탭 보기"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          
          {/* 오른쪽 스크롤 버튼 */}
          {canScrollRight && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleScroll("right")}
              className="absolute right-0 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full bg-background/95 shadow-md hover:bg-background"
              aria-label="다음 탭 보기"
            >
              <ChevronRight className="size-4" />
            </Button>
          )}

          <ScrollArea className="w-full" viewportRef={scrollViewportRef}>
            <div className={cn(
              "flex h-12 items-center px-4",
              canScrollLeft && "pl-12",
              canScrollRight && "pr-12"
            )}>
              <TabsList className="flex h-full w-max items-end justify-start gap-1 rounded-none border-transparent bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    ref={(node) => {
                      if (node) {
                        tabRefs.current[tab.id] = node;
                      } else {
                        delete tabRefs.current[tab.id];
                      }
                    }}
                    value={tab.id}
                    className="group flex flex-none items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
                  >
                    <Headphones className="size-4 shrink-0" />
                    <span className="max-w-[140px] truncate">{tab.title}</span>
                    {tabs.length > 1 && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground opacity-0 outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-data-[state=active]:opacity-100 group-hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCloseTab(tab.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            handleCloseTab(tab.id);
                          }
                        }}
                        aria-label={`${tab.title} 닫기`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex flex-1 flex-col overflow-hidden p-0 m-0"
          >
            <ContentGrid tab={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ContentGrid({ tab }: { tab: DashboardTab }) {
  const { setTabMode } = useDashboard();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0 gap-4 overflow-hidden p-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full min-w-0 flex-1"
        >
          <ResizablePanel
            minSize={35}
            defaultSize={60}
            className="flex min-w-0"
          >
            <Card className="flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border shadow-sm">
              <CardHeader className="gap-2">
                <CardTitle>{tab.title} – Main</CardTitle>
                <CardDescription>
                  상담 내역, 고객 정보, 스크립트 등을 표시할 수 있는 주
                  영역입니다. 필요한 컴포넌트로 교체해 사용하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 px-6 pb-6 text-sm text-muted-foreground">
                주요 지표, 상담 흐름, CTI 정보를 배치해 상담원을 지원하세요.
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/60" />
          <ResizablePanel
            minSize={25}
            defaultSize={25}
            className="flex min-w-0"
          >
            <Card className="flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border shadow-sm">
              <CardHeader className="gap-2">
                <CardTitle>보조 영역</CardTitle>
                <CardDescription>
                  현재 모드:{" "}
                  <span className="font-medium text-foreground">
                    {modeLabel[tab.mode]}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 px-5 pb-6">
                <ScrollArea className="h-full w-full rounded-lg border bg-muted/40">
                  <div className="p-4 text-sm text-muted-foreground">
                    <ModeContent mode={tab.mode} />
                  </div>
                  <ScrollBar className="hidden" />
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
        <Card className="flex h-full w-16 flex-shrink-0 flex-col items-center gap-3 rounded-xl border shadow-sm px-2 py-4">
          <ModeSwitcher
            currentMode={tab.mode}
            onSelectMode={(mode) => setTabMode(tab.id, mode)}
          />
        </Card>
      </div>
      <Separator />
      <footer className="flex items-center justify-between bg-muted/60 px-4 py-3">
        <div className="text-sm text-muted-foreground">
          Tab bottom bar — add call actions, timers, or statuses here.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Hold
          </Button>
          <Button size="sm">End Call</Button>
        </div>
      </footer>
    </div>
  );
}

const modeLabel: Record<DashboardTab["mode"], string> = {
  sms: "문자",
  chat: "채팅",
  stt: "STT",
};

const modeButtons = [
  { value: "sms" as const, label: "문자", icon: MessageSquareText },
  { value: "chat" as const, label: "채팅", icon: MessageCircle },
  { value: "stt" as const, label: "STT", icon: AudioLines },
];

function ModeSwitcher({
  currentMode,
  onSelectMode,
}: {
  currentMode: DashboardTab["mode"];
  onSelectMode: (mode: DashboardTab["mode"]) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {modeButtons.map((mode) => (
        <Tooltip key={mode.value} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onSelectMode(mode.value)}
              data-active={currentMode === mode.value ? "true" : undefined}
              aria-label={mode.label}
              className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
            >
              <mode.icon className="size-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">{mode.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function ModeContent({ mode }: { mode: DashboardTab["mode"] }) {
  if (mode === "sms") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">문자 대화</h4>
          <Badge variant="secondary" className="text-xs">SMS</Badge>
        </div>
        <div className="flex-1 space-y-4 overflow-auto mb-4">
          <MessageBubble 
            sender="고객" 
            timestamp="10:02" 
            align="left"
            avatar="고"
            status="read"
          >
            안녕하세요, 주문 배송이 어디까지 진행됐나요?
          </MessageBubble>
          <MessageBubble 
            sender="상담원" 
            timestamp="10:03" 
            align="right"
            avatar="상"
            status="sent"
          >
            안녕하세요. 현재 서울 물류센터를 출발했고 오늘 중으로 도착 예정입니다.
          </MessageBubble>
        </div>
        <MessageInput type="sms" />
      </div>
    );
  }

  if (mode === "chat") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">라이브 채팅</h4>
          <Badge variant="default" className="text-xs">
            <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            실시간
          </Badge>
        </div>
        <div className="flex-1 space-y-4 overflow-auto mb-4">
          <MessageBubble 
            sender="상담원" 
            timestamp="10:05" 
            align="right"
            avatar="상"
            status="sent"
          >
            화면 공유를 시작할까요?
          </MessageBubble>
          <MessageBubble 
            sender="고객" 
            timestamp="10:05" 
            align="left"
            avatar="고"
            status="read"
          >
            네, 부탁드립니다.
          </MessageBubble>
          <Card className="border-dashed bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">메모</Badge>
                <span className="text-xs text-muted-foreground">10:05</span>
              </div>
              <p className="text-sm">
                고객은 프리미엄 요금제로 업그레이드에 관심 있음.
              </p>
            </CardContent>
          </Card>
        </div>
        <MessageInput type="chat" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">STT 실시간 전사</h4>
        <Badge variant="outline" className="text-xs">
          <AudioLines className="mr-1 h-3 w-3" />
          음성인식
        </Badge>
      </div>
      <div className="flex-1 space-y-3 overflow-auto mb-4">
        <TranscriptLine speaker="고객" time="10:06" type="customer">
          지금 들리는 잡음이 많아서 잘 안 들립니다.
        </TranscriptLine>
        <TranscriptLine speaker="상담원" time="10:06" type="agent">
          죄송합니다. 마이크를 조정하고 다시 설명드리겠습니다.
        </TranscriptLine>
        <TranscriptLine speaker="고객" time="10:07" type="customer">
          네, 지금은 잘 들립니다.
        </TranscriptLine>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Sparkles className="mr-2 h-4 w-4" />
          AI 요약 생성
        </Button>
        <Button variant="ghost" size="sm">
          <Mic className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({
  sender,
  timestamp,
  align,
  avatar,
  status,
  children,
}: {
  sender: string;
  timestamp: string;
  align: "left" | "right";
  avatar: string;
  status?: "sent" | "delivered" | "read";
  children: ReactNode;
}) {
  const isLeft = align === "left";
  
  return (
    <div className={cn(
      "flex gap-3 group",
      isLeft ? "justify-start" : "justify-end"
    )}>
      {isLeft && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn(
            "text-xs font-medium",
            "bg-primary/10 text-primary"
          )}>
            {avatar}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        !isLeft && "items-end"
      )}>
        <div className={cn(
          "flex items-center gap-2 text-xs",
          isLeft ? "justify-start" : "justify-end"
        )}>
          <span className="font-medium text-foreground/70">{sender}</span>
          <span className="text-muted-foreground">{timestamp}</span>
          {status && !isLeft && (
            <span className="text-muted-foreground">
              {status === "sent" && "✓"}
              {status === "delivered" && "✓✓"}
              {status === "read" && (
                <span className="text-primary">✓✓</span>
              )}
            </span>
          )}
        </div>
        
        <div className={cn(
          "px-4 py-2.5 rounded-2xl text-sm transition-all",
          "shadow-sm hover:shadow-md",
          isLeft ? [
            "bg-muted/50 text-foreground",
            "rounded-bl-md border border-border/50",
          ] : [
            "bg-primary text-primary-foreground",
            "rounded-br-md",
          ]
        )}>
          {children}
        </div>
      </div>
      
      {!isLeft && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {avatar}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function MessageInput({ type }: { type: "sms" | "chat" }) {
  const isSms = type === "sms";
  
  return (
    <div className="border-t pt-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder={isSms ? "문자 메시지를 입력하세요..." : "메시지를 입력하세요..."}
              className="pr-10"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          {isSms && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                0 / 80 bytes
              </span>
              <Badge variant="outline" className="text-xs">
                MMS 사용 가능
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {!isSms && (
            <Button size="icon" variant="ghost">
              <Mic className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {!isSms && (
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
            빠른 답변 1
          </Badge>
          <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
            빠른 답변 2
          </Badge>
          <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
            템플릿
          </Badge>
        </div>
      )}
    </div>
  );
}

function TranscriptLine({
  speaker,
  time,
  type,
  children,
}: {
  speaker: string;
  time: string;
  type: "customer" | "agent";
  children: ReactNode;
}) {
  const isCustomer = type === "customer";
  
  return (
    <div className={cn(
      "relative flex gap-3 group transition-all",
      "hover:translate-x-1"
    )}>
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-full",
        isCustomer ? "bg-blue-500/20" : "bg-green-500/20"
      )} />
      
      <div className="flex-1 pl-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isCustomer ? "secondary" : "default"} 
              className="h-5 px-2 text-xs font-medium"
            >
              {speaker}
            </Badge>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          <Badge variant="outline" className="h-5 px-2 text-xs">
            <AudioLines className="mr-1 h-3 w-3" />
            STT
          </Badge>
        </div>
        
        <div className={cn(
          "p-3 rounded-lg text-sm leading-relaxed",
          "bg-background/50 border border-border/50",
          "transition-all hover:bg-background/70"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}