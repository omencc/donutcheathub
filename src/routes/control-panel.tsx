import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listAdminUsers, updateUserAdmin, setUserRole, deleteUserAdmin } from "@/lib/admin-users.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Pencil, Pin, Flame, Megaphone, Flag, Users, BarChart3, Tag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/control-panel")({
  head: () => ({ meta: [{ title: "Admin · DonutVault" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Checking access…</div>;
  if (!user) return null;
  if (!isAdmin) return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass-strong rounded-2xl p-10 max-w-md text-center">
        <Shield className="h-10 w-10 text-destructive mx-auto" />
        <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is restricted.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center"><Shield className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <h1 className="text-3xl font-bold neon-text">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage DonutVault</p>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="glass">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="cheats">Cheats</TabsTrigger>
            <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-1" />Categories</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 mr-1" />News</TabsTrigger>
            <TabsTrigger value="reports"><Flag className="h-4 w-4 mr-1" />Reports</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><Overview /></TabsContent>
          <TabsContent value="cheats"><ManageCheats /></TabsContent>
          <TabsContent value="categories"><ManageCategories /></TabsContent>
          <TabsContent value="announcements"><ManageAnnouncements /></TabsContent>
          <TabsContent value="reports"><ManageReports /></TabsContent>
          <TabsContent value="users"><ManageUsers /></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-strong rounded-xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold neon-text">{value}</div>
    </div>
  );
}

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [cheats, reviews, users, reports, downloads] = await Promise.all([
        supabase.from("cheats").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("cheats").select("downloads"),
      ]);
      const totalDl = (downloads.data ?? []).reduce((s, c: any) => s + (c.downloads ?? 0), 0);
      return { cheats: cheats.count ?? 0, reviews: reviews.count ?? 0, users: users.count ?? 0, reports: reports.count ?? 0, downloads: totalDl };
    },
  });
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
      <Stat label="Cheats" value={data?.cheats ?? 0} />
      <Stat label="Total downloads" value={(data?.downloads ?? 0).toLocaleString()} />
      <Stat label="Reviews" value={data?.reviews ?? 0} />
      <Stat label="Users" value={data?.users ?? 0} />
      <Stat label="Open reports" value={data?.reports ?? 0} />
    </div>
  );
}

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function ManageCheats() {
  const qc = useQueryClient();
  const { data: cheats } = useQuery({
    queryKey: ["admin-cheats"],
    queryFn: async () => (await supabase.from("cheats").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm("Delete this cheat?")) return;
    const { error } = await supabase.from("cheats").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-cheats"] }); }
  };
  const togglePin = async (c: any) => {
    await supabase.from("cheats").update({ pinned: !c.pinned }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["admin-cheats"] });
  };
  const toggleFeatured = async (c: any) => {
    await supabase.from("cheats").update({ featured: !c.featured }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["admin-cheats"] });
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Cheats</h2>
        <CheatDialog categories={categories ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-cheats"] })} />
      </div>
      <div className="glass-strong rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50"><tr className="text-left text-xs uppercase text-muted-foreground"><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">MC</th><th className="p-3">DL</th><th className="p-3">Flags</th><th className="p-3"></th></tr></thead>
          <tbody>
            {(cheats ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{c.title}<div className="text-xs text-muted-foreground">{c.slug}</div></td>
                <td className="p-3 text-muted-foreground">{c.categories?.name ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{c.mc_version ?? "—"}</td>
                <td className="p-3">{c.downloads}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => togglePin(c)} className={`p-1.5 rounded ${c.pinned ? "bg-primary text-primary-foreground" : "bg-secondary"}`}><Pin className="h-3 w-3" /></button>
                    <button onClick={() => toggleFeatured(c)} className={`p-1.5 rounded ${c.featured ? "bg-accent text-accent-foreground" : "bg-secondary"}`}><Flame className="h-3 w-3" /></button>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <CheatDialog categories={categories ?? []} initial={c} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-cheats"] })} />
                    <Button variant="ghost" size="sm" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {(cheats?.length ?? 0) === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No cheats yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheatDialog({ categories, initial, onSaved }: { categories: any[]; initial?: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    short_description: initial?.short_description ?? "",
    long_description: initial?.long_description ?? "",
    installation: initial?.installation ?? "",
    category_id: initial?.category_id ?? "",
    mc_version: initial?.mc_version ?? "",
    thumbnail_url: initial?.thumbnail_url ?? "",
    download_url: initial?.download_url ?? "",
    tags: (initial?.tags ?? []).join(", "),
    featured: initial?.featured ?? false,
    pinned: initial?.pinned ?? false,
  });

  const save = async () => {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      category_id: form.category_id || null,
    };
    const { error } = initial
      ? await supabase.from("cheats").update(payload).eq("id", initial.id)
      : await supabase.from("cheats").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); setOpen(false); onSaved(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial ? <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button> : <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0"><Plus className="h-4 w-4 mr-1" />New cheat</Button>}
      </DialogTrigger>
      <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit cheat" : "New cheat"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Field label="Slug (auto)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <div className="col-span-2"><Field label="Short description" value={form.short_description} onChange={(v) => setForm({ ...form, short_description: v })} /></div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Long description</label>
            <Textarea rows={4} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} className="bg-input/60" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Installation instructions</label>
            <Textarea rows={3} value={form.installation} onChange={(e) => setForm({ ...form, installation: e.target.value })} className="bg-input/60" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full h-10 px-2 rounded-lg bg-input/60 border border-border">
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field label="MC version" value={form.mc_version} onChange={(v) => setForm({ ...form, mc_version: v })} />
          <Field label="Thumbnail URL" value={form.thumbnail_url} onChange={(v) => setForm({ ...form, thumbnail_url: v })} />
          <Field label="Download URL" value={form.download_url} onChange={(v) => setForm({ ...form, download_url: v })} />
          <div className="col-span-2"><Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pinned</label>
        </div>
        <Button onClick={save} className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}

function ManageCategories() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [desc, setDesc] = useState("");
  const add = async () => {
    const { error } = await supabase.from("categories").insert({ name, slug: slug || slugify(name), description: desc });
    if (error) toast.error(error.message); else { setName(""); setSlug(""); setDesc(""); qc.invalidateQueries({ queryKey: ["categories"] }); }
  };
  const del = async (id: string) => { await supabase.from("categories").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["categories"] }); };
  return (
    <div className="mt-6 space-y-4">
      <div className="glass-strong rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Slug" value={slug} onChange={setSlug} />
        <Field label="Description" value={desc} onChange={setDesc} />
        <Button onClick={add} className="self-end bg-primary text-primary-foreground">Add</Button>
      </div>
      <div className="glass-strong rounded-xl divide-y divide-border/60">
        {(data ?? []).map((c: any) => (
          <div key={c.id} className="p-3 flex items-center justify-between">
            <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.slug}</div></div>
            <Button variant="ghost" size="sm" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageAnnouncements() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-announcements"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [pinned, setPinned] = useState(false);
  const { user } = useAuth();
  const add = async () => {
    const { error } = await supabase.from("announcements").insert({ title, body, pinned, author_id: user!.id });
    if (error) toast.error(error.message); else { setTitle(""); setBody(""); setPinned(false); qc.invalidateQueries({ queryKey: ["admin-announcements"] }); }
  };
  return (
    <div className="mt-6 space-y-4">
      <div className="glass-strong rounded-xl p-4 space-y-2">
        <Field label="Title" value={title} onChange={setTitle} />
        <div><label className="text-xs text-muted-foreground">Body</label><Textarea value={body} onChange={(e) => setBody(e.target.value)} className="bg-input/60" rows={3} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to top</label>
        <Button onClick={add} className="bg-primary text-primary-foreground">Post</Button>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((a: any) => (
          <div key={a.id} className="glass-strong rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div><div className="font-semibold">{a.title}</div><div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div></div>
              <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); qc.invalidateQueries({ queryKey: ["admin-announcements"] }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageReports() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-reports"], queryFn: async () => (await supabase.from("reports").select("*").order("created_at", { ascending: false })).data ?? [] });
  const setStatus = async (id: string, status: "open" | "reviewing" | "resolved" | "dismissed") => { await supabase.from("reports").update({ status }).eq("id", id); qc.invalidateQueries({ queryKey: ["admin-reports"] }); };
  return (
    <div className="mt-6 space-y-3">
      {(data?.length ?? 0) === 0 && <div className="glass rounded-xl p-10 text-center text-muted-foreground">No reports.</div>}
      {(data ?? []).map((r: any) => (
        <div key={r.id} className="glass-strong rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{r.target_type} · <span className={r.status === "open" ? "text-accent" : "text-muted-foreground"}>{r.status}</span></div>
              <div className="font-medium mt-1">{r.reason}</div>
              {r.details && <div className="text-sm text-muted-foreground mt-1">{r.details}</div>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "resolved")}>Resolve</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "dismissed")}>Dismiss</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ManageUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const fetchUsers = useServerFn(listAdminUsers);
  const updateFn = useServerFn(updateUserAdmin);
  const roleFn = useServerFn(setUserRole);
  const deleteFn = useServerFn(deleteUserAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const toggleAdmin = async (u: any) => {
    const isAdmin = u.roles.includes("admin");
    try {
      await roleFn({ data: { userId: u.id, role: "admin", grant: !isAdmin } });
      toast.success(isAdmin ? "Admin removed" : "Admin granted");
      invalidate();
    } catch (e: any) { toast.error(e.message); }
  };
  const toggleBan = async (u: any) => {
    try { await updateFn({ data: { userId: u.id, banned: !u.banned } }); toast.success("Updated"); invalidate(); }
    catch (e: any) { toast.error(e.message); }
  };
  const remove = async (u: any) => {
    if (!confirm(`Delete ${u.username}? This cannot be undone.`)) return;
    try { await deleteFn({ data: { userId: u.id } }); toast.success("Deleted"); invalidate(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-6 glass-strong rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50"><tr className="text-left text-xs uppercase text-muted-foreground">
          <th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Roles</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
        </tr></thead>
        <tbody>
          {isLoading && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Loading…</td></tr>}
          {(data ?? []).map((u: any) => (
            <tr key={u.id} className="border-t border-border/60">
              <td className="p-3">{u.display_name ?? u.username}<div className="text-xs text-muted-foreground">@{u.username}</div></td>
              <td className="p-3 text-muted-foreground">{u.email}</td>
              <td className="p-3">
                <div className="flex gap-1 flex-wrap">
                  {u.roles.map((r: string) => (
                    <span key={r} className={`px-2 py-0.5 rounded text-xs ${r === "admin" ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary text-muted-foreground"}`}>{r}</span>
                  ))}
                </div>
              </td>
              <td className="p-3">{u.banned ? <span className="text-destructive">Banned</span> : <span className="text-accent">Active</span>}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-1 flex-wrap">
                  <EditUserDialog user={u} onSaved={invalidate} />
                  <Button size="sm" variant="outline" onClick={() => toggleAdmin(u)} disabled={u.id === me?.id}>
                    {u.roles.includes("admin") ? "Revoke admin" : "Make admin"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleBan(u)}>{u.banned ? "Unban" : "Ban"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(u)} disabled={u.id === me?.id}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {!isLoading && (data?.length ?? 0) === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No users.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function EditUserDialog({ user, onSaved }: { user: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: user.email, username: user.username, display_name: user.display_name ?? "", password: "" });
  const updateFn = useServerFn(updateUserAdmin);
  const save = async () => {
    const payload: any = { userId: user.id };
    if (form.email && form.email !== user.email) payload.email = form.email;
    if (form.username && form.username !== user.username) payload.username = form.username;
    if (form.display_name !== (user.display_name ?? "")) payload.display_name = form.display_name;
    if (form.password) payload.password = form.password;
    try { await updateFn({ data: payload }); toast.success("Saved"); setOpen(false); onSaved(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button></DialogTrigger>
      <DialogContent className="glass-strong">
        <DialogHeader><DialogTitle>Edit @{user.username}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
          <Field label="Display name" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
          <div>
            <label className="text-xs text-muted-foreground">New password (leave blank to keep)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <Button onClick={save} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
