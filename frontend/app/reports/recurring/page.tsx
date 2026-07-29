"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info, RefreshCw } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function RecurringPage() {
  const [data, setData] = useState<{
    recurring: { category: string; avg_amount: number; months_seen: string[]; entry_ids: string[] }[];
    note: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState("3");

  const fetch = () => {
    setLoading(true);
    reports.recurring(parseInt(months) || 3)
      .then(setData)
      .catch(() => toast.error("Failed to detect recurring transactions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recurring Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Detected recurring patterns</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Input id="months" label="Lookback (months)" type="number" min={1} max={12} value={months} onChange={(e) => setMonths(e.target.value)} />
            <Button onClick={fetch} loading={loading}><RefreshCw className="h-4 w-4" /> Detect</Button>
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
        <EmptyState title="Could not load data" />
      ) : data.recurring.length === 0 ? (
        <EmptyState icon={<RefreshCw className="h-12 w-12" />} title="No recurring patterns found" description="Try increasing the lookback period" />
      ) : (
        <Card>
          <CardHeader><CardTitle>Likely Recurring Entries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Tr>
                  <Th>Category</Th>
                  <Th className="text-right">Average Amount</Th>
                  <Th>Months Seen</Th>
                  <Th>Entries</Th>
                </Tr>
              </THead>
              <TBody>
                {data.recurring.map((r) => (
                  <Tr key={r.category}>
                    <Td className="font-medium">{r.category}</Td>
                    <Td className="text-right">{formatCurrency(r.avg_amount)}</Td>
                    <Td><span className="text-xs text-slate-500">{r.months_seen.join(", ")}</span></Td>
                    <Td><span className="text-xs font-mono text-slate-400">{r.entry_ids.length} entries</span></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AuthLayout>
  );
}
