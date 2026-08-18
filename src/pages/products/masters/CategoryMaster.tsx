import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, Button, Modal } from "../../../components/ui";
import {
  FormField,
  Input,
  Select,
  MultiSelect,
} from "../../../components/forms";
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "../../../components/table";
import { productApi } from "../../../services/product.api";
import type {
  Category,
  Brand,
  Color,
  Size,
} from "../../../types/product.types";

type UnitType = "PIECES" | "DOZEN";
type MasterStatus = "ACTIVE" | "INACTIVE";

type FormState = {
  name: string;
  unit: UnitType;
  quantity: string;
  purchaseAmount: string;
  saleAmount: string;
  status: MasterStatus;
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  newBrands: string[];
  newColors: string[];
  newSizes: string[];
};

const emptyForm: FormState = {
  name: "",
  unit: "PIECES",
  quantity: "",
  purchaseAmount: "",
  saleAmount: "",
  status: "ACTIVE",
  brandIds: [],
  colorIds: [],
  sizeIds: [],
  newBrands: [],
  newColors: [],
  newSizes: [],
};

const categoryPresets = ["Top", "Jeans", "Shorts", "Kurta", "Mix"];
const unitOptions = [
  { value: "PIECES", label: "Pieces" },
  { value: "DOZEN", label: "Dozen" },
];

const brandPresets = ["Sqars"];
const colorPresets = [
  "Red",
  "Blue",
  "Yellow",
  "Green",
  "Black",
  "White",
  "Multicolor",
  "Mix",
];
const sizePresets = [
  "ALL",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "Mix",
];

type NewMasterField = "newBrands" | "newColors" | "newSizes";

const emptyNewMasterDrafts: Record<NewMasterField, string> = {
  newBrands: "",
  newColors: "",
  newSizes: "",
};

