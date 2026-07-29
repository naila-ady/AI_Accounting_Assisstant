"use client";

import { useState } from "react";
import { toast } from "sonner";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function YoYPage() {
  const [data, setData] = useState<{
    rows: { category: string; year_a_total: number; year_b_total: number; change_amount: number; change_percent: number | null }[];
    year_a: number;
    year_b: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [yearA, setYearA] = useState(String(currentYear - 1));
  const [yearB, setYearB] = useState(String(currentYear));
  const [category, setCategory] = useState("");

  const fetch = () => {
    setLoading(true);
    reports.yoy(category || undefined, parseInt(yearA), parseInt(yearB))
      .then(setData)
      .catch(() => toast.error("Failed to load comparison"))
      .finally(() => setLoading(false));
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Year-over-Year Comparison</h1>
          <p className="text-slate-500 text-sm mt-1">Compare income/expenses across years</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Input id="yearA" label="Year A" type="number" value={yearA} onChange={(e) => setYearA(e.target.value)} />
            <Input id="yearB" label="Year B" type="number" value={yearB} onChange={(e) => setYearB(e.target.value)} />
            <Input id="category" label="Category (optional)" type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All categories" />
            <Button onClick={fetch} loading={loading}>Compare</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <PageLoading /> : !data ? (
        <EmptyState title="Select years and click Compare" />
      ) : data.rows.length === 0 ? (
        <EmptyState title="No data found for selected years/category" />
      ) : (
        <Card>
          <CardHeader><CardTitle>{data.year_a} vs {data.year_b}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Tr>
                  <Th>Category</Th>
                  <Th className="text-right">{data.year_a}</Th>
                  <Th className="text-right">{data.year_b}</Th>
                  <Th className="text-right">Change</Th>
                  <Th className="text-right">Change %</Th>
                </Tr>
              </THead>
              <TBody>
                {data.rows.map((r) => (
                  <Tr key={r.category}>
                    <Td className="font-medium">{r.category}</Td>
                    <Td className="text-right">{formatCurrency(r.year_a_total)}</Td>
                    <Td className="text-right">{formatCurrency(r.year_b_total)}</Td>
                    <Td className={`text-right font-medium ${r.change_amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{r.change_amount >= 0 ? "+" : ""}{formatCurrency(r.change_amount)}</Td>
                    <Td className={`text-right ${r.change_percent !== null ? (r.change_percent >= 0 ? "text-emerald-600" : "text-rose-600") : "text-slate-400"}`}>
                      {r.change_percent !== null ? `${r.change_percent >= 0 ? "+" : ""}${Number(r.change_percent).toFixed(2)}%` : "N/A"}
                    </Td>
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
