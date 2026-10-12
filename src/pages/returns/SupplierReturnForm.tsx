import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, useToast } from "../../components/ui";
import { FormField, Input, Select } from "../../components/forms";
import {
  supplierReturnApi,
  type ProductCodeOption,
  type PurchaseOption,
  type SupplierReturnPayload,
} from "../../services/supplier-return.api";

type SupplierReturnItemForm = {
  rowId: string;
  productCode: string;
  productName: string;
  sizeName: string;
  colorName: string;
  brandName: string;
  quantity: string;
  unit: "PIECES" | "DOZEN";
  purchaseAmount: string;
  totalPurchaseAmount: string;
};

type FormState = {
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  invoiceDate: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  netTotalPurchaseAmount: string;
  returnAmountReceived: string;
  items: SupplierReturnItemForm[];
};

const getToday = () => new Date().toISOString().slice(0, 10);
const num = (value: string | number) => Number(value) || 0;
const createItem = (): SupplierReturnItemForm => ({
  rowId: `${Date.now()}-${Math.random()}`,
  productCode: "",
  productName: "",
  sizeName: "",
  colorName: "",
  brandName: "",
  quantity: "1",
  unit: "PIECES",
  purchaseAmount: "0",
  totalPurchaseAmount: "0",
});

const emptyForm: FormState = {
  purchaseNumber: "",
  supplierId: "",
  supplierName: "",
  supplierAddress: "",
  invoiceDate: getToday(),
  paymentStatus: "UNPAID",
  netTotalPurchaseAmount: "0",
  returnAmountReceived: "0",
  items: [createItem()],
};

