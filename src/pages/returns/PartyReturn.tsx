import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, useToast } from "../../components/ui";
import { DataTable, type DataTableAction, type DataTableColumn } from "../../components/table";
import { partyReturnApi } from "../../services/party-return.api";
import type { PartyReturn } from "../../types/product.types";

const formatProducts = (items: PartyReturn["items"]) =>
  items?.length
    ? items.map((item) => `${item.productCode} (${item.quantity} ${item.unit})`).join(", ")
    : "—";

export const PartyReturnPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<PartyReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<PartyReturn | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartyReturn | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setItems(await partyReturnApi.list());
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
      {
        label: <Pencil size={16} />,
        onClick: (row) => navigate(`/returns/party/${row.id}/edit`),
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
            <h2 className="mt-1 text-2xl font-bold text-secondary">Party Return</h2>
          </div>
        </div>
        <Button onClick={() => navigate("/returns/party/new")}>+ Add Party Return</Button>
      </div>

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
