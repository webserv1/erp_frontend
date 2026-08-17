import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, useToast } from "../../components/ui";
import { Input } from "../../components/forms";
import { DataTable, type DataTableColumn } from "../../components/table";
import { stockApi } from "../../services/stock.api";
import type { Stock } from "../../types/product.types";

const names = (items: { name: string }[]) =>
  items.map((item) => item.name).join(", ") || "-";
const currency = (amount: number) => `₹${amount}`;

export const StockMaster = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    let cancelled = false;
    stockApi
      .list()
      .then((data) => {
        if (!cancelled) setStocks(data.stock);
      })
      .catch((error) => {
        if (!cancelled)
          toast({
            title: "Failed to load stock",
            description: error.message,
            variant: "error",
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filteredStocks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stocks;
    return stocks.filter((stock) =>
      `${stock.productCode} ${stock.productName} ${names(stock.brands)} ${names(stock.colors)} ${names(stock.sizes)}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, stocks]);
  const rows = filteredStocks.slice((page - 1) * limit, page * limit);

  const columns: DataTableColumn<Stock>[] = [
    { key: "productCode", header: "Product Code" },
    { key: "productName", header: "Product Name" },
    { key: "brand", header: "Brand", cell: (stock) => names(stock.brands) },
    { key: "color", header: "Color", cell: (stock) => names(stock.colors) },
    { key: "size", header: "Size", cell: (stock) => names(stock.sizes) },
    { key: "qtyIn", header: "Qty In" },
    { key: "qtyOut", header: "Qty Out" },
    { key: "balanceStock", header: "Balance Stock" },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      cell: (stock) => currency(stock.purchasePrice),
    },
    {
      key: "salePrice",
      header: "Sales Price",
      cell: (stock) => currency(stock.salePrice),
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <p className="text-sm font-semibold text-primary-dark">STOCK</p>
          <h2 className="mt-1 text-2xl font-bold text-secondary">
            Stock Master
          </h2>
        </div>
      </div>
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
            placeholder="Search stock"
            className="pl-9"
          />
        </div>
      </Card>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(stock) => stock.id}
        loading={loading}
        emptyMessage="No stock entries found."
        pagination={{
          page,
          totalPages: Math.max(1, Math.ceil(filteredStocks.length / limit)),
          total: filteredStocks.length,
          limit,
          onPageChange: setPage,
          onLimitChange: (value) => {
            setLimit(value);
            setPage(1);
          },
        }}
      />
    </>
  );
};
