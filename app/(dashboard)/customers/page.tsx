import { Suspense } from "react";

import CustomersPageClient from "./customers-page-client";

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">고객 데이터를 불러오는 중입니다…</div>}>
      <CustomersPageClient />
    </Suspense>
  );
}
