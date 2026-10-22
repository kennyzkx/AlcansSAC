"use strict";
const $ = (id) => document.getElementById(id);
function numeric(v) {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}
function integer(v) {
  return Math.max(0, Math.round(numeric(v)));
}
function percent(v) {
  return String(v || "—");
}
function shortName(name) {
  const words = String(name || "Atendente")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return words.length
    ? words[0][0].toUpperCase() + words[0].slice(1)
    : "Atendente";
}
function renderAgent(r, user, profile) {
  r = r || {};
  const fullName = profile?.display_name || user.email.split("@")[0];
  const name = shortName(fullName);
  $("greeting-name").textContent = name;
  $("top-user").textContent = name;
  const initials = fullName.split(/\s+/).filter(Boolean);
  $("avatar").textContent =
    (initials[0]?.[0] || "A") + (initials.at(-1)?.[0] || "T");
  $("metric-fcr").textContent = percent(r["% FCR"]);
  $("metric-prod").textContent = r.Produtividade
    ? Number(String(r.Produtividade).replace(",", ".")).toLocaleString(
        "pt-BR",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      )
    : "—";
  $("metric-tma").textContent = r.TMA || "—";
  $("metric-ctr").textContent = r.Total ?? "—";
  $("metric-satisfaction").textContent = r["% Satisfeito"] || "—";
  $("metric-range").textContent = r["Faixa Produtividade SAC"] || "—";
  const voice = integer(r.Voice),
    wa = integer(r.Whatsapp),
    web = integer(r.Webchat),
    email = integer(r.Email),
    sum = voice + wa + web + email;
  $("voice-count").textContent = voice;
  $("whatsapp-count").textContent = wa;
  $("webchat-count").textContent = web;
  $("email-count").textContent = email;
  $("classified-total").textContent = sum;
  $("voice-detail").textContent = voice;
  $("messages-detail").textContent = wa + web + email;
  const colors = ["#ff6500", "#2b87fa", "#76b9f6", "#8997a9"];
  let start = 0;
  const parts = [];
  [voice, wa, web, email].forEach((n, i) => {
    if (!n || !sum) return;
    const end = start + (100 * n) / sum;
    parts.push(`${colors[i]} ${start.toFixed(3)}% ${end.toFixed(3)}%`);
    start = end;
  });
  $("donut").style.background = sum
    ? `conic-gradient(${parts.join(",")})`
    : "#273442";
  const diff = integer(r.Total) - sum;
  $("channel-note").textContent = !r.Total
    ? "Aguardando indicadores vinculados à sua conta."
    : diff === 0
      ? "A soma dos canais corresponde ao Total do BI."
      : `O Total do BI é ${r.Total}, mas a soma dos canais é ${sum} (diferença de ${Math.abs(diff)}). Valores originais preservados.`;
}

function updateClock() {
  const now = new Date();
  $("today-date").textContent = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
  }).format(now);
  $("today-clock").textContent = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
function secondsToTime(seconds) {
  if (seconds == null) return null;
  const s = Math.round(seconds);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
}
function getPeriod() {
  const now = new Date();
  return (
    String(now.getFullYear()) +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0")
  );
}
document.addEventListener(
  "sac:ready",
  async ({ detail: { user, profile, client } }) => {
    updateClock();
    setInterval(updateClock, 1000);
    const gestor = Number(profile?.role_id) === 1;
    const selector = $("gestor-agent-select"), filter = $("gestor-agent-filter"), feedback = $("gestor-agent-feedback");
    let requestId = 0;
    if (gestor) {
      filter.hidden = false;
      const {data,error} = await client.rpc("sac_gestor_agents",{p_period:getPeriod()});
      if(error){feedback.textContent="Não foi possível listar os colaboradores.";console.error(error);}
      else for(const agent of data?.agents || []){
        const option=document.createElement("option");
        option.value=agent.user_id;option.textContent=agent.name || "Colaborador";selector.appendChild(option);
      }
      selector.addEventListener("change",()=>load());
    }
    async function load() {
      const thisRequest=++requestId;
      const selectedId=gestor ? selector.value : "";
      if(gestor){selector.disabled=true;feedback.textContent="Carregando indicadores...";}

      try {
        const period = getPeriod();
        const { data, error } = selectedId
          ? await client.rpc("sac_gestor_agent_metrics",{p_period:period,p_user_id:selectedId})
          : await client.rpc("sac_dashboard",{p_period:period});
        if(thisRequest!==requestId)return;
        if (error) throw error;
        const m = data.metrics || {};
        const tma = secondsToTime(m.tma_seconds);
        const r = m.contributors
          ? {
              Total: m.total,
              Voice: m.voice,
              Whatsapp: m.whatsapp,
              Webchat: m.webchat,
              Email: 0,
              TMA: tma,
              Produtividade: m.produtividade,
              "% FCR": m.fcr == null ? null : m.fcr + "%",
              "% Satisfeito": m.satisfacao == null ? null : m.satisfacao + "%",
              "Faixa Produtividade SAC": selectedId ? (m.faixa_produtividade || "—") : "—",
            }
          : null;
        renderAgent(r, user, profile);
        const pending = (data.islands || [])
          .filter((i) => i.period !== period)
          .map((i) => i.name);
        const [year, month] = period.split("-");
        $("data-source").textContent =
          "Competência " +
          monthNames[Number(month) - 1] +
          "/" +
          year +
          " • " +
          (selectedId ? "Resultados de " + (data.name || selector.selectedOptions[0]?.textContent || "colaborador") : (m.contributors || 0) + " colaboradores") +
          (pending.length
            ? " • Ilhas fora do período (não incluídas): " + pending.join(", ")
            : "");
        if (!selectedId && m.contributors && $("metric-prod"))
          $("metric-range").textContent = "Consolidado";
        if(gestor)feedback.textContent="";
      } catch (e) {
        if(thisRequest!==requestId)return;
        console.error(e);
        $("data-source").textContent =
          "Não foi possível carregar os resultados: " + e.message;
        renderAgent(null, user, profile);
        if(gestor)feedback.textContent="Falha ao carregar.";
      } finally {
        if(thisRequest===requestId && gestor)selector.disabled=false;
      }
    }
    await load();
  },
);
