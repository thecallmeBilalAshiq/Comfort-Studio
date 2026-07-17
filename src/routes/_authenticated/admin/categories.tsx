import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListCategories, adminUpsertCategory, adminDeleteCategory } from "@/lib/admin.functions";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const categoriesQuery = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: () => adminListCategories(),
});

export const Route = createFileRoute("/_authenticated/admin/categories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  head: () => ({ meta: [{ title: "Categories — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
});

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function CategoriesPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  async function onDelete(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Products in it won't be deleted but will lose their category.`)) return;
    try {
      await adminDeleteCategory({ data: { id: c.id } });
      await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sofas, chairs, tables, almirahs — add any category you sell.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.image_url && <img src={c.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <div className="font-medium">{c.name}</div>
                      {c.description && <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
                <td className="px-4 py-3">{c.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(c as Category)} className="rounded p-2 hover:bg-secondary" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(c as Category)} className="rounded p-2 text-destructive hover:bg-destructive/10" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No categories yet. Add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <CategoryDialog
          category={editing ?? undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
            setEditing(null); setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({ category, onClose, onSaved }: { category?: Category; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpsertCategory({
        data: {
          id: category?.id,
          name,
          slug: slug || slugify(name),
          description: description || null,
          image_url: imageUrl || null,
          sort_order: Number(sortOrder) || 0,
        },
      });
      toast.success(category ? "Category updated" : "Category created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-md border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">{category ? "Edit category" : "New category"}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Name *</span>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!category && !slug) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Sofas, Chairs, Tables, Almirahs"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Slug *</span>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="sofas"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Image URL</span>
            <input
              value={imageUrl ?? ""}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Sort order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? "Saving…" : category ? "Save changes" : "Create category"}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
