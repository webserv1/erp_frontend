import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, Button, Card, Modal } from "../../components/ui";
import { FormField, Input, Select } from "../../components/forms";
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "../../components/table";
import { purchaseApi } from "../../services/purchase.api";
import { supplierApi } from "../../services/supplier.api";
import { productApi } from "../../services/product.api";
import type { Purchase, Supplier, Product } from "../../types/product.types";

type FormState = {
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceDate: string;
  items: {
    productCode: string;
    purchasePrice: string;
    quantity: string;
    unit: "PIECES" | "DOZEN";
  }[];
  remarks: string;
  status: boolean;
};

const createPurchaseItem = () => ({
  productCode: "",
  purchasePrice: "",
  quantity: "",
  unit: "PIECES" as const,
});

const unitMultiplier = (unit: "PIECES" | "DOZEN") => (unit === "DOZEN" ? 12 : 1);

const emptyForm: FormState = {
  purchaseNumber: "",
  supplierId: "",
  supplierName: "",
  invoiceDate: "",
  items: [createPurchaseItem()],
  remarks: "",
  status: true,
};
const renderStackedValues = (values: Array<string | number>) => (
  <div className="overflow-hidden rounded-md border border-border-gold/40 divide-y divide-border-gold/30 bg-white/40">
    {values.map((value, index) => (
      <div key={index} className="px-2 py-1">
        {value}
      </div>
    ))}
  </div>
);

