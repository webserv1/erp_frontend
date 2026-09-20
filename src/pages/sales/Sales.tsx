import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, FileText, Pencil, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, Button, Card, Modal } from "../../components/ui";
import { FormField, Input, Select } from "../../components/forms";
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

type SaleLineForm = {
  rowId: string;
  productId?: number;
  productCode: string;
  productName: string;
  brands: { id: number; name: string }[];
  colors: { id: number; name: string }[];
  sizes: { id: number; name: string }[];
  supplierId: string;
  supplierName: string;
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  quantity: string;
  unit: "PIECES" | "DOZEN";
  purchasePrice: string;
  salePrice: string;
};

type Form = {
  saleNumber: string;
  partyId: string;
  partyName: string;
  paidAmount: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  remarks: string;
  status: boolean;
  lines: SaleLineForm[];
};

const createLine = (): SaleLineForm => ({
  rowId: `${Date.now()}-${Math.random()}`,
  productCode: "",
  productName: "",
  brands: [],
  colors: [],
  sizes: [],
  supplierId: "",
  supplierName: "",
  brandIds: [],
  colorIds: [],
  sizeIds: [],
  quantity: "1",
  unit: "PIECES",
  purchasePrice: "0",
  salePrice: "0",
});

const empty: Form = {
  saleNumber: "",
  partyId: "",
  partyName: "",
  paidAmount: "0",
  paymentStatus: "UNPAID",
  remarks: "",
  status: true,
  lines: [createLine()],
};

const unitMultiplier = (unit: "PIECES" | "DOZEN") => (unit === "DOZEN" ? 12 : 1);
const numberOrZero = (value: string | number) => Number(value) || 0;
const names = (items: { name: string }[]) =>
  items.map((item) => item.name).join(", ") || "—";

const lineTotal = (line: SaleLineForm) =>
  numberOrZero(line.quantity) * unitMultiplier(line.unit) * numberOrZero(line.salePrice);
const lineTotalPurchaseAmount = (line: SaleLineForm) =>
  numberOrZero(line.quantity) *
  unitMultiplier(line.unit) *
  numberOrZero(line.purchasePrice);

const getSaleLines = (sale: Sale): SaleLineForm[] =>
  sale.items?.length
    ? sale.items.map((item) => ({
        rowId: String(item.id),
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        brands: item.brands || [],
        colors: item.colors || [],
        sizes: item.sizes || [],
        supplierId: item.supplierId ? String(item.supplierId) : "",
        supplierName: item.supplierName || "",
        brandIds: item.brandIds || [],
        colorIds: item.colorIds || [],
        sizeIds: item.sizeIds || [],
        quantity: String(item.quantity || 0),
        unit: item.unit || "PIECES",
        purchasePrice: String(item.purchasePrice || 0),
        salePrice: String(item.salePrice || 0),
      }))
    : [
        {
          rowId: String(sale.id),
          productId: sale.productId,
          productCode: sale.productCode,
          productName: sale.productName,
          brands: sale.brands || [],
          colors: sale.colors || [],
          sizes: sale.sizes || [],
          supplierId: sale.supplierId ? String(sale.supplierId) : "",
          supplierName: sale.supplierName || "",
          brandIds: sale.brandIds || [],
          colorIds: sale.colorIds || [],
          sizeIds: sale.sizeIds || [],
          quantity: String(sale.quantity || 0),
          unit: sale.unit || "PIECES",
          purchasePrice: String(sale.purchasePrice || 0),
          salePrice: String(sale.salePrice || 0),
        },
      ];

