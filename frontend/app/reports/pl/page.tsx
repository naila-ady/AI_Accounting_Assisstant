"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { reports } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { PLStatement } from "@/types";

export default function PLPage() {
  const [data, setData] = useState<PLStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(today);

  const fetch = () => {
    setLoading(true);
    reports.pl(start, end)
      .then(setData)
      .catch(() => toast.error("Failed to load P&L"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit & Loss Statement</h1>
          <p className="text-slate-500 text-sm mt-1">Income vs Expenses</p>
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

      {loading ? <PageLoading /> : !data ? (
        <EmptyState title="No data for this period" />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Total Income</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.total_income)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Total Expenses</p><p className="text-2xl font-bold text-rose-600">{formatCurrency(data.total_expenses)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Net Profit</p><p className={`text-2xl font-bold ${data.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(data.net_profit)}</p></CardContent></Card>
          </div>

          {/* Chart */}
          {data.income_by_category.length > 0 && data.expense_by_category.length > 0 && (
            <Card className="mb-6">
              <CardHeader><CardTitle>Category Comparison</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    ...data.income_by_category.map((c) => ({ name: c.category, Income: c.total, Expenses: 0 })),
                    ...data.expense_by_category.map((c) => ({ name: c.category, Income: 0, Expenses: c.total })),
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Income Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Income by Category</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead><Tr><Th>Category</Th><Th className="text-right">Count</Th><Th className="text-right">Amount</Th></Tr></THead>
                  <TBody>
                    {data.income_by_category.map((c) => (
                      <Tr key={c.category}>
                        <Td className="font-medium">{c.category}</Td>
                        <Td className="text-right text-slate-500">{c.count}</Td>
                        <Td className="text-right font-medium text-emerald-600">{formatCurrency(c.total)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead><Tr><Th>Category</Th><Th className="text-right">Count</Th><Th className="text-right">Amount</Th></Tr></THead>
                  <TBody>
                    {data.expense_by_category.map((c) => (
                      <Tr key={c.category}>
                        <Td className="font-medium">{c.category}</Td>
                        <Td className="text-right text-slate-500">{c.count}</Td>
                        <Td className="text-right font-medium text-rose-600">{formatCurrency(c.total)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