const toOptions = (
  items: Array<{ id: number; name: string }>,
  presets: string[],
  startId = -1,
): Array<{ id: number; name: string }> => {
  const map = new Map<number, { id: number; name: string }>();
  presets.forEach((name, idx) =>
    map.set(startId - idx, { id: startId - idx, name }),
  );
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

export const CategoryMaster = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newMasterDrafts, setNewMasterDrafts] = useState(emptyNewMasterDrafts);
  const { toast } = useToast();
  const navigate = useNavigate();

  const brandOptions = toOptions(
    Object.values(
      items.reduce<Record<number, Brand>>((acc, cat) => {
        cat.brands?.forEach((b) => {
          acc[b.id] = b;
        });
        return acc;
      }, {}),
    ),
    brandPresets,
  );
  const colorOptions = toOptions(
    Object.values(
      items.reduce<Record<number, Color>>((acc, cat) => {
        cat.colors?.forEach((c) => {
          acc[c.id] = c;
        });
        return acc;
      }, {}),
    ),
    colorPresets,
  );
  const sizeOptions = toOptions(
    Object.values(
      items.reduce<Record<number, Size>>((acc, cat) => {
        cat.sizes?.forEach((s) => {
          acc[s.id] = s;
        });
        return acc;
      }, {}),
    ),
    sizePresets,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productApi.categories.list();
      setItems(data);
    } catch (err) {
      toast({
        title: "Failed to load categories",
        description: (err as Error).message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setNewMasterDrafts(emptyNewMasterDrafts);
    setOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditing(row);
    setForm({
      name: row.name,
      unit: row.unit || "PIECES",
      quantity: String(row.quantity ?? ""),
      purchaseAmount: String(row.purchaseAmount ?? ""),
      saleAmount: String(row.saleAmount ?? ""),
      status: row.status ? "ACTIVE" : "INACTIVE",
      brandIds: row.brands?.map((b) => b.id) || [],
      colorIds: row.colors?.map((c) => c.id) || [],
      sizeIds: row.sizes?.map((s) => s.id) || [],
      newBrands: [],
      newColors: [],
      newSizes: [],
    });
    setNewMasterDrafts(emptyNewMasterDrafts);
    setOpen(true);
  };

  type CategoryPayload = {
    name: string;
    unit: UnitType;
    quantity: number;
    purchaseAmount: number;
    saleAmount: number;
    status: boolean;
    brands?: string[];
    colors?: string[];
    sizes?: string[];
    brandIds?: number[];
    colorIds?: number[];
    sizeIds?: number[];
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const realBrandIds = form.brandIds.filter((id) => id > 0);
      const realColorIds = form.colorIds.filter((id) => id > 0);
      const realSizeIds = form.sizeIds.filter((id) => id > 0);

      const presetBrandNames = form.brandIds
        .filter((id) => id < 0)
        .map((id) => brandOptions.find((o) => o.id === id)?.name)
        .filter((name): name is string => Boolean(name));
      const presetColorNames = form.colorIds
        .filter((id) => id < 0)
        .map((id) => colorOptions.find((o) => o.id === id)?.name)
        .filter((name): name is string => Boolean(name));
      const presetSizeNames = form.sizeIds
        .filter((id) => id < 0)
        .map((id) => sizeOptions.find((o) => o.id === id)?.name)
        .filter((name): name is string => Boolean(name));

      const payload: CategoryPayload = {
        name: form.name,
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        purchaseAmount: Number(form.purchaseAmount) || 0,
        saleAmount: Number(form.saleAmount) || 0,
        status: form.status === "ACTIVE",
      };

      const allBrands = [
        ...form.newBrands,
        newMasterDrafts.newBrands.trim(),
        ...presetBrandNames,
      ].filter(Boolean);
      const allColors = [
        ...form.newColors,
        newMasterDrafts.newColors.trim(),
        ...presetColorNames,
      ].filter(Boolean);
      const allSizes = [
        ...form.newSizes,
        newMasterDrafts.newSizes.trim(),
        ...presetSizeNames,
      ].filter(Boolean);

      if (allBrands.length) payload.brands = allBrands;
      if (allColors.length) payload.colors = allColors;
      if (allSizes.length) payload.sizes = allSizes;

      if (realBrandIds.length) payload.brandIds = realBrandIds;
      if (realColorIds.length) payload.colorIds = realColorIds;
      if (realSizeIds.length) payload.sizeIds = realSizeIds;

      if (editing) {
        await productApi.categories.update(editing.id, payload);
        toast({ title: "Category updated", variant: "success" });
      } else {
        await productApi.categories.create(payload);
        toast({ title: "Category created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({
        title: editing ? "Update failed" : "Creation failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const remove = async (row: Category) => {
    try {
      await productApi.categories.remove(row.id);
      toast({
        title: "Category deleted",
        variant: "success",
        description: `Category "${row.name}" has been deleted.`,
      });
      load();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  const addNewItem = (type: NewMasterField) => {
    const name = newMasterDrafts[type].trim();
    if (!name) return;

    setForm((f) => ({
      ...f,
      [type]: f[type].some(
        (item) => item.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
        ? f[type]
        : [...f[type], name],
    }));
    setNewMasterDrafts((drafts) => ({ ...drafts, [type]: "" }));
  };

  const removeNewItem = (type: NewMasterField, index: number) => {
    setForm((f) => ({ ...f, [type]: f[type].filter((_, i) => i !== index) }));
  };

  const columns: DataTableColumn<Category>[] = [
    { key: "id", header: "ID", width: "80px" },
    { key: "name", header: "Category Name" },
    {
      key: "brands",
      header: "Brands",
      width: "160px",
      cell: (row) =>
        row.brands?.length ? row.brands.map((b) => b.name).join(", ") : "—",
    },
    {
      key: "colors",
      header: "Colors",
      width: "160px",
      cell: (row) =>
        row.colors?.length ? row.colors.map((c) => c.name).join(", ") : "—",
    },
    {
      key: "sizes",
      header: "Sizes",
      width: "160px",
      cell: (row) =>
        row.sizes?.length ? row.sizes.map((s) => s.name).join(", ") : "—",
    },
    {
      key: "unit",
      header: "Unit",
      width: "100px",
      cell: (row) => row.unit || "PIECES",
    },
    {
      key: "quantity",
      header: "Quantity",
      width: "100px",
      cell: (row) => row.quantity ?? "—",
    },
    {
      key: "purchaseAmount",
      header: "Purchase Amount",
      width: "140px",
      cell: (row) => (row.purchaseAmount ? `₹${row.purchaseAmount}` : "—"),
    },
    {
      key: "saleAmount",
      header: "Sale Amount",
      width: "140px",
      cell: (row) => (row.saleAmount ? `₹${row.saleAmount}` : "—"),
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

  const actions: DataTableAction<Category>[] = [
    { label: "Edit", onClick: openEdit },
    {
      label: "Delete",
      onClick: remove,
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  const renderNewItems = (
    type: NewMasterField,
    title: string,
    items: string[],
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-secondary capitalize">
        {title}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder={`Add new ${title.slice(3, -1)} name`}
          value={newMasterDrafts[type]}
          onChange={(event) =>
            setNewMasterDrafts((drafts) => ({
              ...drafts,
              [type]: event.target.value,
            }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNewItem(type);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => addNewItem(type)}
        >
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary-dark"
            >
              {item}
              <button
                type="button"
                onClick={() => removeNewItem(type, index)}
                className="rounded-full hover:bg-primary/20"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

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
            <p className="text-sm font-semibold text-primary-dark">
              PRODUCT MASTERS
            </p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              Categories
            </h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Category</Button>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No categories found."
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Category" : "Add Category"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="category-form">
              Save
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} className="space-y-4">
          <FormField label="Category Name" required>
            <input
              list="category-presets"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </FormField>
          <datalist id="category-presets">
            {categoryPresets.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unit" required>
              <Select
                required
                value={form.unit}
                onChange={(e) =>
                  setForm({ ...form, unit: e.target.value as UnitType })
                }
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Quantity">
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </FormField>
            <FormField label="Purchase Amount">
              <Input
                type="number"
                value={form.purchaseAmount}
                onChange={(e) =>
                  setForm({ ...form, purchaseAmount: e.target.value })
                }
              />
            </FormField>
            <FormField label="Sale Amount">
              <Input
                type="number"
                value={form.saleAmount}
                onChange={(e) =>
                  setForm({ ...form, saleAmount: e.target.value })
                }
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as MasterStatus })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>

          <div className="space-y-4">
            <FormField label="Brands">
              <MultiSelect
                options={brandOptions}
                value={form.brandIds}
                onChange={(brandIds) =>
                  setForm({ ...form, brandIds: brandIds as number[] })
                }
                placeholder="Select existing brands"
              />
            </FormField>
            {renderNewItems("newBrands", "New Brands", form.newBrands)}

            <FormField label="Colors">
              <MultiSelect
                options={colorOptions}
                value={form.colorIds}
                onChange={(colorIds) =>
                  setForm({ ...form, colorIds: colorIds as number[] })
                }
                placeholder="Select existing colors"
              />
            </FormField>
            {renderNewItems("newColors", "New Colors", form.newColors)}

            <FormField label="Sizes">
              <MultiSelect
                options={sizeOptions}
                value={form.sizeIds}
                onChange={(sizeIds) =>
                  setForm({ ...form, sizeIds: sizeIds as number[] })
                }
                placeholder="Select existing sizes"
              />
            </FormField>
            {renderNewItems("newSizes", "New Sizes", form.newSizes)}
          </div>
        </form>
      </Modal>
    </>
  );
};
