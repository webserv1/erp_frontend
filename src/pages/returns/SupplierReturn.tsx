import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, useToast } from "../../components/ui";
import { DataTable, type DataTableAction, type DataTableColumn } from "../../components/table";
import { supplierReturnApi } from "../../services/supplier-return.api";
import type { SupplierReturn } from "../../types/product.types";

const formatProducts = (items: SupplierReturn["items"]) =>
  items?.length
    ? items
        .map(
          (item) =>
            `${item.productCode} (${item.quantity} ${item.unit}) - ₹${item.totalPurchaseAmount}`,
        )
        .join(", ")
    : "—";

const renderStackedValues = (values: Array<string | number>) => (
  <div className="overflow-hidden rounded-md border border-border-gold/40 divide-y divide-border-gold/30 bg-white/40">
    {values.map((value, index) => (
      <div key={index} className="px-2 py-1">
        {value}
      </div>
    ))}
  </div>
);

export const SupplierReturnPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<SupplierReturn | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SupplierReturn | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setItems(await supplierReturnApi.list());
    } catch (error) {
      toast({
        title: "Failed to load supplier returns",
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await supplierReturnApi.remove(pendingDelete.id);
      setPendingDelete(null);
      toast({ title: "Supplier return deleted", variant: "success" });
      await loadData();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: (error as Error).message,
        variant: "error",
      });
    }
  };

  const columns = useMemo<DataTableColumn<SupplierReturn>[]>(
    () => [
      { key: "purchaseNumber", header: "Purchase Number", cell: (row) => row.purchaseNumber || "Manual" },
      {
        key: "returnAmountReceived",
        header: "Return Amount Received",
        cell: (row) => <span className="font-semibold whitespace-nowrap">₹{row.returnAmountReceived}</span>,
      },
      { key: "supplierName", header: "Supplier Name" },
      { key: "supplierAddress", header: "Address" },
      {
        key: "invoiceDate",
        header: "Invoice Date",
        cell: (row) =>
          new Date(row.invoiceDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      },
      { key: "paymentStatus", header: "Payment Status" },
      {
        key: "productCode",
        header: "Product Code",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => item.productCode || "—")),
      },
      {
        key: "productName",
        header: "Product Name",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => item.productName || "—")),
      },
      {
        key: "sizeName",
        header: "Size",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => item.sizeName || "—")),
      },
      {
        key: "colorName",
        header: "Color",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => item.colorName || "—")),
      },
      {
        key: "brandName",
        header: "Brand",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => item.brandName || "—")),
      },
      {
        key: "quantity",
        header: "Quantity",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => `${item.quantity} ${item.unit}`)),
      },
      {
        key: "purchaseAmount",
        header: "Purchase Amount",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => `₹${item.purchaseAmount}`)),
      },
      {
        key: "totalPurchaseAmount",
        header: "Total Purchase Amount",
        cell: (row) =>
          renderStackedValues((row.items || []).map((item) => `₹${item.totalPurchaseAmount}`)),
      },
    ],
    [],
  );

  const actions = useMemo<DataTableAction<SupplierReturn>[]>(
    () => [
      { label: <Eye size={16} />, onClick: setViewing, title: "View" },
      {
        label: <Pencil size={16} />,
        onClick: (row) => navigate(`/returns/supplier/${row.id}/edit`),
        title: "Edit",
      },
      {
        label: <Trash2 size={16} />,
        onClick: setPendingDelete,
        title: "Delete",
        className: "text-red-600 hover:bg-red-50",
      },
    ],
    [navigate],
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
            <h2 className="mt-1 text-2xl font-bold text-secondary">Supplier Return</h2>
          </div>
        </div>
        <Button onClick={() => navigate("/returns/supplier/new")}>+ Add Supplier Return</Button>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        loading={loading}
        actions={actions}
        emptyMessage="No supplier returns found."
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Supplier Return Details"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-3 text-sm text-secondary">
            <p><span className="font-semibold">Purchase Number:</span> {viewing.purchaseNumber || "Manual"}</p>
            <p><span className="font-semibold">Supplier:</span> {viewing.supplierName}</p>
            <p><span className="font-semibold">Address:</span> {viewing.supplierAddress}</p>
            <p><span className="font-semibold">Invoice Date:</span> {new Date(viewing.invoiceDate).toLocaleDateString("en-IN")}</p>
            <p><span className="font-semibold">Payment Status:</span> {viewing.paymentStatus}</p>
            <p><span className="font-semibold">Return Amount Received:</span> ₹{viewing.returnAmountReceived}</p>
            <p><span className="font-semibold">Purchase Products:</span> {formatProducts(viewing.items || [])}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Supplier Return"
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
          Are you sure you want to delete this supplier return entry?
        </p>
      </Modal>
    </>
  );
};
