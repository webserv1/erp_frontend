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

type PaymentStatus = Purchase["paymentStatus"];

type FormState = {
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  productCode: string;
  invoiceDate: string;
  purchasePrice: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  remarks: string;
  status: boolean;
};

const emptyForm: FormState = {
  purchaseNumber: "",
  supplierId: "",
  supplierName: "",
  productCode: "",
  invoiceDate: "",
  purchasePrice: "",
  paidAmount: "0",
  paymentStatus: "UNPAID",
  remarks: "",
  status: true,
};

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
  const [productCodeManual, setProductCodeManual] = useState(false);

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
    setProductCodeManual(false);
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
      productCode: row.productCode,
      invoiceDate: row.invoiceDate.split("T")[0],
      purchasePrice: String(row.purchasePrice),
      paidAmount: String(row.paidAmount),
      paymentStatus: row.paymentStatus,
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
        productCode: form.productCode,
        invoiceDate: form.invoiceDate,
        purchasePrice: Number(form.purchasePrice) || 0,
        paidAmount: Number(form.paidAmount) || 0,
        paymentStatus: form.paymentStatus,
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

  const displayItems = paginatedItems.map((purchase) => ({
    ...purchase,
    supplierName: getSupplierName(purchase),
  }));

  const columns: DataTableColumn<Purchase>[] = [
    { key: "purchaseNumber", header: "Purchase No", width: "120px" },
    {
      key: "supplierName",
      header: "Supplier",
      cell: (row) => row.supplierName || row.supplier?.name || "—",
    },
    { key: "productCode", header: "Product Code", width: "120px" },
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
      cell: (row) => `₹${row.purchasePrice}`,
    },
    {
      key: "paidAmount",
      header: "Paid Amount",
      width: "120px",
      cell: (row) => `₹${row.paidAmount}`,
    },
    {
      key: "remainingBalance",
      header: "Remaining",
      width: "120px",
      cell: (row) => `₹${row.remainingBalance}`,
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
            <FormField label="Product Code">
              {productCodeManual ? (
                <Input
                  value={form.productCode}
                  onChange={(e) =>
                    setForm({ ...form, productCode: e.target.value })
                  }
                  placeholder="Enter product code"
                />
              ) : (
                <Select
                  value={form.productCode}
                  onChange={(e) => {
                    if (e.target.value === "__manual__") {
                      setProductCodeManual(true);
                      setForm({ ...form, productCode: "" });
                    } else {
                      const product = products.find(
                        (item) => item.productCode === e.target.value,
                      );
                      setForm({
                        ...form,
                        productCode: e.target.value,
                        purchasePrice:
                          product?.purchasePrice != null
                            ? String(product.purchasePrice)
                            : "",
                      });
                    }
                  }}
                >
                  <option value="">Select product code</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.productCode}>
                      {p.productCode}
                    </option>
                  ))}
                  <option value="__manual__">Other (Manual Entry)</option>
                </Select>
              )}
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
            <FormField label="Purchase Price" required>
              <Input
                required
                min="0"
                type="number"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
              />
            </FormField>
            <FormField label="Paid Amount" required>
              <Input
                required
                type="number"
                value={form.paidAmount}
                onChange={(e) =>
                  setForm({ ...form, paidAmount: e.target.value })
                }
              />
            </FormField>
            <FormField label="Payment Status">
              <Select
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentStatus: e.target.value as PaymentStatus,
                  })
                }
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
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
                    {viewing.productCode || "—"}
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
                    ₹{viewing.purchasePrice}
                  </td>
                </tr>
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
                    Remaining Balance
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    ₹{viewing.remainingBalance}
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
