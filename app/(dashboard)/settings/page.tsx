import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Settings2, Users, Palette, Bell, Shield, Building2 } from "lucide-react";

import { CustomerFieldDesignerV2 } from "./customer-field-designer-wrapper";
import { BrandManagement } from "./brand-management";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">설정</h1>
        <p className="text-sm text-muted-foreground">
          상담 환경을 커스터마이징하고 고객정보 필드를 구성하세요.
        </p>
      </header>
      <Tabs defaultValue="customer-fields" className="flex flex-1 flex-col overflow-hidden">
        <div className="bg-background/95 px-6">
          <TabsList className="h-12 justify-start gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="customer-fields"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <Users className="size-4" />
              고객정보필드
            </TabsTrigger>
            <TabsTrigger
              value="brands"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <Building2 className="size-4" />
              브랜드
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <Settings2 className="size-4" />
              일반 설정
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <FileText className="size-4" />
              템플릿
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <Palette className="size-4" />
              테마 설정
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <Bell className="size-4" />
              알림 설정
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="group flex items-center gap-2 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:text-muted-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm"
            >
              <Shield className="size-4" />
              보안
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="customer-fields"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <CustomerFieldDesignerV2 />
        </TabsContent>
        <TabsContent
          value="brands"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <BrandManagement />
        </TabsContent>
        <TabsContent
          value="general"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="text-muted-foreground">일반 설정 콘텐츠</div>
        </TabsContent>
        <TabsContent
          value="templates"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="text-muted-foreground">템플릿 관리 콘텐츠</div>
        </TabsContent>
        <TabsContent
          value="appearance"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="text-muted-foreground">테마 설정 콘텐츠</div>
        </TabsContent>
        <TabsContent
          value="notifications"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="text-muted-foreground">알림 설정 콘텐츠</div>
        </TabsContent>
        <TabsContent
          value="security"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="text-muted-foreground">보안 설정 콘텐츠</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
