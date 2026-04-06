import AppLayout from "@/components/layout/AppLayout";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <AppLayout title="Reports">
      <div className="bg-white rounded-xl border border-border shadow-sm p-16 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Reports Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Advanced reporting and analytics for VAT filings, corporate tax, and client activity will appear here.
        </p>
      </div>
    </AppLayout>
  );
}
