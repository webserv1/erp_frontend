import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, FileText, Pencil, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, Button, Card, Modal } from "../../components/ui";
import { FormField, Input, MultiSelect, Select } from "../../components/forms";
import {
  DataTable,
  type DataTableAction,
  type DataTableColumn,
} from "../../components/table";
import {
  saleApi,
  type ProductDetails,
  type SalePayload,
} from "../../services/sale.api";
import { partyApi } from "../../services/party.api";
import { productApi } from "../../services/product.api";
import type { Party, Product, Sale } from "../../types/product.types";
import { SaleInvoiceModal } from "./SaleInvoiceModal";
import { useAuth } from "../../hooks/useAuth";

type Form = {
  productCode: string;
  productName: string;
  partyId: string;
  partyName: string;
  supplierId: string;
  supplierName: string;
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  quantity: string;
  unit: "PIECES" | "DOZEN";
  purchasePrice: string;
  salePrice: string;
  paidAmount: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  status: boolean;
};
const empty: Form = {
  productCode: "",
  productName: "",
  partyId: "",
  partyName: "",
  supplierId: "",
  supplierName: "",
  brandIds: [],
  colorIds: [],
  sizeIds: [],
  quantity: "",
  unit: "PIECES",
  purchasePrice: "",
  salePrice: "",
  paidAmount: "0",
  paymentStatus: "UNPAID",
  status: true,
};
const names = (items: { name: string }[]) =>
  items.map((item) => item.name).join(", ") || "—";