export const PurchaseMaster = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [viewing, setViewing] = useState<Purchase | null>(null);

  const [items, setItems] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadSuppliers = async () => {
      try {
        const data = await supplierApi.list();
        if (!cancelled) setSuppliers(data.supplier);
      } catch {
        if (!cancelled)
          toast({ title: "Failed to load suppliers", variant: "error" });
      }
    };
    loadSuppliers();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const data = await productApi.products.list({ limit: 100 });
        if (!cancelled) setProducts(data.products);
      } catch {
        if (!cancelled)
          toast({ title: "Failed to load products", variant: "error" });
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const loadPurchases = async () => {
      try {
        const data = await purchaseApi.list({
          search: search || undefined,
          supplierId: supplierFilter ? Number(supplierFilter) : undefined,
          paymentStatus: paymentStatusFilter || undefined,
          status:
            statusFilter === "ACTIVE"
              ? true
              : statusFilter === "INACTIVE"
                ? false
                : undefined,
          page,
          limit,
        });
        if (!cancelled) {
          setItems(data.purchase);
          setTotal(data.total);
        }
      } catch (err) {
        if (!cancelled)
          toast({
            title: "Failed to load purchases",
            description: (err as Error).message,
            variant: "error",
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPurchases();
    return () => {
      cancelled = true;
    };
  }, [
    search,
    supplierFilter,
    paymentStatusFilter,
    statusFilter,
    page,
    limit,
    toast,
  ]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (row: Purchase) => {
    setEditing(row);
    setForm({
      purchaseNumber: row.purchaseNumber,
      supplierId: String(row.supplierId),
      supplierName: row.supplierName,
      invoiceDate: row.invoiceDate.split("T")[0],
      items: row.items?.length
        ? row.items.map((item) => ({
            productCode: item.productCode,
            purchasePrice: String(item.purchasePrice ?? ""),
            quantity: String(item.quantity ?? ""),
            unit: item.unit || "PIECES",
          }))
        : [
            {
              productCode: row.productCode,
              purchasePrice: String(row.purchasePrice ?? ""),
              quantity: String(row.quantity ?? ""),
              unit: row.unit || "PIECES",
            },
          ],
      remarks: row.remarks || "",
      status: row.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openView = (row: Purchase) => {
    setViewing(row);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        purchaseNumber: form.purchaseNumber,
        supplierId: Number(form.supplierId),
        supplierName: form.supplierName,
        invoiceDate: form.invoiceDate,
        items: form.items
          .filter((item) => item.productCode)
          .map((item) => ({
            productCode: item.productCode,
            quantity: Number(item.quantity) || 0,
            purchasePrice: Number(item.purchasePrice) || 0,
            unit: item.unit,
          })),
        remarks: form.remarks || undefined,
        status: form.status,
      };

      if (editing) {
        await purchaseApi.update(editing.id, payload);
        toast({ title: "Purchase updated", variant: "success" });
      } else {
        await purchaseApi.create(payload);
        toast({ title: "Purchase created", variant: "success" });
      }
      resetForm();
      setPage(1);
      const data = await purchaseApi.list({
        search: search || undefined,
        supplierId: supplierFilter ? Number(supplierFilter) : undefined,
        paymentStatus: paymentStatusFilter || undefined,
        status:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
              ? false
              : undefined,
        page: 1,
        limit,
      });
      setItems(data.purchase);
      setTotal(data.total);
    } catch (err) {
      toast({
        title: editing ? "Update failed" : "Creation failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const remove = async (row: Purchase) => {
    try {
      await purchaseApi.remove(row.id);
      toast({ title: "Purchase deleted", variant: "success" });
      const data = await purchaseApi.list({
        search: search || undefined,
        supplierId: supplierFilter ? Number(supplierFilter) : undefined,
        paymentStatus: paymentStatusFilter || undefined,
        status:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
              ? false
              : undefined,
        page: page > 1 ? page - 1 : 1,
        limit,
      });
      setItems(data.purchase);
      setTotal(data.total);
      setPage(data.page || 1);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedItems = items.slice((page - 1) * limit, page * limit);

  const getSupplierName = (purchase: Purchase) =>
    purchase.supplierName ||
    purchase.supplier?.name ||
    suppliers.find((s) => s.id === purchase.supplierId)?.name ||
    "—";

  const displayItems = paginatedItems.map((purchase) => {
    return {
      ...purchase,
      supplierName: getSupplierName(purchase),
    };
  });

  const columns: DataTableColumn<Purchase>[] = [
    { key: "purchaseNumber", header: "Purchase No", width: "120px" },
    {
      key: "supplierName",
      header: "Supplier",
      cell: (row) => row.supplierName || row.supplier?.name || "—",
    },
    {
      key: "productCode",
      header: "Product Code",
      width: "150px",
      cell: (row) => renderStackedValues(row.items.map((item) => item.productCode)),
    },
    {
      key: "productName",
      header: "Product Name",
      width: "160px",
      cell: (row) => renderStackedValues(row.items.map((item) => item.productName || "—")),
    },
    {
      key: "invoiceDate",
      header: "Invoice Date",
      width: "120px",
      cell: (row) => row.invoiceDate.split("T")[0],
    },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      width: "120px",
      cell: (row) =>
        renderStackedValues(row.items.map((item) => `₹${item.purchasePrice}`)),
    },
    {
      key: "quantity",
      header: "Quantity",
      width: "130px",
      cell: (row) => (
        renderStackedValues(
          row.items.map((item) => `${item.quantity} ${item.unit}`),
        )
      ),
    },
    {
      key: "totalPurchaseAmount",
      header: "Total Purchase",
      width: "140px",
      cell: (row) =>
        renderStackedValues(row.items.map((item) => `₹${item.totalPurchaseAmount}`)),
    },
    {
      key: "netTotalPurchaseAmount",
      header: "Net Total Purchase",
      width: "150px",
      cell: (row) => <span className="font-semibold">₹{row.netTotalPurchaseAmount}</span>,
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      width: "120px",
      cell: (row) => {
        const colors: Record<string, string> = {
          UNPAID: "bg-red-100 text-red-700",
          PARTIAL: "bg-yellow-100 text-yellow-700",
          PAID: "bg-green-100 text-green-700",
          OVERDUE: "bg-orange-100 text-orange-700",
        };
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[row.paymentStatus] || "bg-gray-100 text-gray-700"}`}
          >
            {row.paymentStatus}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {row.status ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions: DataTableAction<Purchase>[] = [
    { label: <Eye size={16} />, onClick: openView, title: "View" },
    { label: <Pencil size={16} />, onClick: openEdit, title: "Edit" },
    {
      label: <Trash2 size={16} />,
      onClick: remove,
      className: "text-red-600 hover:bg-red-50",
      title: "Delete",
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">
              PURCHASE MASTER
            </p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              All Purchases
            </h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Purchase</Button>
      </div>

      <Card className="mb-6 p-6">
        <form id="purchase-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Purchase Number" required>
              <Input
                required
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.purchaseNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchaseNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </FormField>
            <FormField label="Supplier" required>
              <Select
                required
                value={form.supplierId}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Supplier Name" required>
              <Input
                required
                value={form.supplierName}
                onChange={(e) =>
                  setForm({ ...form, supplierName: e.target.value })
                }
              />
            </FormField>
            <FormField label="Invoice Date" required>
              <Input
                required
                type="date"
                value={form.invoiceDate}
                onChange={(e) =>
                  setForm({ ...form, invoiceDate: e.target.value })
                }
              />
            </FormField>
            <FormField label="Remarks">
              <Input
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status ? "ACTIVE" : "INACTIVE"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value === "ACTIVE" })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>

          <div className="rounded-lg border border-border-gold p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-secondary">Purchased Products</p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm({ ...form, items: [...form.items, createPurchaseItem()] })
                }
              >
                + Add Product
              </Button>
            </div>
            <div className="space-y-3">
              {form.items.map((entry, index) => {
                const total =
                  (Number(entry.quantity) || 0) *
                  unitMultiplier(entry.unit) *
                  (Number(entry.purchasePrice) || 0);
                return (
                  <div key={`${index}-${entry.productCode}`} className="grid items-end gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_1fr_1fr_1fr_1fr_auto]">
                    <FormField label={`Product Code ${index + 1}`} required>
                      <Select
                        required
                        value={entry.productCode}
                        onChange={(e) => {
                          const selectedCode = e.target.value;
                          const product = products.find(
                            (item) => item.productCode === selectedCode,
                          );
                          setForm((current) => ({
                            ...current,
                            items: current.items.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    productCode: selectedCode,
                                    purchasePrice: product
                                      ? String(product.purchasePrice ?? 0)
                                      : item.purchasePrice,
                                    quantity: product
                                      ? String(product.quantity ?? 0)
                                      : item.quantity,
                                    unit: product?.unit || item.unit,
                                  }
                                : item,
                            ),
                          }));
                        }}
                      >
                        <option value="">Select product code</option>
                        {products.map((item) => <option key={item.id} value={item.productCode}>{item.productCode}</option>)}
                      </Select>
                    </FormField>
                    <FormField label="Product Name">
                      <Input
                        readOnly
                        value={
                          products.find(
                            (item) => item.productCode === entry.productCode,
                          )?.productName ?? ""
                        }
                      />
                    </FormField>
                    <FormField label="Purchase Price">
                      <Input
                        min="0"
                        type="number"
                        value={entry.purchasePrice}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            items: current.items.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, purchasePrice: e.target.value }
                                : item,
                            ),
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Quantity">
                      <Input
                        min="0"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={entry.quantity}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            items: current.items.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    quantity: e.target.value.replace(/\D/g, ""),
                                  }
                                : item,
                            ),
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Unit">
                      <Select
                        value={entry.unit}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            items: current.items.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    unit: e.target.value as "PIECES" | "DOZEN",
                                  }
                                : item,
                            ),
                          }))
                        }
                      >
                        <option value="PIECES">Pieces</option>
                        <option value="DOZEN">Dozens</option>
                      </Select>
                    </FormField>
                    <FormField label="Total">
                      <Input readOnly value={entry.productCode ? total : ""} />
                    </FormField>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={form.items.length === 1}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          items: current.items.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-right font-semibold text-secondary">
              Net Total Purchase Amount: ₹
              {form.items.reduce(
                (sum, item) =>
                  sum +
                  (Number(item.quantity) || 0) *
                    unitMultiplier(item.unit) *
                    (Number(item.purchasePrice) || 0),
                0,
              )}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button type="submit" loading={loading}>
              {editing ? "Update Purchase" : "Submit Purchase"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <Input
              placeholder="Search by purchase number, supplier, product code or remarks"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-40"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-40"
            >
              <option value="">All Payment Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-40"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={displayItems}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No purchases found."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Purchase Details"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-gold">
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Purchase Number
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.purchaseNumber}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Supplier
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.supplier?.name || viewing.supplierName || "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Product Code
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">{viewing.items.map((item) => <div key={item.id}>{item.productCode} — {item.productName || "—"}</div>)}</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Invoice Date
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.invoiceDate.split("T")[0]}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Purchase Price
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">{viewing.items.map((item) => <div key={item.id}>₹{item.purchasePrice}</div>)}</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">Quantity</td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">
                      {viewing.items.map((item) => (
                        <div key={item.id}>
                          {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Total Purchase Amount
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">{viewing.items.map((item) => <div key={item.id}>₹{item.totalPurchaseAmount}</div>)}</div>
                  </td>
                </tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Net Total Purchase Amount</td><td className="px-4 py-2 text-secondary">₹{viewing.netTotalPurchaseAmount}</td></tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Paid Amount
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    ₹{viewing.paidAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Remaining Amount
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    ₹{viewing.remainingAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Payment Status
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.paymentStatus}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Remarks
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.remarks || "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Status
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.status ? "Active" : "Inactive"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
};
