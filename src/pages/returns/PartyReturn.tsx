import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Modal, useToast } from "../../components/ui";
import { FormField, Input, Select, Textarea } from "../../components/forms";
import { DataTable, type DataTableAction, type DataTableColumn } from "../../components/table";
import { partyReturnApi, type InvoiceOption, type PartyReturnPayload } from "../../services/party-return.api";
import type { PartyReturn } from "../../types/product.types";

type FormState = {
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  shopName: string;
  productDetails: string;
  amountDetails: string;
  reason: string;
  amountPaid: string;
  returnDate: string;
};

const getToday = () => new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  invoiceNumber: "",
  partyId: "",
  partyName: "",
  shopName: "",
  productDetails: "",
  amountDetails: "",
  reason: "",
  amountPaid: "0",
  returnDate: getToday(),
};

const jsonToText = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const toJsonOrString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const toSummaryText = (value: unknown) => {
  const text = jsonToText(value).replace(/\s+/g, " ").trim();
  if (!text) return "—";
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
};

export const PartyReturnPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [items, setItems] = useState<PartyReturn[]>([]);
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([]);
  const [editing, setEditing] = useState<PartyReturn | null>(null);
  const [viewing, setViewing] = useState<PartyReturn | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartyReturn | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partyReturns, invoices] = await Promise.all([
        partyReturnApi.list(),
        partyReturnApi.invoiceOptions(),
      ]);
      setItems(partyReturns);
      setInvoiceOptions(invoices);
    } catch (error) {
      toast({
        title: "Failed to load party returns",
        description: (error as Error).message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onInvoiceChange = async (invoiceNumber: string) => {
    setForm((current) => ({ ...current, invoiceNumber }));
    if (!invoiceNumber) return;
    try {
      const invoice = await partyReturnApi.invoiceDetails(invoiceNumber);
      setForm((current) => ({
        ...current,
        invoiceNumber,
        partyId: invoice.partyId ? String(invoice.partyId) : "",
        partyName: invoice.partyName || "",
        shopName: invoice.shopName || "",
        productDetails: jsonToText(invoice.productDetails),
        amountDetails: jsonToText(invoice.amountDetails),
      }));
    } catch (error) {
      toast({
        title: "Failed to fetch invoice details",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const onEdit = (row: PartyReturn) => {
    setEditing(row);
    setForm({
      invoiceNumber: row.saleNumber || "",
      partyId: row.partyId ? String(row.partyId) : "",
      partyName: row.partyName || "",
      shopName: row.shopName || "",
      productDetails: jsonToText(row.productDetails),
      amountDetails: jsonToText(row.amountDetails),
      reason: row.reason || "",
      amountPaid: String(row.amountPaid || 0),
      returnDate: (row.returnDate || row.createdAt).slice(0, 10),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: PartyReturnPayload = {
      invoiceNumber: form.invoiceNumber || undefined,
      partyId: form.partyId ? Number(form.partyId) : null,
      partyName: form.partyName,
      shopName: form.shopName,
      productDetails: toJsonOrString(form.productDetails),
      amountDetails: toJsonOrString(form.amountDetails),
      reason: form.reason,
      amountPaid: Number(form.amountPaid || 0),
      returnDate: form.returnDate,
    };

    try {
      setSaving(true);
      if (editing) {
        await partyReturnApi.update(editing.id, payload);
        toast({ title: "Party return updated", variant: "success" });
      } else {
        await partyReturnApi.create(payload);
        toast({ title: "Party return added", variant: "success" });
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast({
        title: editing ? "Update failed" : "Creation failed",
        description: (error as Error).message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await partyReturnApi.remove(pendingDelete.id);
      setPendingDelete(null);
      toast({ title: "Party return deleted", variant: "success" });
      await loadData();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const columns = useMemo<DataTableColumn<PartyReturn>[]>(
    () => [
      { key: "saleNumber", header: "Invoice Number", cell: (row) => row.saleNumber || "Manual" },
      { key: "partyName", header: "Party Name" },
      { key: "shopName", header: "Shop Name" },
      { key: "productDetails", header: "Product Details", cell: (row) => toSummaryText(row.productDetails) },
      { key: "amountDetails", header: "Amount Details", cell: (row) => toSummaryText(row.amountDetails) },
      { key: "reason", header: "Reason" },
      { key: "amountPaid", header: "Amount Paid", cell: (row) => `₹${row.amountPaid}` },
      {
        key: "returnDate",
        header: "Date",
        cell: (row) =>
          new Date(row.returnDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      },
    ],
    [],
  );

  const actions = useMemo<DataTableAction<PartyReturn>[]>(
    () => [
      { label: <Eye size={16} />, onClick: setViewing, title: "View" },
      { label: <Pencil size={16} />, onClick: onEdit, title: "Edit" },
      {
        label: <Trash2 size={16} />,
        onClick: setPendingDelete,
        title: "Delete",
        className: "text-red-600 hover:bg-red-50",
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">RETURNS</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">Party Return</h2>
          </div>
        </div>
      </div>

      <Card className="mb-6 p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Select Invoice Number">
              <Select
                value={form.invoiceNumber}
                onChange={(event) => void onInvoiceChange(event.target.value)}
              >
                <option value="">Manual Entry</option>
                {invoiceOptions.map((invoice) => (
                  <option key={invoice.invoiceNumber} value={invoice.invoiceNumber}>
                    {invoice.invoiceNumber} - {invoice.partyName}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Party Name" required>
              <Input
                required
                value={form.partyName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, partyName: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Shop Name" required>
              <Input
                required
                value={form.shopName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, shopName: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Amount Needs To Be Paid" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.amountPaid}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amountPaid: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Date" required>
              <Input
                required
                type="date"
                value={form.returnDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, returnDate: event.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Product Details">
            <Textarea
              rows={4}
              value={form.productDetails}
              onChange={(event) =>
                setForm((current) => ({ ...current, productDetails: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Amount Details">
            <Textarea
              rows={4}
              value={form.amountDetails}
              onChange={(event) =>
                setForm((current) => ({ ...current, amountDetails: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Reason For Return" required>
            <Textarea
              required
              rows={3}
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({ ...current, reason: event.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Update Party Return" : "Submit Party Return"}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        loading={loading}
        actions={actions}
        emptyMessage="No party returns found."
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Party Return Details"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-3 text-sm text-secondary">
            <p><span className="font-semibold">Invoice:</span> {viewing.saleNumber || "Manual"}</p>
            <p><span className="font-semibold">Party:</span> {viewing.partyName}</p>
            <p><span className="font-semibold">Shop:</span> {viewing.shopName}</p>
            <p><span className="font-semibold">Amount Paid:</span> ₹{viewing.amountPaid}</p>
            <p><span className="font-semibold">Date:</span> {new Date(viewing.returnDate).toLocaleDateString("en-IN")}</p>
            <p><span className="font-semibold">Reason:</span> {viewing.reason}</p>
            <div>
              <p className="font-semibold">Product Details</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-primary/5 p-3 text-xs">
                {jsonToText(viewing.productDetails) || "—"}
              </pre>
            </div>
            <div>
              <p className="font-semibold">Amount Details</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-primary/5 p-3 text-xs">
                {jsonToText(viewing.amountDetails) || "—"}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Party Return"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete this party return entry?
        </p>
      </Modal>
    </>
  );
};
