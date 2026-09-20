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
const formatQtyCompact = (value: number) => {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const dozens = Math.floor(absolute / 12);
  const pieces = absolute % 12;
  return {
    total: `${sign}${absolute} pc`,
    split: `${sign}${dozens} dz${pieces ? ` ${pieces} pc` : ""}`,
  };
};
const priceChangeBadge = (
  latestPrice: number,
  previousPrice: number,
): { label: string; className: string } => {
  const diff = latestPrice - previousPrice;
  if (diff > 0) {
    return {
      label: `↑ +${currency(diff)}`,
      className: "bg-red-100 text-red-700",
    };
  }
  if (diff < 0) {
    return {
      label: `↓ ${currency(diff)}`,
      className: "bg-green-100 text-green-700",
    };
  }
  return {
    label: "→ No change",
    className: "bg-gray-100 text-gray-700",
  };
};

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
    {
      key: "qtyIn",
      header: "Total Qty In",
      cell: (stock) => {
        const formatted = formatQtyCompact(stock.qtyIn);
        return (
          <div className="leading-tight">
            <div>{stock.qtyInUnitDisplay || formatted.total}</div>
          </div>
        );
      },
    },
    {
      key: "latestQtyIn",
      header: "New Qty In",
      cell: (stock) => {
        const latest = stock.latestQtyIn || 0;
        const formatted = formatQtyCompact(latest);
        return (
          <div className="leading-tight">
            <div>{stock.latestQtyInUnitDisplay || formatted.total}</div>
            {stock.previousQtyInUnitDisplay && (
              <div className="text-xs text-text-secondary">
                Prev: {stock.previousQtyInUnitDisplay}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "qtyOut",
      header: "Qty Out",
      cell: (stock) => {
        const formatted = formatQtyCompact(stock.qtyOut);
        return (
          <div className="leading-tight">
            <div>{stock.qtyOutUnitDisplay || formatted.total}</div>
          </div>
        );
      },
    },
    {
      key: "balanceStock",
      header: "Balance Stock",
      cell: (stock) => {
        const formatted = formatQtyCompact(stock.balanceStock);
        return (
          <div className="leading-tight">
            <div>{formatted.total}</div>
            <div className="text-xs text-text-secondary">{formatted.split}</div>
          </div>
        );
      },
    },
    {
      key: "purchasePrice",
      header: "Last Purchase Price",
      cell: (stock) => {
        const latest = stock.latestPurchasePrice ?? stock.purchasePrice;
        const previous = stock.previousPurchasePrice;
        const badge =
          previous !== null && previous !== undefined
            ? priceChangeBadge(latest, previous)
            : null;
        return (
          <div className="leading-tight">
            <div>{currency(latest)}</div>
            {previous !== null && previous !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-text-secondary">
                  Prev: {currency(previous)}
                </span>
                {badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
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