export const Sales = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMIN";

  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [invoice, setInvoice] = useState<Awaited<
    ReturnType<typeof saleApi.invoice>
  > | null>(null);
  const [items, setItems] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [productDetails, setProductDetails] = useState<
    Record<string, ProductDetails>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const netTotalSalePrice = useMemo(
    () => form.lines.reduce((sum, line) => sum + lineTotal(line), 0),
    [form.lines],
  );
  const netTotalPurchaseAmount = useMemo(
    () => form.lines.reduce((sum, line) => sum + lineTotalPurchaseAmount(line), 0),
    [form.lines],
  );

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
    setForm({ ...empty, lines: [createLine()] });
    setEditing(null);
  };

  const setLine = (rowId: string, updater: (line: SaleLineForm) => SaleLineForm) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.rowId === rowId ? updater(line) : line)),
    }));
  };

  const selectProduct = async (rowId: string, code: string) => {
    setLine(rowId, (line) => ({ ...line, productCode: code }));
    if (!code) {
      setLine(rowId, (line) => ({
        ...line,
        productId: undefined,
        productCode: "",
        productName: "",
        brands: [],
        colors: [],
        sizes: [],
        supplierId: "",
        supplierName: "",
        brandIds: [],
        colorIds: [],
        sizeIds: [],
        quantity: "1",
        unit: "PIECES",
        purchasePrice: "0",
        salePrice: "0",
      }));
      return;
    }
    try {
      const cached = productDetails[code];
      const details = cached || (await saleApi.productDetails(code));
      if (!cached) {
        setProductDetails((current) => ({ ...current, [code]: details }));
      }
      setLine(rowId, (line) => ({
        ...line,
        productId: details.product.id,
        productCode: details.product.productCode,
        productName: details.product.productName,
        brands: details.product.brands,
        colors: details.product.colors,
        sizes: details.product.sizes,
        supplierId: details.supplier ? String(details.supplier.id) : "",
        supplierName: details.supplier?.name || "",
        brandIds: details.product.brandIds,
        colorIds: details.product.colorIds,
        sizeIds: details.product.sizeIds,
        quantity: line.quantity || "1",
        unit: details.product.unit,
        purchasePrice: line.purchasePrice,
      }));
    } catch (error) {
      toast({
        title: "Product details could not be loaded",
        description: (error as Error).message,
        variant: "error",
      });
      setLine(rowId, (line) => ({
        ...line,
        productId: undefined,
        productCode: "",
        productName: "",
        brands: [],
        colors: [],
        sizes: [],
        supplierId: "",
        supplierName: "",
        brandIds: [],
        colorIds: [],
        sizeIds: [],
        quantity: "1",
        unit: "PIECES",
        purchasePrice: "0",
        salePrice: "0",
      }));
    }
  };

  const edit = (sale: Sale) => {
    const lines = getSaleLines(sale);
    setEditing(sale);
    setForm({
      saleNumber: sale.saleNumber || "",
      partyId: sale.partyId ? String(sale.partyId) : "",
      partyName: sale.partyName || "",
      paidAmount: String(sale.paidAmount || 0),
      paymentStatus: sale.paymentStatus,
      remarks: sale.remarks || "",
      status: sale.status,
      lines,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.partyId) {
      toast({ title: "Please select a party", variant: "error" });
      return;
    }

    const invalidLine = form.lines.find(
      (line) =>
        !line.productCode ||
        numberOrZero(line.quantity) <= 0 ||
        numberOrZero(line.salePrice) <= 0,
    );
    if (invalidLine) {
      toast({
        title: "Each product row needs product code, quantity and sale price",
        variant: "error",
      });
      return;
    }

    const payload: SalePayload = {
      saleNumber: form.saleNumber || undefined,
      partyId: Number(form.partyId),
      partyName: form.partyName || undefined,
      items: form.lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        productCode: line.productCode,
        supplierId: line.supplierId ? Number(line.supplierId) : undefined,
        supplierName: line.supplierName || undefined,
        brandIds: line.brandIds,
        colorIds: line.colorIds,
        sizeIds: line.sizeIds,
        quantity: numberOrZero(line.quantity),
        unit: line.unit,
        salePrice: numberOrZero(line.salePrice),
        purchasePrice: numberOrZero(line.purchasePrice),
        totalPurchaseAmount: lineTotalPurchaseAmount(line),
        totalSalePrice: lineTotal(line),
      })),
      netTotalPurchaseAmount,
      netTotalSalePrice,
      paidAmount: numberOrZero(form.paidAmount),
      paymentStatus: form.paymentStatus,
      remarks: form.remarks || undefined,
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
    {
      key: "productCode",
      header: "Product Code",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>{item.productCode}</div>
          ))}
          {!sale.items?.length && <div>{sale.productCode}</div>}
        </div>
      ),
    },
    {
      key: "productName",
      header: "Product Name",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>{item.productName}</div>
          ))}
          {!sale.items?.length && <div>{sale.productName}</div>}
        </div>
      ),
    },
    {
      key: "partyName",
      header: "Party Name",
      cell: (sale) => sale.partyName || sale.party?.partyName || "-",
    },
    {
      key: "brand",
      header: "Brand",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>{names(item.brands)}</div>
          ))}
          {!sale.items?.length && <div>{names(sale.brands)}</div>}
        </div>
      ),
    },
    {
      key: "color",
      header: "Color",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>{names(item.colors)}</div>
          ))}
          {!sale.items?.length && <div>{names(sale.colors)}</div>}
        </div>
      ),
    },
    {
      key: "size",
      header: "Size",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>{names(item.sizes)}</div>
          ))}
          {!sale.items?.length && <div>{names(sale.sizes)}</div>}
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>
              {item.quantity} {item.unit}
            </div>
          ))}
          {!sale.items?.length && (
            <div>
              {sale.quantity} {sale.unit}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "salePrice",
      header: "Sale Price",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>₹{item.salePrice}</div>
          ))}
          {!sale.items?.length && <div>₹{sale.salePrice}</div>}
        </div>
      ),
    },
    {
      key: "totalSalePrice",
      header: "Total Sale Price",
      cell: (sale) => (
        <div className="space-y-1">
          {(sale.items?.length ? sale.items : []).map((item) => (
            <div key={item.id}>₹{item.totalSalePrice}</div>
          ))}
          {!sale.items?.length && <div>₹{sale.totalSalePrice || 0}</div>}
        </div>
      ),
    },
    {
      key: "netTotalSalePrice",
      header: "Net Total Sale Price",
      cell: (sale) => (
        <span className="font-semibold">₹{sale.netTotalSalePrice || 0}</span>
      ),
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
            <FormField label="Sale Number">
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.saleNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    saleNumber: event.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </FormField>
            <FormField label="Party" required>
              <Select
                required
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
            <FormField label="Remarks">
              <Input
                value={form.remarks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
              />
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

          <div className="rounded-lg border border-border-gold p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-secondary">Sale Products</p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    lines: [...current.lines, createLine()],
                  }))
                }
              >
                + Add Product
              </Button>
            </div>
            <div className="space-y-3">
              {form.lines.map((line, index) => (
                <div
                  key={line.rowId}
                  className="space-y-3 rounded-lg border border-border-gold/60 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <FormField label={`Product Code ${index + 1}`} required>
                      <Select
                        required
                        value={line.productCode}
                        onChange={(event) =>
                          void selectProduct(line.rowId, event.target.value)
                        }
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
                      <Input readOnly value={line.productName} />
                    </FormField>
                    <FormField label="Brand">
                      <Input readOnly value={names(line.brands)} />
                    </FormField>
                    <FormField label="Color">
                      <Input readOnly value={names(line.colors)} />
                    </FormField>
                    <FormField label="Size">
                      <Input readOnly value={names(line.sizes)} />
                    </FormField>
                    <FormField label="Supplier Name">
                      <Input readOnly value={line.supplierName} />
                    </FormField>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <FormField label="Quantity" required>
                      <div className="flex gap-2">
                        <Input
                          required
                          min="1"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-24"
                          value={line.quantity}
                          onChange={(event) =>
                            setLine(line.rowId, (currentLine) => ({
                              ...currentLine,
                              quantity: event.target.value.replace(/\D/g, ""),
                            }))
                          }
                        />
                        <Select
                          value={line.unit}
                          onChange={(event) =>
                            setLine(line.rowId, (currentLine) => ({
                              ...currentLine,
                              unit: event.target.value as SaleLineForm["unit"],
                            }))
                          }
                          className="w-32"
                        >
                          <option value="PIECES">Pieces</option>
                          <option value="DOZEN">Dozen</option>
                        </Select>
                      </div>
                      {line.productCode && productDetails[line.productCode] && (
                        <p className="mt-1 text-xs text-text-secondary">
                          Balance Qty:{" "}
                          {productDetails[line.productCode].product
                            .balanceQuantityDisplay ||
                            `${
                              productDetails[line.productCode].product
                                .balanceQuantity ?? 0
                            } PIECES`}
                        </p>
                      )}
                    </FormField>
                    <FormField label="Purchase Price">
                      <Input
                        min="0"
                        type="number"
                        value={line.purchasePrice}
                        onChange={(event) =>
                          setLine(line.rowId, (currentLine) => ({
                            ...currentLine,
                            purchasePrice: event.target.value,
                          }))
                        }
                      />
                      {line.productCode && productDetails[line.productCode] && (
                        <p className="mt-1 text-xs text-text-secondary">
                          Last Purchase Price: ₹
                          {productDetails[line.productCode].product.lastPurchasePrice ??
                            productDetails[line.productCode].product.purchasePrice ??
                            0}
                        </p>
                      )}
                    </FormField>
                    <FormField label="Total Purchase Amount">
                      <Input
                        readOnly
                        value={line.productCode ? lineTotalPurchaseAmount(line) : ""}
                      />
                    </FormField>
                    <FormField label="Sale Price" required>
                      <Input
                        required
                        min="0"
                        type="number"
                        value={line.salePrice}
                        onChange={(event) =>
                          setLine(line.rowId, (currentLine) => ({
                            ...currentLine,
                            salePrice: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Total Sale Price">
                      <Input readOnly value={line.productCode ? lineTotal(line) : ""} />
                    </FormField>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={form.lines.length === 1}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            lines: current.lines.filter(
                              (entry) => entry.rowId !== line.rowId,
                            ),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-right font-semibold text-secondary">
              <p>Net Total Purchase Amount: ₹{netTotalPurchaseAmount}</p>
              <p>Net Total Sale Price: ₹{netTotalSalePrice}</p>
            </div>
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
          <div className="overflow-x-auto">
            {(() => {
              const viewItems =
                viewing.items?.length > 0
                  ? viewing.items
                  : [
                      {
                        id: viewing.id,
                        productCode: viewing.productCode,
                        productName: viewing.productName,
                        quantity: viewing.quantity,
                        unit: viewing.unit,
                        salePrice: viewing.salePrice,
                        totalSalePrice:
                          viewing.totalSalePrice ||
                          viewing.quantity *
                            unitMultiplier(viewing.unit) *
                            viewing.salePrice,
                      },
                    ];
              return (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-gold">
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Party Name
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.partyName || viewing.party?.partyName || "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Product Code
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">
                      {viewItems.map((item) => (
                        <div key={item.id}>{item.productCode}</div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Product Name
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">
                      {viewItems.map((item) => (
                        <div key={item.id}>{item.productName}</div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Quantity
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">
                      {viewItems.map((item) => (
                        <div key={item.id}>
                          {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Sale Price
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">
                      {viewItems.map((item) => (
                        <div key={item.id}>₹{item.salePrice}</div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Total Sale Price
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    <div className="space-y-1">
                      {viewItems.map((item) => (
                        <div key={item.id}>₹{item.totalSalePrice}</div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Net Total Sale Price
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    ₹{viewing.netTotalSalePrice}
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
                {isAdmin && (
                  <tr>
                    <td className="px-4 py-2 font-semibold text-text-secondary">
                      Per Sale Profit
                    </td>
                    <td className="px-4 py-2 text-secondary">
                      ₹{viewing.perSaleProfit}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
              );
            })()}
          </div>
        )}
      </Modal>

      <SaleInvoiceModal invoice={invoice} onClose={() => setInvoice(null)} />
    </>
  );
};
