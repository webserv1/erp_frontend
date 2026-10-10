import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, useToast } from "../../components/ui";
import { FormField, Input, Select, Textarea } from "../../components/forms";
import {
  partyReturnApi,
  type InvoiceOption,
  type PartyReturnPayload,
} from "../../services/party-return.api";

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

export const PartyReturnFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const setLine = (rowId: string, updater: (line: ReturnItemForm) => ReturnItemForm) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((line) => (line.rowId === rowId ? updater(line) : line)),
    }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoices, existing] = await Promise.all([
        partyReturnApi.invoiceOptions(),
        isEdit && id ? partyReturnApi.get(Number(id)) : Promise.resolve(null),
      ]);
      setInvoiceOptions(invoices);

      if (existing) {
        setForm({
          invoiceNumber: existing.saleNumber || "",
          partyId: existing.partyId ? String(existing.partyId) : "",
          partyName: existing.partyName || "",
          shopName: existing.shopName || "",
          reason: existing.reason || "",
          amountPaid: String(existing.amountPaid || 0),
          returnDate: (existing.returnDate || existing.createdAt).slice(0, 10),
          netTotalSalePrice: String(existing.netTotalSalePrice || 0),
          invoicePaidAmount: String(existing.invoicePaidAmount || 0),
          discount: String(existing.discount || 0),
          transport: String(existing.transport || 0),
          invoiceRemainingAmount: String(existing.invoiceRemainingAmount || 0),
          paymentStatus: existing.paymentStatus || "UNPAID",
          items: existing.items?.length
            ? existing.items.map((item) => ({
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
      }
    } catch (error) {
      toast({
        title: "Failed to load return form",
        description: (error as Error).message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

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
      if (isEdit && id) {
        await partyReturnApi.update(Number(id), payload);
        toast({ title: "Party return updated", variant: "success" });
      } else {
        await partyReturnApi.create(payload);
        toast({ title: "Party return added", variant: "success" });
      }
      navigate("/returns/party");
    } catch (error) {
      toast({
        title: isEdit ? "Update failed" : "Creation failed",
        description: (error as Error).message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/returns/party")}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <p className="text-sm font-semibold text-primary-dark">RETURNS</p>
          <h2 className="mt-1 text-2xl font-bold text-secondary">
            {isEdit ? "Edit Party Return" : "Add Party Return"}
          </h2>
        </div>
      </div>

      <Card className="mb-6 p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Select Invoice Number">
              <Select
                value={form.invoiceNumber}
                onChange={(event) => void onInvoiceChange(event.target.value)}
                disabled={loading}
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
                <div
                  key={line.rowId}
                  className="grid gap-3 rounded-lg border border-border-gold/50 p-3 sm:grid-cols-2 lg:grid-cols-7"
                >
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Product Code</p>
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Product Name</p>
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Quantity</p>
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Unit</p>
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Sale Price</p>
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Total Sale Price</p>
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-text-secondary">Action</p>
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
            <Button type="button" variant="outline" onClick={() => navigate("/returns/party")}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Update Party Return" : "Submit Party Return"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
};
