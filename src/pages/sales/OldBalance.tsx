import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, Button, Card, Modal } from "../../components/ui";
import { FormField, Input, Select } from "../../components/forms";
import {
  DataTable,
  type DataTableAction,
  type DataTableColumn,
} from "../../components/table";
import { oldBalanceApi } from "../../services/old-balance.api";
import { partyApi } from "../../services/party.api";
import type { OldBalance, Party } from "../../types/product.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getBillUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseUrl}${url}`;
};

type FormState = {
  partyId: string;
  oldBalanceAmount: string;
  qty: string;
  purchasePrice: string;
  salePrice: string;
  profit: string;
  billFile: File | null;
  billUrl: string;
  status: boolean;
};

const createEmptyForm = (): FormState => ({
  partyId: "",
  oldBalanceAmount: "",
  qty: "1",
  purchasePrice: "0",
  salePrice: "0",
  profit: "0",
  billFile: null,
  billUrl: "",
  status: true,
});

const toNumber = (value: string | number) => Number(value) || 0;

export const OldBalancePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [editing, setEditing] = useState<OldBalance | null>(null);
  const [viewing, setViewing] = useState<OldBalance | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OldBalance | null>(null);

  const [items, setItems] = useState<OldBalance[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);
  const billPreviewRef = useRef<string | null>(null);
  const billInputRef = useRef<HTMLInputElement | null>(null);

  const loadOldBalances = async (term = search) => {
    const data = await oldBalanceApi.list({ search: term || undefined });
    setItems(data.oldBalance);
  };

  useEffect(() => {
    Promise.all([
      oldBalanceApi.list(),
      partyApi.list({ page: 1, limit: 1000, status: true }),
    ])
      .then(([oldBalanceData, partyData]) => {
        setItems(oldBalanceData.oldBalance);
        setParties(partyData.party);
      })
      .catch((error) =>
        toast({
          title: "Failed to load old balances",
          description: (error as Error).message,
          variant: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadOldBalances().catch((error) =>
        toast({
          title: "Failed to load old balances",
          description: (error as Error).message,
          variant: "error",
        }),
      );
    }, 250);
    return () => window.clearTimeout(id);
  }, [search, toast]);

  useEffect(() => () => {
    if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
  }, []);

  const reset = () => {
    setForm(createEmptyForm());
    setEditing(null);
    if (billInputRef.current) billInputRef.current.value = "";
    if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
    setBillPreviewUrl(null);
    billPreviewRef.current = null;
  };

  const syncProfit = (nextPurchasePrice: string, nextSalePrice: string) => {
    const computed = toNumber(nextSalePrice) - toNumber(nextPurchasePrice);
    return String(computed);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.partyId) {
      toast({ title: "Please select party", variant: "error" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("partyId", form.partyId);
      formData.append("oldBalanceAmount", String(toNumber(form.oldBalanceAmount)));
      formData.append("purchasePrice", String(toNumber(form.purchasePrice)));
      formData.append("salePrice", String(toNumber(form.salePrice)));
      formData.append("profit", String(Number(form.profit) || 0));
      formData.append("status", String(form.status));
      if (form.billFile) formData.append("bill", form.billFile);

      if (editing) {
        await oldBalanceApi.update(editing.id, formData);
        toast({ title: "Old balance updated", variant: "success" });
      } else {
        await oldBalanceApi.create(formData);
        toast({ title: "Old balance added", variant: "success" });
      }

      reset();
      await loadOldBalances();
      setPage(1);
    } catch (error) {
      toast({
        title: "Unable to save old balance",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const openEdit = (row: OldBalance) => {
    setEditing(row);
    setForm({
      partyId: String(row.partyId),
      oldBalanceAmount: String(row.oldBalanceAmount),
      qty: "1",
      purchasePrice: String(row.purchasePrice),
      salePrice: String(row.salePrice),
      profit: String(row.profit),
      billFile: null,
      billUrl: row.billUrl || "",
      status: row.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    setForm((current) => ({ ...current, billFile: file }));
    setBillPreviewUrl(previewUrl);
    billPreviewRef.current = previewUrl;
  };

  const remove = async (row: OldBalance) => {
    await oldBalanceApi.remove(row.id);
    setItems((current) => current.filter((item) => item.id !== row.id));
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete);
      setPendingDelete(null);
      toast({ title: "Old balance deleted", variant: "success" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const columns: DataTableColumn<OldBalance>[] = [
    { key: "partyName", header: "Party Name" },
    {
      key: "shopName",
      header: "Shop Name",
      cell: (row) => row.party?.shopName || "—",
    },
    {
      key: "oldBalanceAmount",
      header: "Old Balance",
      cell: (row) => `₹${row.oldBalanceAmount}`,
    },
    { key: "qty", header: "Qty", cell: () => "1" },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      cell: (row) => `₹${row.purchasePrice}`,
    },
    {
      key: "salePrice",
      header: "Sale Price",
      cell: (row) => `₹${row.salePrice}`,
    },
    {
      key: "profit",
      header: "Profit",
      cell: (row) => `₹${row.profit}`,
    },
    {
      key: "billUrl",
      header: "Dummy Invoice",
      cell: (row) =>
        row.billUrl ? (
          <a
            href={getBillUrl(row.billUrl)}
            target="_blank"
            rel="noreferrer"
            className="text-primary-dark underline"
          >
            View
          </a>
        ) : "—",
    },
    {
      key: "createdAt",
      header: "Created At",
      cell: (row) =>
        new Date(row.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  const actions: DataTableAction<OldBalance>[] = [
    { label: <Eye size={16} />, onClick: setViewing, title: "View" },
    { label: <Pencil size={16} />, onClick: openEdit, title: "Edit" },
    {
      label: <Trash2 size={16} />,
      onClick: setPendingDelete,
      title: "Delete",
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  const rows = items.slice((page - 1) * limit, page * limit);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/sales")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">SALES</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              Add Old Balance
            </h2>
          </div>
        </div>
      </div>

      <Card className="mb-6 p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Party Name" required>
              <Select
                required
                value={form.partyId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, partyId: event.target.value }))
                }
              >
                <option value="">Select party</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.partyName} ({party.shopName})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Old Balance Amount" required>
              <Input
                required
                type="number"
                min="0"
                value={form.oldBalanceAmount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, oldBalanceAmount: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Qty">
              <Input readOnly value={form.qty} />
            </FormField>
            <FormField label="Dummy Invoice Bill">
              <input
                ref={billInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input-field"
              />
              {(billPreviewUrl || (editing && form.billUrl)) && (
                <div className="mt-2 flex items-center gap-3">
                  {billPreviewUrl ? (
                    <img
                      src={billPreviewUrl}
                      alt="Bill preview"
                      className="h-14 w-14 rounded border border-border-gold object-cover"
                    />
                  ) : (
                    <a
                      href={getBillUrl(form.billUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary-dark underline"
                    >
                      View current bill
                    </a>
                  )}
                  {form.billFile && (
                    <button
                      type="button"
                      onClick={() => {
                        if (billInputRef.current) billInputRef.current.value = "";
                        if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
                        setBillPreviewUrl(null);
                        billPreviewRef.current = null;
                        setForm((current) => ({ ...current, billFile: null }));
                      }}
                      className="rounded p-1 text-text-secondary hover:bg-primary/10"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </FormField>
            <FormField label="Purchase Price" required>
              <Input
                required
                type="number"
                min="0"
                value={form.purchasePrice}
                onChange={(event) =>
                  setForm((current) => {
                    const purchasePrice = event.target.value;
                    return {
                      ...current,
                      purchasePrice,
                      profit: syncProfit(purchasePrice, current.salePrice),
                    };
                  })
                }
              />
            </FormField>
            <FormField label="Sale Price" required>
              <Input
                required
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(event) =>
                  setForm((current) => {
                    const salePrice = event.target.value;
                    return {
                      ...current,
                      salePrice,
                      profit: syncProfit(current.purchasePrice, salePrice),
                    };
                  })
                }
              />
            </FormField>
            <FormField label="Profit" required>
              <Input
                required
                type="number"
                value={form.profit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, profit: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status ? "ACTIVE" : "INACTIVE"}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value === "ACTIVE" }))
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
            <Button type="submit">
              {editing ? "Update Old Balance" : "Submit Old Balance"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="relative max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search old balance"
            className="pl-9"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No old balance entries found."
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
        title="Old Balance Details"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border-gold">
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Party Name</td><td className="px-4 py-2 text-secondary">{viewing.partyName}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Shop Name</td><td className="px-4 py-2 text-secondary">{viewing.party?.shopName || "—"}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Old Balance</td><td className="px-4 py-2 text-secondary">₹{viewing.oldBalanceAmount}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Qty</td><td className="px-4 py-2 text-secondary">1</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Purchase Price</td><td className="px-4 py-2 text-secondary">₹{viewing.purchasePrice}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Sale Price</td><td className="px-4 py-2 text-secondary">₹{viewing.salePrice}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Profit</td><td className="px-4 py-2 text-secondary">₹{viewing.profit}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Dummy Invoice</td><td className="px-4 py-2 text-secondary">{viewing.billUrl ? <a href={getBillUrl(viewing.billUrl)} target="_blank" rel="noreferrer" className="text-primary-dark underline">View bill</a> : "—"}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-text-secondary">Status</td><td className="px-4 py-2 text-secondary">{viewing.status ? "Active" : "Inactive"}</td></tr>
            </tbody>
          </table>
        )}
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Old Balance"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete this old balance entry?
        </p>
      </Modal>
    </>
  );
};
