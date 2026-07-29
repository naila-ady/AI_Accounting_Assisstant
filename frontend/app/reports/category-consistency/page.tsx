"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/api";

export default function CategoryConsistencyPage() {
  const [data, setData] = useState<{
    possible_duplicates: { category_a: string; category_b: string; similarity_score: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    reports.categoryConsistency()
      .then(setData)
      .catch(() => toast.error("Failed to check categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Category Consistency Check</h1>
          <p className="text-slate-500 text-sm mt-1">Detect near-duplicate category names</p>
        </div>
        <Button onClick={fetch} loading={loading}><AlertTriangle className="h-4 w-4" /> Recheck</Button>
      </div>

      {loading ? <PageLoading /> : !data ? (
        <EmptyState title="Could not load data" />
      ) : data.possible_duplicates.length === 0 ? (
        <EmptyState icon={<AlertTriangle className="h-12 w-12 text-emerald-400" />} title="All categories look consistent" description="No near-duplicate names detected" />
      ) : (
        <Card>
          <CardHeader><CardTitle>Possible Duplicate Categories</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Tr>
                  <Th>Category A</Th>
                  <Th>Category B</Th>
                  <Th className="text-right">Similarity</Th>
                </Tr>
              </THead>
              <TBody>
                {data.possible_duplicates.map((d) => (
                  <Tr key={`${d.category_a}-${d.category_b}`}>
                    <Td className="font-medium">{d.category_a}</Td>
                    <Td className="font-medium">{d.category_b}</Td>
                    <Td className="text-right">{(d.similarity_score * 100).toFixed(1)}%</Td>
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