export const SupplierReturnFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [purchaseOptions, setPurchaseOptions] = useState<PurchaseOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductCodeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedPurchaseNumber = purchaseOptions.some(
    (purchase) => purchase.purchaseNumber === form.purchaseNumber,
  )
    ? form.purchaseNumber
    : "";

  const setLine = (
    rowId: string,
    updater: (line: SupplierReturnItemForm) => SupplierReturnItemForm,
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((line) => (line.rowId === rowId ? updater(line) : line)),
    }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchases, products, existing] = await Promise.all([
        supplierReturnApi.purchaseOptions(),
        supplierReturnApi.productCodeOptions(),
        isEdit && id ? supplierReturnApi.get(Number(id)) : Promise.resolve(null),
      ]);
      setPurchaseOptions(purchases);
      setProductOptions(products);

      if (existing) {
        setForm({
          purchaseNumber: existing.purchaseNumber || "",
          supplierId: existing.supplierId ? String(existing.supplierId) : "",
          supplierName: existing.supplierName || "",
          supplierAddress: existing.supplierAddress || "",
          invoiceDate: (existing.invoiceDate || existing.createdAt).slice(0, 10),
          paymentStatus: existing.paymentStatus || "UNPAID",
          netTotalPurchaseAmount: String(
            existing.items.reduce(
              (sum, item) => sum + (Number(item.totalPurchaseAmount) || 0),
              0,
            ),
          ),
          returnAmountReceived: String(existing.returnAmountReceived || 0),
          items: existing.items?.length
            ? existing.items.map((item) => ({
                rowId: String(item.id),
                productCode: item.productCode,
                productName: item.productName,
                sizeName: item.sizeName || "",
                colorName: item.colorName || "",
                brandName: item.brandName || "",
                quantity: String(item.quantity),
                unit: item.unit,
                purchaseAmount: String(item.purchaseAmount),
                totalPurchaseAmount: String(item.totalPurchaseAmount),
              }))
            : [createItem()],
        });
      }
    } catch (error) {
      toast({
        title: "Failed to load supplier return form",
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

  const onPurchaseNumberChange = async (purchaseNumber: string) => {
    setForm((current) => ({ ...current, purchaseNumber }));
    if (!purchaseNumber) {
      setForm((current) => ({
        ...current,
        purchaseNumber: "",
        supplierId: "",
        supplierName: "",
        supplierAddress: "",
        netTotalPurchaseAmount: "0",
        items: [createItem()],
      }));
      return;
    }
    try {
      const purchase = await supplierReturnApi.purchaseDetails(purchaseNumber);
      setForm((current) => ({
        ...current,
        purchaseNumber,
        supplierId: purchase.supplierId ? String(purchase.supplierId) : "",
        supplierName: purchase.supplierName || "",
        supplierAddress: purchase.supplierAddress || "",
        invoiceDate: (purchase.invoiceDate || getToday()).slice(0, 10),
        paymentStatus: purchase.paymentStatus || "UNPAID",
        netTotalPurchaseAmount: String(purchase.netTotalPurchaseAmount || 0),
        items: purchase.items.length
          ? purchase.items.map((item) => ({
              rowId: String(item.id),
              productCode: item.productCode,
              productName: item.productName,
              sizeName: item.sizeName || "",
              colorName: item.colorName || "",
              brandName: item.brandName || "",
              quantity: String(item.quantity),
              unit: item.unit,
              purchaseAmount: String(item.purchaseAmount),
              totalPurchaseAmount: String(item.totalPurchaseAmount),
            }))
          : [createItem()],
      }));
    } catch (error) {
      toast({
        title: "Failed to fetch purchase details",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const onProductCodeChange = async (rowId: string, productCode: string) => {
    setLine(rowId, (line) => ({ ...line, productCode }));
    if (!productCode) return;
    try {
      const product = await supplierReturnApi.productCodeDetails(productCode);
      setLine(rowId, (line) => {
        const quantity = num(line.quantity) || 1;
        const purchaseAmount = num(product.purchaseAmount);
        return {
          ...line,
          productCode: product.productCode,
          productName: product.productName || "",
          sizeName: product.sizeName || "",
          colorName: product.colorName || "",
          brandName: product.brandName || "",
          unit: product.unit || "PIECES",
          purchaseAmount: String(purchaseAmount),
          totalPurchaseAmount: String(quantity * (product.unit === "DOZEN" ? 12 : 1) * purchaseAmount),
        };
      });
    } catch (error) {
      toast({
        title: "Failed to fetch product details",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: SupplierReturnPayload = {
      purchaseNumber: form.purchaseNumber || undefined,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      supplierName: form.supplierName,
      supplierAddress: form.supplierAddress,
      invoiceDate: form.invoiceDate,
      paymentStatus: form.paymentStatus,
      returnAmountReceived: num(form.returnAmountReceived),
      items: form.items.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        sizeName: item.sizeName || undefined,
        colorName: item.colorName || undefined,
        brandName: item.brandName || undefined,
        quantity: num(item.quantity),
        unit: item.unit,
        purchaseAmount: num(item.purchaseAmount),
        totalPurchaseAmount: num(item.totalPurchaseAmount),
      })),
    };

    try {
      setSaving(true);
      if (isEdit && id) {
        await supplierReturnApi.update(Number(id), payload);
        toast({ title: "Supplier return updated", variant: "success" });
      } else {
        await supplierReturnApi.create(payload);
        toast({ title: "Supplier return added", variant: "success" });
      }
      navigate("/returns/supplier");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/returns/supplier")}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <p className="text-sm font-semibold text-primary-dark">RETURNS</p>
          <h2 className="mt-1 text-2xl font-bold text-secondary">
            {isEdit ? "Edit Supplier Return" : "Add Supplier Return"}
          </h2>
        </div>
      </div>

      <Card className="mb-6 p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Purchase Number">
              <Select
                value={selectedPurchaseNumber}
                onChange={(event) => void onPurchaseNumberChange(event.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select purchase number</option>
                {purchaseOptions.map((purchase) => (
                  <option key={purchase.purchaseNumber} value={purchase.purchaseNumber}>
                    {purchase.purchaseNumber}
                    {purchase.supplierName ? ` - ${purchase.supplierName}` : ""}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Supplier Name" required>
              <Input
                required
                value={form.supplierName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierName: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Address" required>
              <Input
                required
                value={form.supplierAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierAddress: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Invoice Date" required>
              <Input
                required
                type="date"
                value={form.invoiceDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, invoiceDate: event.target.value }))
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
            <FormField label="Return Amount Received" required>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.returnAmountReceived}
                onChange={(event) =>
                  setForm((current) => ({ ...current, returnAmountReceived: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Net Total Purchase Amount">
              <Input value={form.netTotalPurchaseAmount} readOnly disabled />
            </FormField>
          </div>

          <div className="rounded-lg border border-border-gold p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-secondary">Purchase Product</p>
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
                  className="grid gap-4 rounded-xl border border-border-gold/50 p-4 md:grid-cols-2 xl:grid-cols-12 xl:items-end"
                >
                  <div className="xl:col-span-2">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Product Code</p>
                    <Input
                      list="supplier-return-product-codes"
                      value={line.productCode}
                      placeholder="Select or type code"
                      onChange={(event) => void onProductCodeChange(line.rowId, event.target.value)}
                    />
                  </div>
                  <div className="xl:col-span-2">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Product Name</p>
                    <Input
                      value={line.productName}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          productName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Size</p>
                    <Input
                      value={line.sizeName}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          sizeName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Color</p>
                    <Input
                      value={line.colorName}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          colorName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Brand</p>
                    <Input
                      value={line.brandName}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          brandName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Qty</p>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          quantity: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Unit</p>
                    <Select
                      value={line.unit}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          unit: event.target.value as SupplierReturnItemForm["unit"],
                        }))
                      }
                    >
                      <option value="PIECES">Pieces</option>
                      <option value="DOZEN">Dozen</option>
                    </Select>
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Purchase Amount</p>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.purchaseAmount}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          purchaseAmount: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="mb-1 text-xs font-medium text-text-secondary">Total Purchase</p>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.totalPurchaseAmount}
                      onChange={(event) =>
                        setLine(line.rowId, (currentLine) => ({
                          ...currentLine,
                          totalPurchaseAmount: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="xl:col-span-1">
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
              <datalist id="supplier-return-product-codes">
                {productOptions.map((product) => (
                  <option key={product.productCode} value={product.productCode} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/returns/supplier")}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Update Supplier Return" : "Submit Supplier Return"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
};
