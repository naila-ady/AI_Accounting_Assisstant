"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function RatiosPage() {
  const [data, setData] = useState<{
    period: { start: string; end: string };
    profit_margin: number | null;
    expense_to_income_ratio: number | null;
    total_income: number;
    total_expenses: number;
    net_profit: number;
    note: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(today);

  const fetch = () => {
    setLoading(true);
    reports.ratios(start, end)
      .then(setData)
      .catch(() => toast.error("Failed to load ratios"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Ratio Analysis</h1>
          <p className="text-slate-500 text-sm mt-1">Profitability metrics</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Profit Margin</p>
                <p className={`text-3xl font-bold ${data.profit_margin !== null && data.profit_margin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {data.profit_margin !== null ? `${Number(data.profit_margin).toFixed(2)}%` : "N/A"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Expense-to-Income Ratio</p>
                <p className="text-3xl font-bold text-slate-900">
                  {data.expense_to_income_ratio !== null ? Number(data.expense_to_income_ratio).toFixed(2) : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Underlying Numbers</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead><Tr><Th>Metric</Th><Th className="text-right">Amount</Th></Tr></THead>
                <TBody>
                  <Tr><Td className="font-medium">Total Income</Td><Td className="text-right text-emerald-600">{formatCurrency(data.total_income)}</Td></Tr>
                  <Tr><Td className="font-medium">Total Expenses</Td><Td className="text-right text-rose-600">{formatCurrency(data.total_expenses)}</Td></Tr>
                  <Tr><Td className="font-medium">Net Profit</Td><Td className={`text-right font-bold ${data.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(data.net_profit)}</Td></Tr>
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </AuthLayout>
  );
}
