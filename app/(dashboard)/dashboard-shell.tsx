"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  Headset,
  Home as HomeIcon,
  LineChart,
  PhoneCall,
  Settings,
  Users,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardProvider, useDashboard } from "./dashboard-context";

interface SidebarItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: HomeIcon, label: "대시보드", href: "/" },
  { icon: PhoneCall, label: "실시간 상담" },
  { icon: UserCheck, label: "고객", href: "/customers" },
  { icon: Users, label: "상담원" },
  { icon: LineChart, label: "분석" },
  { icon: Settings, label: "설정", href: "/settings" },
];

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <DashboardProvider>
      <SidebarProvider defaultOpen={false}>
        <TooltipProvider delayDuration={200}>
          <ShellContent>{children}</ShellContent>
        </TooltipProvider>
      </SidebarProvider>
    </DashboardProvider>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const { addTab } = useDashboard();

  return (
    <div className="h-screen bg-muted/40 w-full overflow-hidden">
      <div className="mx-auto flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="border-l bg-background shadow-lg flex flex-col min-w-0">
          <TopBar onNewCall={addTab} />
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">{children}</div>
        </SidebarInset>
      </div>
    </div>
  );
}

function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
          <Headset className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-0.5 text-left group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold">Call Center Desk</p>
          <p className="text-xs text-sidebar-foreground/60">실시간 상담 현황</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild={!!item.href}
                    isActive={item.href ? (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) : false}
                    className="gap-3"
                    tooltip={item.label}
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        className="flex items-center gap-3 text-sm"
                      >
                        <item.icon className="size-4" aria-hidden="true" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex w-full items-center gap-3 text-sm">
                        <item.icon className="size-4" aria-hidden="true" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <div className="group-data-[collapsible=icon]:hidden space-y-2 rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/10 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sidebar-foreground">대기열</span>
            <Badge variant="secondary" className="h-5 px-2 text-[11px]">
              12 통화
            </Badge>
          </div>
          <p className="text-[11px] text-sidebar-foreground/70">
            우선 콜백 4건 대기 중 · 2분 전 업데이트
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

interface TopBarProps {
  onNewCall?: () => void;
}

function TopBar({ onNewCall }: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="size-8" aria-label="사이드바 토글" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            고객 상담 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            실시간 상담 현황을 확인하고 상담원을 지원하세요.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Bell className="size-4" aria-hidden="true" />
          알림
        </Button>
        <Button size="sm" onClick={onNewCall}>
          <PhoneCall className="size-4" aria-hidden="true" />새 상담
        </Button>
      </div>
    </header>
  );
}
