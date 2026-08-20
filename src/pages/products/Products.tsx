import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, ImagePlus, Search, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast, Button, Card, Modal } from "../../components/ui";
import { FormField, Input, MultiSelect, Select } from "../../components/forms";
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "../../components/table";
import { productApi } from "../../services/product.api";
import type { Product } from "../../types/product.types";
import type { Brand, Category, Color, Size } from "../../types/product.types";

type FormState = {
  productCode: string;
  productName: string;
  categoryId: string;
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  gst: string;
  itemCode: string;
  purchasePrice: string;
  quantity: string;
  unit: "PIECES" | "DOZEN";
  status: boolean;
};

const emptyForm: FormState = {
  productCode: "",
  productName: "",
  categoryId: "",
  brandIds: [],
  colorIds: [],
  sizeIds: [],
  gst: "",
  itemCode: "",
  purchasePrice: "",
  quantity: "",
  unit: "PIECES",
  status: true,
};

const PRODUCT_CODE_REGEX = /^[A-Za-z]{3,}_[0-9]{5,}$/;

const unitOptions = [
  { value: "PIECES", label: "Pieces" },
  { value: "DOZEN", label: "Dozen" },
];

export const Products = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshingMasters, setRefreshingMasters] = useState(false);

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [productCodeError, setProductCodeError] = useState("");

  const selectedCategory = categories.find(
    (category) => category.id === Number(form.categoryId),
  );
  const brandOptions: Brand[] = selectedCategory?.brands ?? [];
  const colorOptions: Color[] = selectedCategory?.colors ?? [];
  const sizeOptions: Size[] = selectedCategory?.sizes ?? [];

  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const loadMasters = async () => {
      setRefreshingMasters(true);
      try {
        const data = await productApi.categories.list();
        if (!cancelled) {
          setCategories(data);
        }
      } catch {
        if (!cancelled)
          toast({ title: "Failed to load master data", variant: "error" });
      } finally {
        if (!cancelled) setRefreshingMasters(false);
      }
    };

    const loadProducts = async () => {
      try {
        const data = await productApi.products.list({
          search: search || undefined,
        });
        if (!cancelled) {
          setItems(data.products);
          setTotal(data.total ?? data.products.length);
        }
      } catch (err) {
        if (!cancelled)
          toast({
            title: "Failed to load products",
            description: (err as Error).message,
            variant: "error",
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMasters();
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [toast, search, location.pathname]);

  useEffect(() => {
    const handleFocus = async () => {
      setRefreshingMasters(true);
      try {
        const data = await productApi.categories.list();
        setCategories(data);
      } catch {
        toast({ title: "Failed to refresh master data", variant: "error" });
      } finally {
        setRefreshingMasters(false);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [toast]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setProductCodeError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateProductCode = (code: string, currentEditingId?: number) => {
    if (!code.trim()) {
      setProductCodeError("Product code is required");
      return false;
    }
    if (!PRODUCT_CODE_REGEX.test(code)) {
      setProductCodeError(
        "Format must be like abc_00001 (3+ letters, underscore, 5+ numbers)",
      );
      return false;
    }
    const exists = items.some(
      (p) =>
        p.productCode.toLowerCase() === code.toLowerCase() &&
        p.id !== currentEditingId,
    );
    if (exists) {
      setProductCodeError("Product code already exists");
      return false;
    }
    setProductCodeError("");
    return true;
  };

  const handleProductCodeChange = (value: string) => {
    setForm((f) => ({ ...f, productCode: value }));
    validateProductCode(value, editing?.id);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "error" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const openCreate = () => {
    resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (row: Product) => {
    setEditing(row);
    setForm({
      productCode: row.productCode,
      productName: row.productName,
      categoryId: String(row.categoryId),
      brandIds: row.brandIds,
      colorIds: row.colorIds,
      sizeIds: row.sizeIds,
      gst: row.gst,
      itemCode: row.itemCode,
      purchasePrice: String(row.purchasePrice ?? ""),
      quantity: String(row.quantity ?? ""),
      unit: row.unit || "PIECES",
      status: row.status,
    });
    setImageFile(null);
    setImagePreview(row.productImage || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.brandIds.length ||
      !form.colorIds.length ||
      !form.sizeIds.length
    ) {
      toast({
        title: "Select at least one brand, color, and size",
        variant: "error",
      });
      return;
    }
    if (!validateProductCode(form.productCode, editing?.id)) {
      toast({ title: "Invalid product code", variant: "error" });
      return;
    }
    try {
      const fd = new FormData();
      fd.append("productCode", form.productCode);
      fd.append("productName", form.productName);
      fd.append("categoryId", form.categoryId);
      form.brandIds.forEach((id) => fd.append("brandIds", String(id)));
      form.colorIds.forEach((id) => fd.append("colorIds", String(id)));
      form.sizeIds.forEach((id) => fd.append("sizeIds", String(id)));
      fd.append("gst", form.gst);
      fd.append("itemCode", form.itemCode);
      if (form.purchasePrice) fd.append("purchasePrice", form.purchasePrice);
      if (form.quantity) fd.append("quantity", form.quantity);
      fd.append("unit", form.unit);
      fd.append("status", String(form.status));
      if (imageFile) {
        fd.append("productImage", imageFile);
      }

      if (editing) {
        const { product } = await productApi.products.update(editing.id, fd);
        setItems((current) =>
          current.map((item) => (item.id === product.id ? product : item)),
        );
        toast({ title: "Product updated", variant: "success" });
      } else {
        const { product } = await productApi.products.create(fd);
        setItems((current) => [product, ...current]);
        setTotal((current) => current + 1);
        setPage(1);
        toast({ title: "Product created", variant: "success" });
      }
      resetForm();
    } catch (err) {
      toast({
        title: editing ? "Update failed" : "Creation failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const remove = async (row: Product) => {
    try {
      await productApi.products.remove(row.id);
      toast({ title: "Product deleted", variant: "success" });
      const data = await productApi.products.list();
      setItems(data.products);
      setTotal(data.total ?? data.products.length);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const toggleStatus = async (row: Product) => {
    try {
      const fd = new FormData();
      fd.append("status", String(!row.status));
      await productApi.products.update(row.id, fd);
      toast({
        title: `Product ${!row.status ? "activated" : "deactivated"}`,
        variant: "success",
      });
      const data = await productApi.products.list();
      setItems(data.products);
      setTotal(data.total ?? data.products.length);
    } catch (err) {
      toast({
        title: "Status update failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedItems = items.slice((page - 1) * limit, page * limit);

  const columns: DataTableColumn<Product>[] = [
    {
      key: "productImage",
      header: "Image",
      width: "80px",
      cell: (row) =>
        row.productImage ? (
          <img
            src={row.productImage}
            alt="product"
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
            No img
          </div>
        ),
    },
    { key: "productCode", header: "Code", width: "120px" },
    { key: "productName", header: "Product Name" },
    {
      key: "category",
      header: "Category",
      cell: (row) => row.category?.name || "—",
    },
    {
      key: "brand",
      header: "Brand",
      /* The legacy single-value cell is retained below for migration compatibility.
      cell: (row) => row.brand?.name || '—',
      */
      cell: (row) =>
        row.brands.map((brand) => (
          <span key={brand.id} className="block">
            {brand.name}
          </span>
        )),
    },
    {
      key: "color",
      header: "Color",
      /* The legacy single-value cell is retained below for migration compatibility.
      cell: (row) => row.color?.name || '—',
      */
      cell: (row) =>
        row.colors.map((color) => (
          <span key={color.id} className="block">
            {color.name}
          </span>
        )),
    },
    {
      key: "size",
      header: "Size",
      /* The legacy single-value cell is retained below for migration compatibility.
      cell: (row) => row.size?.name || '—',
      */
      cell: (row) =>
        row.sizes.map((size) => (
          <span key={size.id} className="block">
            {size.name}
          </span>
        )),
    },
    { key: "gst", header: "GST", width: "80px" },
    { key: "itemCode", header: "Item Code", width: "120px" },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      width: "120px",
      cell: (row) => `₹${row.purchasePrice ?? "—"}`,
    },
    {
      key: "quantity",
      header: "Quantity",
      width: "100px",
      cell: (row) => row.quantity ?? "—",
    },
    {
      key: "unit",
      header: "Unit",
      width: "100px",
      cell: (row) => row.unit || "—",
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      cell: (row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${row.status ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
        >
          {row.status ? "Active" : "Inactive"}
        </button>
      ),
    },
  ];

  const actions: DataTableAction<Product>[] = [
    { label: <Eye size={16} />, onClick: setViewing, title: "View" },
    { label: "Edit", onClick: openEdit },
    {
      label: "Delete",
      onClick: remove,
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/product-masters")}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">PRODUCTS</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              All Products
            </h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Product</Button>
      </div>

      <Card className="mb-6 p-6">
        <form id="product-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Product Code" required error={productCodeError}>
              <Input
                required
                value={form.productCode}
                onChange={(e) => handleProductCodeChange(e.target.value)}
                placeholder="e.g. ABC_00001"
              />
            </FormField>
            <FormField label="Product Name" required>
              <Input
                required
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
              />
            </FormField>
            <FormField label="GST">
              <Input
                value={form.gst}
                onChange={(e) => setForm({ ...form, gst: e.target.value })}
                placeholder="e.g. 18%"
              />
            </FormField>
            <FormField label="Item Code">
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.itemCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    itemCode: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </FormField>

            <FormField label="Category" required>
              <Select
                required
                value={form.categoryId}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  const category = categories.find(
                    (c) => c.id === Number(categoryId),
                  );
                  setForm({
                    ...form,
                    categoryId,
                    brandIds: [],
                    colorIds: [],
                    sizeIds: [],
                    purchasePrice:
                      category?.purchaseAmount != null
                        ? String(category.purchaseAmount)
                        : "",
                    quantity:
                      category?.quantity != null
                        ? String(category.quantity)
                        : "",
                    unit: category?.unit || "PIECES",
                  });
                }}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Brand" required>
              <MultiSelect
                options={brandOptions}
                value={form.brandIds}
                onChange={(value) =>
                  setForm({ ...form, brandIds: value.map(Number) })
                }
                placeholder="Select one or more brands"
                disabled={!form.categoryId}
              />
            </FormField>

            <FormField label="Color" required>
              <MultiSelect
                options={colorOptions}
                value={form.colorIds}
                onChange={(value) =>
                  setForm({ ...form, colorIds: value.map(Number) })
                }
                placeholder="Select one or more colors"
                disabled={!form.categoryId}
              />
            </FormField>

            <FormField label="Size" required>
              <MultiSelect
                options={sizeOptions}
                value={form.sizeIds}
                onChange={(value) =>
                  setForm({ ...form, sizeIds: value.map(Number) })
                }
                placeholder="Select one or more sizes"
                disabled={!form.categoryId}
              />
            </FormField>
            <FormField label="Purchase Price">
              <Input
                type="number"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Quantity">
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
              />
            </FormField>
            <FormField label="Unit">
              <Select
                value={form.unit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unit: e.target.value as "PIECES" | "DOZEN",
                  })
                }
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={18} />
              {imagePreview
                ? "Change Image"
                : "Upload Product Image (Optional)"}
            </Button>
            {imagePreview && (
              <div className="relative mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button type="submit" loading={loading}>
              {editing ? "Update Product" : "Submit Product"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <Input
              placeholder="Search products by name, code, or item code"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          {refreshingMasters && (
            <span className="text-xs text-text-secondary">
              Refreshing masters...
            </span>
          )}
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={paginatedItems}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No products found."
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
        title="Product Details"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span>Product Code</span>
            <span>{viewing.productCode}</span>
            <span>Product Name</span>
            <span>{viewing.productName}</span>
            <span>Category</span>
            <span>{viewing.category?.name || "—"}</span>
            <span>Brand</span>
            <span>
              {viewing.brands.map((item) => item.name).join(", ") || "—"}
            </span>
            <span>Color</span>
            <span>
              {viewing.colors.map((item) => item.name).join(", ") || "—"}
            </span>
            <span>Size</span>
            <span>
              {viewing.sizes.map((item) => item.name).join(", ") || "—"}
            </span>
            <span>GST</span>
            <span>{viewing.gst || "—"}</span>
            <span>Item Code</span>
            <span>{viewing.itemCode}</span>
            <span>Purchase Price</span>
            <span>₹{viewing.purchasePrice ?? "—"}</span>
            <span>Quantity</span>
            <span>
              {viewing.quantity ?? "—"} {viewing.unit || ""}
            </span>
            <span>Status</span>
            <span>{viewing.status ? "Active" : "Inactive"}</span>
          </div>
        )}
      </Modal>
    </>
  );
};
