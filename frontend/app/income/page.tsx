"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/spinner";
import { entries, categories } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Entry, PaymentMethod } from "@/types";

const schema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  entry_date: z.string().min(1, "Date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
];

export default function IncomePage() {
  const [data, setData] = useState<Entry[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { entry_date: new Date().toISOString().split("T")[0], payment_method: "bank" },
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([
      entries.list({ type: "income" }),
      categories(),
    ]).then(([entriesData, catsData]) => {
      setData(entriesData);
      setCats(catsData);
    }).catch(() => toast.error("Failed to load data"))
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const onSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      await entries.create({ ...formData, entry_type: "income", payment_method: formData.payment_method as PaymentMethod });
      toast.success("Income entry added");
      reset();
      setShowForm(false);
      fetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Income</h1>
          <p className="text-slate-500 text-sm mt-1">Track your earnings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Income"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Income Entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                options={cats.map((c) => ({ value: c, label: c }))}
                placeholder="Select category"
                error={errors.category?.message}
                {...register("category")}
              />
              <Input id="amount" label="Amount (PKR)" type="number" error={errors.amount?.message} {...register("amount")} />
              <Textarea id="description" label="Description" error={errors.description?.message} {...register("description")} className="md:col-span-2" />
              <Input id="entry_date" label="Date" type="date" error={errors.entry_date?.message} {...register("entry_date")} />
              <Select label="Payment Method" options={PAYMENT_OPTIONS} error={errors.payment_method?.message} {...register("payment_method")} />
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" loading={submitting}>Save Entry</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? <PageLoading /> : data.length === 0 ? (
            <EmptyState
              title="No income entries"
              description="Add your first income entry to start tracking earnings"
              action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add Income</Button>}
            />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th>Payment</Th>
                  <Th>Source</Th>
                  <Th className="text-right">Amount</Th>
                </Tr>
              </THead>
              <TBody>
                {data.map((e) => (
                  <Tr key={e.id}>
                    <Td className="text-slate-500">{formatDate(e.entry_date)}</Td>
                    <Td><Badge variant="income">{e.category}</Badge></Td>
                    <Td className="max-w-[250px] truncate">{e.description}</Td>
                    <Td className="capitalize">{e.payment_method}</Td>
                    <Td><Badge variant={e.source}>{e.source}</Badge></Td>
                    <Td className="text-right font-medium text-emerald-600">+{formatCurrency(e.amount)}</Td>
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
