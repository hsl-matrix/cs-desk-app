"use client";

import dynamic from "next/dynamic";

// DnD Kit과 관련된 컴포넌트는 SSR을 비활성화하여 hydration 오류를 방지
export const CustomerFieldDesignerV2 = dynamic(
  () => import("./customer-field-designer-v2").then((mod) => ({ default: mod.CustomerFieldDesignerV2 })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">필드 디자이너를 불러오는 중...</div>
      </div>
    ),
  }
);