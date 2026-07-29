"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/spinner";
import { reports } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AuditReport } from "@/types";

const severityColor = { high: "high" as const, medium: "medium" as const, low: "low" as const };

export default function AuditPage() {
  const [data, setData] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await reports.audit();
      setData(res);
      toast.success(`Audit complete — ${res.flags.length} anomalies found`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Audit</h1>
          <p className="text-slate-500 text-sm mt-1">Rule-based anomaly detection</p>
        </div>
        <Button onClick={runAudit} loading={loading}>
          <ShieldAlert className="h-4 w-4" /> Run Audit
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{data.total_entries_checked}</p><p className="text-xs text-slate-500">Entries Checked</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{data.summary.low}</p><p className="text-xs text-slate-500">Low Severity</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{data.summary.medium}</p><p className="text-xs text-slate-500">Medium Severity</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{data.summary.high}</p><p className="text-xs text-slate-500">High Severity</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit Results {data ? `(${data.period})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <PageLoading /> : !data ? (
            <CardContent>
              <EmptyState
                icon={<ShieldAlert className="h-12 w-12" />}
                title="No audit data"
                description="Click 'Run Audit' to check for anomalies in your financial data"
                action={<Button onClick={runAudit} loading={loading}><ShieldAlert className="h-4 w-4" /> Run Audit</Button>}
              />
            </CardContent>
          ) : data.flags.length === 0 ? (
            <CardContent>
              <EmptyState
                icon={<ShieldAlert className="h-12 w-12 text-emerald-400" />}
                title="All clear!"
                description="No anomalies detected in this period"
              />
            </CardContent>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Severity</Th>
                  <Th>Category</Th>
                  <Th>Entry ID</Th>
                  <Th>Reason</Th>
                  <Th>Date</Th>
                </Tr>
              </THead>
              <TBody>
                {data.flags.map((f) => (
                  <Tr key={f.id}>
                    <Td><Badge variant={severityColor[f.severity]}>{f.severity}</Badge></Td>
                    <Td>{f.category}</Td>
                    <Td><span className="text-xs font-mono">{f.entry_id?.slice(0, 8)}</span></Td>
                    <Td className="max-w-75">{f.flag_reason}</Td>
                    <Td className="text-slate-500 whitespace-nowrap">{formatDateTime(f.created_at)}</Td>
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