export const Sales = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMIN";
  const [form, setForm] = useState<Form>(empty);
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [invoice, setInvoice] = useState<Awaited<
    ReturnType<typeof saleApi.invoice>
  > | null>(null);
  const [items, setItems] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const loadSales = async (term = search) => {
    const data = await saleApi.list({ search: term || undefined });
    setItems(data.sale);
  };
  useEffect(() => {
    Promise.all([
      saleApi.list(),
      productApi.products.list({ status: true, limit: 1000 }),
      partyApi.list({ page: 1, limit: 1000 }),
    ])
      .then(([sales, productData, partyData]) => {
        setItems(sales.sale);
        setProducts(productData.products);
        setParties(partyData.party);
      })
      .catch((error) =>
        toast({
          title: "Failed to load sales data",
          description: error.message,
          variant: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, [toast]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      loadSales().catch((error) =>
        toast({
          title: "Failed to load sales",
          description: error.message,
          variant: "error",
        }),
      );
    }, 250);
    return () => window.clearTimeout(id);
  }, [search, toast]);
  const reset = () => {
    setForm(empty);
    setDetails(null);
    setEditing(null);
    setLookupError("");
  };
  const selectProduct = async (code: string) => {
    setLookupError("");
    setDetails(null);
    setForm((current) => ({ ...current, productCode: code }));
    if (!code) return;
    try {
      const result = await saleApi.productDetails(code);
      setDetails(result);
      setForm((current) => ({
        ...current,
        productCode: result.product.productCode,
        productName: result.product.productName,
        supplierId: result.supplier ? String(result.supplier.id) : "",
        supplierName: result.supplier?.name || "",
        brandIds: result.product.brandIds,
        colorIds: result.product.colorIds,
        sizeIds: result.product.sizeIds,
        quantity: result.product.quantity
          ? String(result.product.quantity)
          : "",
        unit: result.product.unit,
        purchasePrice:
          result.product.purchasePrice !== null
            ? String(result.product.purchasePrice)
            : "",
      }));
    } catch (error) {
      setLookupError(
        (error as Error).message || "Product details could not be loaded.",
      );
    }
  };
  const edit = (sale: Sale) => {
    setEditing(sale);
    setDetails({
      product: {
        id: 0,
        productCode: sale.productCode,
        productName: sale.productName,
        quantity: sale.quantity,
        unit: sale.unit,
        purchasePrice: sale.purchasePrice,
        brandIds: sale.brandIds,
        colorIds: sale.colorIds,
        sizeIds: sale.sizeIds,
        brands: sale.brands,
        colors: sale.colors,
        sizes: sale.sizes,
      },
      supplier: sale.supplierId
        ? { id: sale.supplierId, name: sale.supplierName || "" }
        : null,
    });
    setForm({
      productCode: sale.productCode,
      productName: sale.productName,
      partyId: sale.partyId ? String(sale.partyId) : "",
      partyName: sale.partyName || "",
      supplierId: sale.supplierId ? String(sale.supplierId) : "",
      supplierName: sale.supplierName || "",
      brandIds: sale.brandIds,
      colorIds: sale.colorIds,
      sizeIds: sale.sizeIds,
      quantity: String(sale.quantity),
      unit: sale.unit,
      purchasePrice: String(sale.purchasePrice),
      salePrice: String(sale.salePrice),
      paidAmount: String(sale.paidAmount),
      paymentStatus: sale.paymentStatus,
      status: sale.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!details || !form.colorIds.length || !form.sizeIds.length) {
      toast({
        title: "Select a product and its color and size",
        variant: "error",
      });
      return;
    }
    const payload: SalePayload = {
      productCode: form.productCode,
      productName: form.productName,
      partyId: form.partyId ? Number(form.partyId) : undefined,
      partyName: form.partyName || undefined,
      supplierId: form.supplierId ? Number(form.supplierId) : undefined,
      supplierName: form.supplierName || undefined,
      brandIds: form.brandIds,
      colorIds: form.colorIds,
      sizeIds: form.sizeIds,
      quantity: Number(form.quantity),
      unit: form.unit,
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      paidAmount: Number(form.paidAmount),
      paymentStatus: form.paymentStatus,
      status: form.status,
    };
    try {
      setSaving(true);
      const response = editing
        ? await saleApi.update(editing.id, payload)
        : await saleApi.create(payload);
      setItems((current) =>
        editing
          ? current.map((sale) =>
              sale.id === response.sale.id ? response.sale : sale,
            )
          : [response.sale, ...current],
      );
      reset();
      setPage(1);
      toast({
        title: editing ? "Sale updated" : "Sale created",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Unable to save sale",
        description: (error as Error).message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };
  const openInvoice = async (sale: Sale) => {
    try {
      setInvoice(await saleApi.invoice(sale.id));
    } catch (error) {
      toast({
        title: "Unable to generate invoice",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };
  const columns: DataTableColumn<Sale>[] = [
    { key: "productCode", header: "Product Code" },
    { key: "productName", header: "Product Name" },
    {
      key: "partyName",
      header: "Party Name",
      cell: (sale) => sale.partyName || sale.party?.partyName || "-",
    },
    {
      key: "supplierName",
      header: "Supplier",
      cell: (sale) => sale.supplierName || "—",
    },
    { key: "brand", header: "Brand", cell: (sale) => names(sale.brands) },
    { key: "color", header: "Color", cell: (sale) => names(sale.colors) },
    { key: "size", header: "Size", cell: (sale) => names(sale.sizes) },
    {
      key: "quantity",
      header: "Quantity",
      cell: (sale) => `${sale.quantity} ${sale.unit}`,
    },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      cell: (sale) => `₹${sale.purchasePrice}`,
    },
    {
      key: "salePrice",
      header: "Sale Price",
      cell: (sale) => `₹${sale.salePrice}`,
    },
    {
      key: "paidAmount",
      header: "Paid Amount",
      cell: (sale) => `₹${sale.paidAmount}`,
    },
    {
      key: "remainingAmount",
      header: "Remaining Amount",
      cell: (sale) => `₹${sale.remainingAmount}`,
    },
    { key: "paymentStatus", header: "Payment Status" },
    ...(isAdmin
      ? [
          {
            key: "perSaleProfit" as const,
            header: "Per Sale Profit",
            cell: (sale: Sale) => `INR ${sale.perSaleProfit}`,
          },
        ]
      : []),
  ];
  const actions: DataTableAction<Sale>[] = [
    { label: <Eye size={16} />, onClick: setViewing, title: "View" },
    {
      label: <FileText size={16} />,
      onClick: openInvoice,
      title: "Generate Invoice",
    },
    { label: <Pencil size={16} />, onClick: edit, title: "Edit" },
    {
      label: <Trash2 size={16} />,
      onClick: async (sale) => {
        await saleApi.remove(sale.id);
        setItems((current) => current.filter((item) => item.id !== sale.id));
      },
      title: "Delete",
      className: "text-red-600 hover:bg-red-50",
    },
  ];
  const rows = items.slice((page - 1) * limit, page * limit);
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
            <p className="text-sm font-semibold text-primary-dark">SALES</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              All Sales
            </h2>
          </div>
        </div>
        <Button
          onClick={() => {
            reset();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          + Add Sale
        </Button>
      </div>
      <Card className="mb-6 p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Product Code" required error={lookupError}>
              <Select
                required
                value={form.productCode}
                onChange={(event) => void selectProduct(event.target.value)}
              >
                <option value="">Select product code</option>
                {products.map((product) => (
                  <option key={product.id} value={product.productCode}>
                    {product.productCode}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Product Name">
              <Input
                readOnly
                value={form.productName}
                placeholder="Auto-filled"
              />
            </FormField>
            <FormField label="Supplier Name">
              <Input
                readOnly
                value={form.supplierName}
                placeholder="Auto-filled from purchase"
              />
            </FormField>
            <FormField label="Party">
              <Select
                value={form.partyId}
                onChange={(event) => {
                  const party = parties.find(
                    (item) => String(item.id) === event.target.value,
                  );
                  setForm((current) => ({
                    ...current,
                    partyId: event.target.value,
                    partyName: party?.partyName || "",
                  }));
                }}
              >
                <option value="">Select party</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.partyName}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Brand">
              <MultiSelect
                options={details?.product.brands || []}
                value={form.brandIds}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    brandIds: value.map(Number),
                  }))
                }
                disabled={!details}
                placeholder="Fetched from product"
              />
            </FormField>
            <FormField label="Color" required>
              <MultiSelect
                options={details?.product.colors || []}
                value={form.colorIds}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    colorIds: value.map(Number),
                  }))
                }
                disabled={!details}
                placeholder="Fetched from product"
              />
            </FormField>
            <FormField label="Size" required>
              <MultiSelect
                options={details?.product.sizes || []}
                value={form.sizeIds}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    sizeIds: value.map(Number),
                  }))
                }
                disabled={!details}
                placeholder="Fetched from product"
              />
            </FormField>
            <FormField label="Quantity" required>
              <div className="flex gap-2">
                <Input
                  required
                  min="1"
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                />
                <Select
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unit: event.target.value as Form["unit"],
                    }))
                  }
                  className="w-28"
                >
                  <option value="PIECES">Pieces</option>
                  <option value="DOZEN">Dozen</option>
                </Select>
              </div>
            </FormField>
            <FormField label="Purchase Price" required>
              <Input
                required
                min="0"
                type="number"
                value={form.purchasePrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    purchasePrice: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Sale Price" required>
              <Input
                required
                min="0"
                type="number"
                value={form.salePrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    salePrice: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Paid Amount" required>
              <Input
                required
                min="0"
                type="number"
                value={form.paidAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paidAmount: event.target.value,
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
                    paymentStatus: event.target.value as Form["paymentStatus"],
                  }))
                }
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status ? "ACTIVE" : "INACTIVE"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value === "ACTIVE",
                  }))
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={reset}>
              Reset
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Update Sale" : "Submit Sale"}
            </Button>
          </div>
        </form>
      </Card>
      <Card className="mb-6 p-4">
        <div className="relative max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search sales"
            className="pl-9"
          />
        </div>
      </Card>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(sale) => sale.id}
        actions={actions}
        loading={loading}
        emptyMessage="No sales found."
        pagination={{
          page,
          totalPages: Math.max(1, Math.ceil(items.length / limit)),
          total: items.length,
          limit,
          onPageChange: setPage,
          onLimitChange: (value) => {
            setLimit(value);
            setPage(1);
          },
        }}
      />
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Sale Details"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span>Product</span>
            <span>{viewing.productName}</span>
            <span>Supplier</span>
            <span>{viewing.supplierName || "—"}</span>
            <span>Brand</span>
            <span>{names(viewing.brands)}</span>
            <span>Color</span>
            <span>{names(viewing.colors)}</span>
            <span>Size</span>
            <span>{names(viewing.sizes)}</span>
            <span>Quantity</span>
            <span>
              {viewing.quantity} {viewing.unit}
            </span>
            <span>Purchase Price</span>
            <span>₹{viewing.purchasePrice}</span>
            <span>Sale Price</span>
            <span>₹{viewing.salePrice}</span>
            <span>Paid Amount</span>
            <span>{viewing.paidAmount}</span>
            <span>Remaining Amount</span>
            <span>{viewing.remainingAmount}</span>
            <span>Payment Status</span>
            <span>{viewing.paymentStatus}</span>
            {isAdmin && (
              <>
                <span>Per Sale Profit</span>
                <span>{viewing.perSaleProfit}</span>
              </>
            )}
          </div>
        )}
      </Modal>
      <SaleInvoiceModal invoice={invoice} onClose={() => setInvoice(null)} />
    </>
  );
};
