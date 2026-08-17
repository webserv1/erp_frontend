import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, Button, Card, Modal } from "../../components/ui";
import { FormField, Input, Select, Textarea } from "../../components/forms";
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "../../components/table";
import { expenseApi } from "../../services/expense.api";
import type { Expense } from "../../types/product.types";
import { useAuth } from "../../hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getBillUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseUrl}${url}`;
};

type PaymentMode = Expense["paymentMode"];

type FormState = {
  category: string;
  details: string;
  amount: string;
  paymentMode: PaymentMode;
  billFile: File | null;
  billUrl: string;
  status: boolean;
};

const emptyForm: FormState = {
  category: "",
  details: "",
  amount: "",
  paymentMode: "CASH",
  billFile: null,
  billUrl: "",
  status: true,
};

const paymentModes = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
];
const categorySuggestions = [
  "petrol",
  "collection",
  "sample",
  "bus",
  "Transport",
  "others",
];

export const ExpenseMaster = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMIN";

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewing, setViewing] = useState<Expense | null>(null);

  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");

  const [summary, setSummary] = useState<{
    thisMonthTotal: number;
    totalRecords: number;
    activeExpenses: number;
  } | null>(null);
  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);
  const billPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const loadExpenses = async () => {
      try {
        const data = await expenseApi.list({
          search: search || undefined,
          category: categoryFilter || undefined,
          paymentMode: paymentModeFilter || undefined,
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
          setItems(data.expense);
          setTotal(data.total);
        }
      } catch (err) {
        if (!cancelled)
          toast({
            title: "Failed to load expenses",
            description: (err as Error).message,
            variant: "error",
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadExpenses();
    return () => {
      cancelled = true;
    };
  }, [
    search,
    categoryFilter,
    paymentModeFilter,
    statusFilter,
    page,
    limit,
    toast,
  ]);

  useEffect(() => {
    return () => {
      if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const data = await expenseApi.getSummary();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled)
          toast({ title: "Failed to load summary", variant: "error" });
      }
    };
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, toast]);

  const refreshSummary = async () => {
    try {
      const data = await expenseApi.getSummary();
      setSummary(data);
    } catch {
      toast({ title: "Failed to load summary", variant: "error" });
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
    setBillPreviewUrl(null);
    billPreviewRef.current = null;
  };

  const openCreate = () => {
    resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (row: Expense) => {
    setEditing(row);
    setForm({
      category: row.category,
      details: row.details,
      amount: String(row.amount),
      paymentMode: row.paymentMode,
      billFile: null,
      billUrl: row.billUrl || "",
      status: row.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openView = (row: Expense) => {
    setViewing(row);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (billPreviewRef.current) URL.revokeObjectURL(billPreviewRef.current);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    setForm((f) => ({ ...f, billFile: file }));
    setBillPreviewUrl(previewUrl);
    billPreviewRef.current = previewUrl;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("category", form.category);
      formData.append("details", form.details);
      formData.append("amount", String(Number(form.amount)));
      formData.append("paymentMode", form.paymentMode);
      formData.append("status", String(form.status));
      if (form.billFile) {
        formData.append("bill", form.billFile);
      }

      if (editing) {
        await expenseApi.update(editing.id, formData);
        toast({ title: "Expense updated", variant: "success" });
      } else {
        await expenseApi.create(formData);
        toast({ title: "Expense created", variant: "success" });
      }
      resetForm();
      setPage(1);
      const data = await expenseApi.list({
        search: search || undefined,
        category: categoryFilter || undefined,
        paymentMode: paymentModeFilter || undefined,
        status:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
              ? false
              : undefined,
        page: 1,
        limit,
      });
      setItems(data.expense);
      setTotal(data.total);
      if (isAdmin) await refreshSummary();
    } catch (err) {
      toast({
        title: editing ? "Update failed" : "Creation failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const remove = async (row: Expense) => {
    try {
      await expenseApi.remove(row.id);
      toast({ title: "Expense deleted", variant: "success" });
      const data = await expenseApi.list({
        search: search || undefined,
        category: categoryFilter || undefined,
        paymentMode: paymentModeFilter || undefined,
        status:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
              ? false
              : undefined,
        page: page > 1 ? page - 1 : 1,
        limit,
      });
      setItems(data.expense);
      setTotal(data.total);
      setPage(data.page || 1);
      if (isAdmin) await refreshSummary();
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

  const columns: DataTableColumn<Expense>[] = [
    { key: "category", header: "Category", width: "120px" },
    { key: "details", header: "Details" },
    {
      key: "amount",
      header: "Amount",
      width: "120px",
      cell: (row) => `₹${row.amount}`,
    },
    {
      key: "paymentMode",
      header: "Payment Mode",
      width: "120px",
      cell: (row) => row.paymentMode,
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

  const actions: DataTableAction<Expense>[] = [
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
              EXPENSE TRACKER
            </p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              All Expenses
            </h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Expense</Button>
      </div>

      {isAdmin && (
        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm text-text-secondary">This Month's Total</p>
            <p className="mt-1 text-2xl font-bold text-secondary">
              {loading
                ? "..."
                : `₹${(summary?.thisMonthTotal ?? 0).toLocaleString("en-IN")}`}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-text-secondary">Total Records</p>
            <p className="mt-1 text-2xl font-bold text-secondary">
              {loading ? "..." : (summary?.totalRecords ?? 0)}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-text-secondary">Active Expenses</p>
            <p className="mt-1 text-2xl font-bold text-secondary">
              {loading ? "..." : (summary?.activeExpenses ?? 0)}
            </p>
          </Card>
        </div>
      )}

      <Card className="mb-6 p-6">
        <form id="expense-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Category" required>
              <Input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Enter expense category"
                list="expense-category-suggestions"
              />
              <datalist id="expense-category-suggestions">
                {categorySuggestions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </FormField>
            <FormField label="Details" required className="sm:col-span-2">
              <Textarea
                required
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="Enter expense details"
              />
            </FormField>
            <FormField label="Amount" required>
              <Input
                required
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Payment Mode" required>
              <Select
                required
                value={form.paymentMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMode: e.target.value as PaymentMode,
                  })
                }
              >
                {paymentModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Bill">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="input-field"
              />
              {(billPreviewUrl || (editing && form.billUrl)) && (
                <div className="mt-2">
                  {billPreviewUrl ? (
                    <div className="relative inline-block">
                      {form.billFile?.type.startsWith("image/") ? (
                        <img
                          src={billPreviewUrl}
                          alt="Bill preview"
                          className="max-h-40 rounded border border-border-gold"
                        />
                      ) : (
                        <div className="flex h-40 w-40 items-center justify-center rounded border border-border-gold bg-gray-50">
                          <span className="text-xs text-text-secondary">
                            PDF Preview
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (billPreviewRef.current)
                            URL.revokeObjectURL(billPreviewRef.current);
                          setBillPreviewUrl(null);
                          billPreviewRef.current = null;
                          setForm((f) => ({ ...f, billFile: null }));
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : editing && form.billUrl ? (
                    <a
                      href={getBillUrl(form.billUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-dark underline"
                    >
                      View current bill
                    </a>
                  ) : null}
                </div>
              )}
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
              {editing ? "Update Expense" : "Submit Expense"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <Input
              placeholder="Search by category or details"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter category"
              className="sm:max-w-40"
              list="expense-category-suggestions"
            />
            <Select
              value={paymentModeFilter}
              onChange={(e) => {
                setPaymentModeFilter(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-40"
            >
              <option value="">All Payment Modes</option>
              {paymentModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
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
        rows={paginatedItems}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No expenses found."
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
        title="Expense Details"
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
                    Category
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.category}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Details
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.details}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Amount
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    ₹{viewing.amount}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-text-secondary">
                    Payment Mode
                  </td>
                  <td className="px-4 py-2 text-secondary">
                    {viewing.paymentMode}
                  </td>
                </tr>
                {viewing.billUrl && (
                  <tr>
                    <td className="px-4 py-2 font-semibold text-text-secondary">
                      Bill
                    </td>
                    <td className="px-4 py-2 text-secondary">
                      <a
                        href={getBillUrl(viewing.billUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-dark underline"
                      >
                        View Bill
                      </a>
                    </td>
                  </tr>
                )}
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
