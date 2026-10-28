"use strict";
const $ = (id) => document.getElementById(id);
const authClient = window.centralSAC;
if (!authClient)
  $("form-feedback").textContent =
    "Não foi possível iniciar a conexão. Atualize a página.";
const recoveryForm = $("recovery-form");
const loginForm = $("login-form");
const recoveryFeedback = $("recovery-feedback");
let recoveryMode = new URLSearchParams(location.hash.slice(1)).get("type") === "recovery" ||
  new URLSearchParams(location.search).get("type") === "recovery";
function showRecovery() {
  recoveryMode = true;
  loginForm.hidden = true;
  recoveryForm.hidden = false;
  recoveryFeedback.textContent = "Informe sua nova senha.";
}
if (recoveryMode) showRecovery();
if (authClient) authClient.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") showRecovery();
});
(async () => {
  if (!authClient || recoveryMode) return;
  const { data: { user } } = await authClient.auth.getUser();
  if (recoveryMode || !user) return;
  const { data: profile } = await authClient.from("app_profiles")
    .select("active").eq("user_id", user.id).maybeSingle();
  if (!recoveryMode && profile?.active) location.replace("dashboard.html");
})();
recoveryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = $("new-password").value;
  const confirmation = $("confirm-password").value;
  if (password.length < 12) {
    recoveryFeedback.textContent = "A senha precisa ter pelo menos 12 caracteres.";
    return;
  }
  if (password !== confirmation) {
    recoveryFeedback.textContent = "As senhas não coincidem.";
    return;
  }
  const button = recoveryForm.querySelector('button[type="submit"]');
  button.disabled = true;
  recoveryFeedback.textContent = "Atualizando senha...";
  try {
    const { data: { session } } = await authClient.auth.getSession();
    if (!session) throw new Error("Link inválido ou expirado. Solicite um novo e-mail.");
    const { error } = await authClient.auth.updateUser({ password });
    if (error) throw error;
    await authClient.auth.signOut();
    history.replaceState(null, "", location.pathname);
    recoveryFeedback.textContent = "Senha alterada com sucesso. Faça login com a nova senha.";
    $("new-password").value = "";
    $("confirm-password").value = "";
    recoveryMode = false;
    recoveryForm.hidden = true;
    loginForm.hidden = false;
    $("form-feedback").textContent = "Senha atualizada! Entre com sua nova senha.";
  } catch (error) {
    recoveryFeedback.textContent = error.message || "Não foi possível alterar a senha.";
  } finally { button.disabled = false; }
});
try {
  const saved = localStorage.getItem("alcans-usuario");
  if (saved) {
    $("usuario").value = saved;
    $("lembrar").checked = true;
  }
} catch (_) {}
$("toggle-password").addEventListener("click", () => {
  const field = $("senha"),
    show = field.type === "password";
  field.type = show ? "text" : "password";
  $("toggle-password").textContent = show ? "◌" : "◉";
  $("toggle-password").setAttribute(
    "aria-label",
    show ? "Ocultar senha" : "Mostrar senha",
  );
});
$("forgot-password").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = $("usuario").value.trim();
  if (!email) {
    $("form-feedback").textContent =
      "Informe seu e-mail para recuperar a senha.";
    return;
  }
  if (!authClient) return;
  const feedback = $("form-feedback");
  const link = $("forgot-password");
  link.style.pointerEvents = "none";
  feedback.textContent = "Solicitando recuperação...";
  try {
    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("index.html", location.href).href,
    });
    if (error) {
      console.error("Falha na recuperação de senha:", error);
      const code = error.code || "";
      const message = error.message || "Erro desconhecido";
      if (error.status === 429 || /rate.limit|too.many/i.test(code + " " + message)) {
        feedback.textContent = "Limite de tentativas de envio atingido. Aguarde alguns minutos e tente novamente.";
      } else if (/redirect|url.not.allowed/i.test(code + " " + message)) {
        feedback.textContent = "Endereço de retorno não autorizado no Supabase. Verifique Authentication → URL Configuration.";
      } else {
        feedback.textContent = `Supabase: ${message}${code ? " (" + code + ")" : ""}`;
      }
    } else {
      feedback.textContent = "Se a conta existir, você receberá instruções por e-mail.";
    }
  } catch (error) {
    console.error("Erro de rede na recuperação de senha:", error);
    feedback.textContent = "Falha de conexão com o Supabase. Verifique a rede e tente novamente.";
  } finally {
    link.style.pointerEvents = "";
  }
});
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!authClient) return;
  const email = $("usuario").value.trim().toLowerCase(),
    password = $("senha").value;
  const button = document.querySelector(".submit-button");
  button.disabled = true;
  $("form-feedback").textContent = "Verificando credenciais...";
  try {
    const { error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      $("form-feedback").textContent =
        "E-mail ou senha inválidos, ou conta não confirmada.";
      return;
    }
    try {
      if ($("lembrar").checked) localStorage.setItem("alcans-usuario", email);
      else localStorage.removeItem("alcans-usuario");
    } catch (_) {}
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const { data: profile } = await authClient
      .from("app_profiles")
      .select("active")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.active) {
      await authClient.auth.signOut();
      $("form-feedback").textContent =
        "Conta sem acesso ativo. Procure a administração.";
      return;
    }
    location.replace("dashboard.html");
  } catch (_) {
    $("form-feedback").textContent = "Não foi possível conectar ao servidor.";
  } finally {
    button.disabled = false;
  }
});
// Constelações discretas preservadas da tela original.
const canvas = document.getElementById("constellations"),
  ctx = canvas.getContext("2d"),
  reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let points = [],
  w = 0,
  h = 0,
  frame = 0;
function resize() {
  const rect = canvas.getBoundingClientRect(),
    dpr = Math.min(devicePixelRatio || 1, 2);
  w = rect.width;
  h = rect.height;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  points = Array.from(
    { length: Math.min(55, Math.max(24, Math.floor((w * h) / 14000))) },
    () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.3 + 0.7,
      orange: Math.random() < 0.38,
    }),
  );
  draw();
}
function draw() {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!reduceMotion) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let j = i + 1; j < points.length; j++) {
      const q = points[j],
        dist = Math.hypot(p.x - q.x, p.y - q.y);
      if (dist < 125) {
        ctx.strokeStyle = `rgba(255,101,0,${(1 - dist / 125) * 0.18})`;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = p.orange ? "rgba(255,110,28,.85)" : "rgba(240,243,249,.85)";
    ctx.shadowColor = p.orange ? "#ff6500" : "#fff";
    ctx.shadowBlur = p.orange ? 9 : 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (!reduceMotion) frame = requestAnimationFrame(draw);
}
window.addEventListener("resize", () => {
  cancelAnimationFrame(frame);
  resize();
});
resize();
