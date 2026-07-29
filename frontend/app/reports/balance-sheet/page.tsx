"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { reports } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BalanceSheet } from "@/types";

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reports.balanceSheet()
      .then(setData)
      .catch(() => toast.error("Failed to load balance sheet"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-slate-500 text-sm mt-1">Cash position overview</p>
        </div>
      </div>

      {loading ? <PageLoading /> : !data ? (
        <Card><CardContent className="p-12 text-center text-slate-500">No data available</CardContent></Card>
      ) : (
        <>
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{data.note}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Cash Position</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(data.cash_position)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Total Income (All Time)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.total_income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Total Expenses (All Time)</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(data.total_expenses)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-700">Total Income</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(data.total_income)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-700">Total Expenses</span>
                  <span className="font-medium text-rose-600">-{formatCurrency(data.total_expenses)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-semibold text-slate-900">Cash Position</span>
                  <span className="font-bold text-xl text-primary">{formatCurrency(data.cash_position)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 text-right">As of {formatDate(data.as_of)}</p>
            </CardContent>
          </Card>
        </>
      )}
    </AuthLayout>
  );
}
