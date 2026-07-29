"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Filter, Trash2 } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/spinner";
import { entries } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Entry } from "@/types";

export default function RecordsPage() {
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    entries.list({
      ...(typeFilter && { type: typeFilter }),
      ...(categoryFilter && { category: categoryFilter }),
    }).then(setData)
      .catch(() => toast.error("Failed to load records"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [typeFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    setDeleteId(id);
    try {
      await entries.delete(id);
      toast.success("Entry deleted");
      fetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Records</h1>
          <p className="text-slate-500 text-sm mt-1">Complete transaction ledger</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select
                options={[
                  { value: "", label: "All Types" },
                  { value: "income", label: "Income" },
                  { value: "expense", label: "Expense" },
                ]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? <PageLoading /> : data.length === 0 ? (
            <EmptyState
              title="No records found"
              description={typeFilter || categoryFilter ? "Try changing your filters" : "Add your first entry to see it here"}
            />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th>Payment</Th>
                  <Th>Source</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {data.map((e) => (
                  <Tr key={e.id}>
                    <Td className="text-slate-500 whitespace-nowrap">{formatDate(e.entry_date)}</Td>
                    <Td><Badge variant={e.entry_type}>{e.entry_type}</Badge></Td>
                    <Td>{e.category}</Td>
                    <Td className="max-w-[200px] truncate" title={e.description}>{e.description}</Td>
                    <Td className="capitalize">{e.payment_method}</Td>
                    <Td><Badge variant={e.source}>{e.source}</Badge></Td>
                    <Td className={`text-right font-medium ${e.entry_type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {e.entry_type === "income" ? "+" : "-"}{formatCurrency(e.amount)}
                    </Td>
                    <Td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={deleteId === e.id}
                        onClick={() => handleDelete(e.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
