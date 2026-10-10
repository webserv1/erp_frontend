import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Modal, useToast } from "../../components/ui";
import { FormField, Input, Select, Textarea } from "../../components/forms";
import { DataTable, type DataTableAction, type DataTableColumn } from "../../components/table";
import {
  partyReturnApi,
  type InvoiceOption,
  type PartyReturnPayload,
} from "../../services/party-return.api";
import type { PartyReturn } from "../../types/product.types";

type ReturnItemForm = {
  rowId: string;
  productCode: string;
  productName: string;
  quantity: string;
  unit: "PIECES" | "DOZEN";
  salePrice: string;
  totalSalePrice: string;
};

type FormState = {
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  shopName: string;
  reason: string;
  amountPaid: string;
  returnDate: string;
  netTotalSalePrice: string;
  invoicePaidAmount: string;
  discount: string;
  transport: string;
  invoiceRemainingAmount: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  items: ReturnItemForm[];
};

const getToday = () => new Date().toISOString().slice(0, 10);
const createItem = (): ReturnItemForm => ({
  rowId: `${Date.now()}-${Math.random()}`,
  productCode: "",
  productName: "",
  quantity: "1",
  unit: "PIECES",
  salePrice: "0",
  totalSalePrice: "0",
});

const emptyForm: FormState = {
  invoiceNumber: "",
  partyId: "",
  partyName: "",
  shopName: "",
  reason: "",
  amountPaid: "0",
  returnDate: getToday(),
  netTotalSalePrice: "0",
  invoicePaidAmount: "0",
  discount: "0",
  transport: "0",
  invoiceRemainingAmount: "0",
  paymentStatus: "UNPAID",
  items: [createItem()],
};

const num = (value: string | number) => Number(value) || 0;

