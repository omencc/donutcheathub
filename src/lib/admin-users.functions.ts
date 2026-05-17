import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) throw new Error(authErr.message);

    const emailMap = new Map(authList.users.map((u) => [u.id, u.email ?? ""]));
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    return (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? "",
      roles: roleMap.get(p.id) ?? ["user"],
    }));
  });

export const updateUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      userId: z.string().uuid(),
      email: z.string().email().max(255).optional(),
      password: z.string().min(6).max(72).optional(),
      username: z.string().min(2).max(32).regex(/^[a-z0-9_]+$/i).optional(),
      display_name: z.string().min(1).max(64).optional(),
      banned: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const authPatch: { email?: string; password?: string } = {};
    if (data.email) authPatch.email = data.email;
    if (data.password) authPatch.password = data.password;
    if (authPatch.email || authPatch.password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ...authPatch,
        email_confirm: !!authPatch.email,
      });
      if (error) throw new Error(error.message);
    }

    const profilePatch: { username?: string; display_name?: string; banned?: boolean } = {};
    if (data.username !== undefined) profilePatch.username = data.username.toLowerCase();
    if (data.display_name !== undefined) profilePatch.display_name = data.display_name;
    if (data.banned !== undefined) profilePatch.banned = data.banned;
    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabaseAdmin.from("profiles").update(profilePatch).eq("id", data.userId);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "moderator", "user"]),
      grant: z.boolean(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own admin role");
    }
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete yourself");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
