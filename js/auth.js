"use strict";
window.SAC = {
  client: window.centralSAC,
  base: new URL("../", document.currentScript.src),
};
window.SAC.route = location.pathname.includes("/administracao/")
  ? "administracao"
  : "inicio";
window.SAC.check = async function () {
  const c = SAC.client,
    loading = document.getElementById("auth-loading");
  if (!c) {
    loading.textContent = "Não foi possível conectar ao Supabase.";
    return null;
  }
  try {
    const {
      data: { user },
      error,
    } = await c.auth.getUser();
    if (error || !user) {
      location.replace(SAC.base.href + "index.html");
      return null;
    }
    const { data: profile, error: pe } = await c
      .from("app_profiles")
      .select("display_name,active,role_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (pe || !profile?.active) {
      await c.auth.signOut();
      location.replace(SAC.base.href + "index.html");
      return null;
    }
    const checks = await Promise.all(
      ["dashboard.view", "users.view", "roles.manage", "results.import"].map(
        (required_code) => c.rpc("app_has_permission", { required_code }),
      ),
    );
    const [canDashboard, canUsers, canRoles, canImport] = checks.map((r) =>
      r.error ? false : r.data === true,
    );
    const required =
      SAC.route === "administracao"
        ? canUsers || canRoles || canImport
        : canDashboard;
    if (!required) {
      loading.textContent = "Você não tem permissão para acessar esta página.";
      return null;
    }
    const context = {
      user,
      profile,
      canDashboard,
      canUsers,
      canRoles,
      canImport,
      client: c,
    };
    SAC.context = context;
    document.getElementById("app-view").hidden = false;
    loading.hidden = true;
    document.dispatchEvent(new CustomEvent("sac:ready", { detail: context }));
    return context;
  } catch (e) {
    loading.textContent =
      "Não foi possível validar seu acesso. Tente atualizar a página.";
    return null;
  }
};
SAC.client?.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") location.replace(SAC.base.href + "index.html");
});
