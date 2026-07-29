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
import type { TrialBalanceReport } from "@/types";

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(today);

  const fetch = () => {
    setLoading(true);
    reports.trialBalance(start, end)
      .then(setData)
      .catch(() => toast.error("Failed to load trial balance"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trial Balance</h1>
          <p className="text-slate-500 text-sm mt-1">Debits (expenses) vs Credits (income) by category</p>
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

      {/* Simplification note */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <p>{data?.note || "Loading..."}</p>
      </div>

      {loading ? <PageLoading /> : !data ? (
        <EmptyState title="No data for this period" />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Total Debits</p><p className="text-2xl font-bold text-rose-600">{formatCurrency(data.total_debit)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Total Credits</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.total_credit)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Balanced</p>            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${data.balanced ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{data.balanced ? "Yes" : "No"}</span></CardContent></Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader><CardTitle>Entry Balance by Category</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.rows.length === 0 ? (
                <CardContent><EmptyState title="No entries found for this period" /></CardContent>
              ) : (
                <Table>
                  <THead>
                    <Tr>
                      <Th>Category</Th>
                      <Th className="text-right">Debit (Expenses)</Th>
                      <Th className="text-right">Credit (Income)</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {data.rows.map((r) => (
                      <Tr key={r.category}>
                        <Td className="font-medium">{r.category}</Td>
                        <Td className="text-right text-rose-600">{r.debit > 0 ? formatCurrency(r.debit) : "-"}</Td>
                        <Td className="text-right text-emerald-600">{r.credit > 0 ? formatCurrency(r.credit) : "-"}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AuthLayout>
  );
}