const formatProducts = (items: PartyReturn["items"]) =>
  items?.length
    ? items.map((item) => `${item.productCode} (${item.quantity} ${item.unit})`).join(", ")
    : "—";

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

  const setLine = (rowId: string, updater: (line: ReturnItemForm) => ReturnItemForm) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((line) => (line.rowId === rowId ? updater(line) : line)),
    }));
  };

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
        netTotalSalePrice: String(invoice.netTotalSalePrice || 0),
        invoicePaidAmount: String(invoice.invoicePaidAmount || 0),
        discount: String(invoice.discount || 0),
        transport: String(invoice.transport || 0),
        invoiceRemainingAmount: String(invoice.invoiceRemainingAmount || 0),
        paymentStatus: invoice.paymentStatus || "UNPAID",
        items: invoice.items.length
          ? invoice.items.map((item) => ({
              rowId: String(item.id),
              productCode: item.productCode,
              productName: item.productName,
              quantity: String(item.quantity),
              unit: item.unit,
              salePrice: String(item.salePrice),
              totalSalePrice: String(item.totalSalePrice),
            }))
          : [createItem()],
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
    setForm({ ...emptyForm, items: [createItem()] });
    setEditing(null);
  };

  const onEdit = (row: PartyReturn) => {
    setEditing(row);
    setForm({
      invoiceNumber: row.saleNumber || "",
      partyId: row.partyId ? String(row.partyId) : "",
      partyName: row.partyName || "",
      shopName: row.shopName || "",
      reason: row.reason || "",
      amountPaid: String(row.amountPaid || 0),
      returnDate: (row.returnDate || row.createdAt).slice(0, 10),
      netTotalSalePrice: String(row.netTotalSalePrice || 0),
      invoicePaidAmount: String(row.invoicePaidAmount || 0),
      discount: String(row.discount || 0),
      transport: String(row.transport || 0),
      invoiceRemainingAmount: String(row.invoiceRemainingAmount || 0),
      paymentStatus: row.paymentStatus || "UNPAID",
      items: row.items?.length
        ? row.items.map((item) => ({
            rowId: String(item.id),
            productCode: item.productCode,
            productName: item.productName,
            quantity: String(item.quantity),
            unit: item.unit,
            salePrice: String(item.salePrice),
            totalSalePrice: String(item.totalSalePrice),
          }))
        : [createItem()],
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
      items: form.items.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        quantity: num(item.quantity),
        unit: item.unit,
        salePrice: num(item.salePrice),
        totalSalePrice: num(item.totalSalePrice),
      })),
      netTotalSalePrice: num(form.netTotalSalePrice),
      invoicePaidAmount: num(form.invoicePaidAmount),
      discount: num(form.discount),
      transport: num(form.transport),
      invoiceRemainingAmount: num(form.invoiceRemainingAmount),
      paymentStatus: form.paymentStatus,
      reason: form.reason,
      amountPaid: num(form.amountPaid),
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
      {
        key: "products",
        header: "Product Details",
        cell: (row) => formatProducts(row.items || []),
      },
      { key: "netTotalSalePrice", header: "Net Total", cell: (row) => `₹${row.netTotalSalePrice}` },
      { key: "invoicePaidAmount", header: "Paid", cell: (row) => `₹${row.invoicePaidAmount}` },
      { key: "discount", header: "Discount", cell: (row) => `₹${row.discount}` },
      { key: "transport", header: "Transport", cell: (row) => `₹${row.transport}` },
      { key: "invoiceRemainingAmount", header: "Remaining", cell: (row) => `₹${row.invoiceRemainingAmount}` },
      { key: "paymentStatus", header: "Payment Status" },
      { key: "reason", header: "Reason" },
      { key: "amountPaid", header: "Amount Needs To Be Paid", cell: (row) => `₹${row.amountPaid}` },
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
            <FormField label="Net Total Sale Price" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.netTotalSalePrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, netTotalSalePrice: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Paid Amount" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.invoicePaidAmount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, invoicePaidAmount: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Discount" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.discount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, discount: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Transport" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.transport}
                onChange={(event) =>
                  setForm((current) => ({ ...current, transport: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Invoice Remaining Amount" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.invoiceRemainingAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    invoiceRemainingAmount: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Payment Status" required>
              <Select
                value={form.paymentStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paymentStatus: event.target.value as FormState["paymentStatus"],
                  }))
                }
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
            </FormField>
          </div>

          <div className="rounded-lg border border-border-gold p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-secondary">Product Details</p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: [...current.items, createItem()],
                  }))
                }
              >
                + Add Product
              </Button>
            </div>
            <div className="space-y-3">
              {form.items.map((line) => (
                <div key={line.rowId} className="grid gap-3 rounded-lg border border-border-gold/50 p-3 sm:grid-cols-2 lg:grid-cols-7">
                  <Input
                    placeholder="Product Code"
                    value={line.productCode}
                    onChange={(event) =>
                      setLine(line.rowId, (currentLine) => ({
                        ...currentLine,
                        productCode: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Product Name"
                    value={line.productName}
                    onChange={(event) =>
                      setLine(line.rowId, (currentLine) => ({
                        ...currentLine,
                        productName: event.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(event) =>
                      setLine(line.rowId, (currentLine) => ({
                        ...currentLine,
                        quantity: event.target.value,
                      }))
                    }
                  />
                  <Select
                    value={line.unit}
                    onChange={(event) =>
                      setLine(line.rowId, (currentLine) => ({
                        ...currentLine,
                        unit: event.target.value as ReturnItemForm["unit"],
                      }))
                    }
                  >
                    <option value="PIECES">Pieces</option>
                    <option value="DOZEN">Dozen</option>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Sale Price"
                    value={line.salePrice}
                    onChange={(event) =>
                      setLine(line.rowId, (currentLine) => ({
                        ...currentLine,
                        salePrice: event.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Total Sale Price"
                    value={line.totalSalePrice}
                    onChange={(event) =>
                      setLine(line.rowId, (currentLine) => ({
                        ...currentLine,
                        totalSalePrice: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        items:
                          current.items.length > 1
                            ? current.items.filter((entry) => entry.rowId !== line.rowId)
                            : current.items,
                      }))
                    }
                    disabled={form.items.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

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
            <p><span className="font-semibold">Amount Needs To Be Paid:</span> ₹{viewing.amountPaid}</p>
            <p><span className="font-semibold">Date:</span> {new Date(viewing.returnDate).toLocaleDateString("en-IN")}</p>
            <p><span className="font-semibold">Reason:</span> {viewing.reason}</p>
            <p><span className="font-semibold">Net Total Sale:</span> ₹{viewing.netTotalSalePrice}</p>
            <p><span className="font-semibold">Paid Amount:</span> ₹{viewing.invoicePaidAmount}</p>
            <p><span className="font-semibold">Discount:</span> ₹{viewing.discount}</p>
            <p><span className="font-semibold">Transport:</span> ₹{viewing.transport}</p>
            <p><span className="font-semibold">Remaining:</span> ₹{viewing.invoiceRemainingAmount}</p>
            <p><span className="font-semibold">Payment Status:</span> {viewing.paymentStatus}</p>
            <div>
              <p className="font-semibold">Product Rows</p>
              <div className="mt-2 space-y-2">
                {viewing.items?.map((item) => (
                  <div key={item.id} className="rounded-md border border-border-gold/40 px-3 py-2">
                    {item.productCode} - {item.productName} | {item.quantity} {item.unit} | ₹{item.salePrice} | ₹{item.totalSalePrice}
                  </div>
                ))}
              </div>
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
