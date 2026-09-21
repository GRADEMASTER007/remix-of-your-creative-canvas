import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PLAN_LIMITS,
  deleteProduct,
  getMyOrders,
  getMyProducts,
  getMyStore,
  saveMyStore,
  saveProduct,
  setOrderStatus,
} from "@/lib/seller.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — Living Culture Health" },
      {
        name: "description",
        content:
          "Upload products, manage stock and track orders for your African heritage store.",
      },
      { property: "og:title", content: "Seller dashboard — Living Culture Health" },
      {
        property: "og:description",
        content: "Upload products, manage stock and track orders for your heritage store.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CATEGORIES = ["foods", "baking", "medicinals", "art"] as const;
const money = (cents: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);

type ProductRow = {
  id: string;
  title: string;
  category: (typeof CATEGORIES)[number];
  description: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  is_published: boolean;
};

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchStore = useServerFn(getMyStore);
  const fetchProducts = useServerFn(getMyProducts);
  const fetchOrders = useServerFn(getMyOrders);

  const storeQ = useQuery({ queryKey: ["my-store"], queryFn: () => fetchStore() });
  const productsQ = useQuery({
    queryKey: ["my-products"],
    queryFn: () => fetchProducts(),
    enabled: !!storeQ.data,
  });
  const ordersQ = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
    enabled: !!storeQ.data,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const store = storeQ.data;
  const products = (productsQ.data ?? []) as unknown as ProductRow[];
  const limit = store ? PLAN_LIMITS[store.plan] : 0;

  return (
    <main className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link to="/" className="font-display text-2xl uppercase text-primary">
            Living Culture Health
          </Link>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {storeQ.isLoading ? (
          <p className="text-muted-foreground">Loading your store…</p>
        ) : !store ? (
          <StoreForm onSaved={() => qc.invalidateQueries()} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-5xl uppercase text-foreground">{store.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {store.tagline || "Your heritage store"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="uppercase">
                  {store.plan} plan
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {products.length} / {limit} products
                </span>
              </div>
            </div>

            <Tabs defaultValue="products" className="mt-8">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="store">Store profile</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-6">
                <ProductsPanel products={products} limit={limit} loading={productsQ.isLoading} />
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <OrdersPanel rows={(ordersQ.data ?? []) as OrderRow[]} loading={ordersQ.isLoading} />
              </TabsContent>

              <TabsContent value="store" className="mt-6">
                <StoreForm store={store} onSaved={() => qc.invalidateQueries()} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}

type StoreRow = {
  id: string;
  name: string;
  tagline: string | null;
  story: string | null;
  region: string | null;
  logo_url: string | null;
  plan: "starter" | "heritage";
};

function StoreForm({ store, onSaved }: { store?: StoreRow; onSaved: () => void }) {
  const save = useServerFn(saveMyStore);
  const [form, setForm] = useState({
    name: store?.name ?? "",
    tagline: store?.tagline ?? "",
    story: store?.story ?? "",
    region: store?.region ?? "",
    logo_url: store?.logo_url ?? "",
    plan: store?.plan ?? ("starter" as const),
  });

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name,
        tagline: store.tagline ?? "",
        story: store.story ?? "",
        region: store.region ?? "",
        logo_url: store.logo_url ?? "",
        plan: store.plan,
      });
    }
  }, [store]);

  const mutation = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success(store ? "Store updated" : "Store created");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
      {!store && (
        <h2 className="mb-4 font-display text-3xl uppercase text-foreground">
          Create your store
        </h2>
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="name">Store name</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            placeholder="e.g. Limpopo, South Africa"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="logo">Logo image URL</Label>
          <Input
            id="logo"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="story">Your story</Label>
          <Textarea
            id="story"
            rows={4}
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
          />
        </div>
        <div>
          <Label>Plan</Label>
          <Select
            value={form.plan}
            onValueChange={(v) => setForm({ ...form, plan: v as "starter" | "heritage" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter — 20 products</SelectItem>
              <SelectItem value="heritage">Heritage — 100 products</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : store ? "Save changes" : "Create store"}
        </Button>
      </form>
    </div>
  );
}

function ProductsPanel({
  products,
  limit,
  loading,
}: {
  products: ProductRow[];
  limit: number;
  loading: boolean;
}) {
  const qc = useQueryClient();
  const remove = useServerFn(deleteProduct);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Product removed");
      qc.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const atLimit = products.length >= limit;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-3xl uppercase text-foreground">Your products</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={atLimit} onClick={() => setEditing(null)}>
              Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editing}
              onDone={() => {
                setOpen(false);
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["my-products"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {atLimit && (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          You've reached your plan limit of {limit} products. Upgrade your plan to list more.
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">No products yet — add your first one.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="h-40 w-full object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <Badge variant={p.is_published ? "default" : "secondary"}>
                    {p.is_published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {p.category}
                </p>
                <p className="mt-2 font-display text-2xl text-primary">{money(p.price_cents)}</p>
                <p className="text-sm text-muted-foreground">{p.stock} in stock</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => del.mutate(p.id)}
                    disabled={del.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onDone,
}: {
  product: ProductRow | null;
  onDone: () => void;
}) {
  const save = useServerFn(saveProduct);
  const [form, setForm] = useState({
    title: product?.title ?? "",
    category: product?.category ?? ("foods" as ProductRow["category"]),
    description: product?.description ?? "",
    price: product ? (product.price_cents / 100).toString() : "",
    stock: product ? product.stock.toString() : "10",
    image_url: product?.image_url ?? "",
    is_published: product?.is_published ?? true,
  });

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(product ? { id: product.id } : {}),
          title: form.title,
          category: form.category,
          description: form.description,
          price_cents: Math.round(Number(form.price || 0) * 100),
          stock: Number(form.stock || 0),
          image_url: form.image_url,
          is_published: form.is_published,
        },
      }),
    onSuccess: () => {
      toast.success(product ? "Product updated" : "Product added");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm({ ...form, category: v as ProductRow["category"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (ZAR)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            required
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="published"
          checked={form.is_published}
          onCheckedChange={(v) => setForm({ ...form, is_published: v })}
        />
        <Label htmlFor="published">Visible in the marketplace</Label>
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : product ? "Save changes" : "Add product"}
      </Button>
    </form>
  );
}

type OrderRow = {
  id: string;
  reference: string;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  total_cents: number;
  payment_method: string;
  status: "awaiting_payment" | "paid" | "cancelled";
  created_at: string;
  products: { title: string } | null;
};

function OrdersPanel({ rows, loading }: { rows: OrderRow[]; loading: boolean }) {
  const qc = useQueryClient();
  const update = useServerFn(setOrderStatus);
  const mutation = useMutation({
    mutationFn: (v: { id: string; status: OrderRow["status"] }) => update({ data: v }),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <p className="text-muted-foreground">Loading orders…</p>;
  if (rows.length === 0)
    return <p className="text-muted-foreground">No orders yet. They'll appear here.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="p-3">Reference</th>
            <th className="p-3">Product</th>
            <th className="p-3">Buyer</th>
            <th className="p-3">Total</th>
            <th className="p-3">Payment</th>
            <th className="p-3">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{o.reference}</td>
              <td className="p-3">
                {o.products?.title ?? "—"} × {o.quantity}
              </td>
              <td className="p-3">
                <div>{o.buyer_name}</div>
                <div className="text-xs text-muted-foreground">{o.buyer_email}</div>
              </td>
              <td className="p-3">{money(o.total_cents)}</td>
              <td className="p-3 capitalize">{o.payment_method.replace("_", " ")}</td>
              <td className="p-3">
                <Badge
                  variant={
                    o.status === "paid"
                      ? "default"
                      : o.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {o.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="p-3">
                {o.status === "awaiting_payment" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => mutation.mutate({ id: o.id, status: "paid" })}
                      disabled={mutation.isPending}
                    >
                      Mark paid
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => mutation.mutate({ id: o.id, status: "cancelled" })}
                      disabled={mutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
