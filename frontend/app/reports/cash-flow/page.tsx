"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function CashFlowPage() {
  const [data, setData] = useState<{ period: { start: string; end: string }; cash_in: number; cash_out: number; net_cash_flow: number; note: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(today);

  const fetch = () => {
    setLoading(true);
    reports.cashFlow(start, end)
      .then(setData)
      .catch(() => toast.error("Failed to load cash flow"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Flow Statement</h1>
          <p className="text-slate-500 text-sm mt-1">Operating cash flow overview</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Input id="start" label="From" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <Input id="end" label="To" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            <Button onClick={fetch} loading={loading}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{data.note}</p>
        </div>
      )}

      {loading ? <PageLoading /> : !data ? (
        <EmptyState title="No data for this period" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Cash In (Income)</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.cash_in)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Cash Out (Expenses)</p><p className="text-2xl font-bold text-rose-600">{formatCurrency(data.cash_out)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Net Cash Flow</p><p className={`text-2xl font-bold ${data.net_cash_flow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(data.net_cash_flow)}</p></CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-700">Total Cash In (Operating)</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(data.cash_in)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-700">Total Cash Out (Operating)</span>
                  <span className="font-medium text-rose-600">-{formatCurrency(data.cash_out)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-semibold text-slate-900">Net Cash Flow</span>
                  <span className="font-bold text-xl">{formatCurrency(data.net_cash_flow)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 text-right">{data.period.start} to {data.period.end}</p>
            </CardContent>
          </Card>
        </>
      )}
    </AuthLayout>
  );
}
