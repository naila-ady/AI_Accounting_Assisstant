"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Files, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/spinner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { reports } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardSummary } from "@/types";
import AuthLayout from "@/app/auth-layout";

const COLORS = ["#6366f1", "#a5b4fc", "#f59e0b", "#ef4444", "#10b981", "#06b6d4"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reports.dashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AuthLayout><PageLoading /></AuthLayout>;

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900"> NADY's Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your finances</p>
        </div>
        <div className="flex gap-2">
          <Link href="/income">
            <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Income</Button>
          </Link>
          <Link href="/expenses">
            <Button size="sm"><Plus className="h-4 w-4" /> Expense</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={DollarSign} label="Cash Position" value={formatCurrency(data?.net_cash ?? 0)} color="text-emerald-600" bg="bg-emerald-50" />
        <SummaryCard icon={TrendingDown} label="Total Income" value={formatCurrency(data?.total_income ?? 0)} color="text-emerald-600" bg="bg-emerald-50" />
        <SummaryCard icon={TrendingUp} label="Total Expenses" value={formatCurrency(data?.total_expenses ?? 0)} color="text-rose-600" bg="bg-rose-50" />
        <SummaryCard icon={Files} label="Entries" value={String(data?.entry_count ?? 0)} color="text-primary" bg="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
          <CardContent>
            {data?.monthly_net && data.monthly_net.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.monthly_net}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No data yet" description="Add some entries to see trends" />}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {data?.expense_by_category && data.expense_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.expense_by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {data.expense_by_category.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No expenses yet" />}
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/records"><Button variant="ghost" size="sm">View all</Button></Link>
        </CardHeader>
        <CardContent className="p-0">
          {data?.recent_entries && data.recent_entries.length > 0 ? (
            <Table>
              <THead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th className="text-right">Amount</Th>
                </Tr>
              </THead>
              <TBody>
                {data.recent_entries.map((e) => (
                  <Tr key={e.id}>
                    <Td className="text-slate-500">{formatDate(e.entry_date)}</Td>
                    <Td><Badge variant={e.entry_type}>{e.entry_type}</Badge></Td>
                    <Td>{e.category}</Td>
                    <Td className="max-w-50 truncate">{e.description}</Td>
                    <Td className={`text-right font-medium ${e.entry_type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {e.entry_type === "income" ? "+" : "-"}{formatCurrency(e.amount)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <CardContent>
              <EmptyState
                title="No transactions yet"
                description="Add your first income or expense entry to get started"
                action={<Link href="/income"><Button size="sm"><Plus className="h-4 w-4" /> Add Income</Button></Link>}
              />
            </CardContent>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
