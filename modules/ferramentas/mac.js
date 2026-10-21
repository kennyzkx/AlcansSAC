/* Alcans | Consulta de MAC. API pública + cache local, sem servidor próprio. */
"use strict";
(()=>{
 const STORE="alcans.mac.cache.v1",LIMIT=120;
 // Fallback restrito: prefixos demonstrativos; não substitui uma base OUI completa.
 const fallback={"000000":{company:"XEROX CORPORATION",country:"US",blockType:"MA-L"},"001A2B":{company:"Ayecom Technology Co., Ltd.",country:"TW",blockType:"MA-L"}};
 const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const normalize=s=>String(s).replace(/[\s:.-]/g,"").toUpperCase();
 const format=s=>s.match(/.{1,2}/g)?.join(":")||s;
 function getCache(){try{return JSON.parse(localStorage.getItem(STORE)||"{}")}catch{return {}}}
 function putCache(key,result){try{const cache=getCache();cache[key]={result,time:Date.now()};const keys=Object.keys(cache).sort((a,b)=>cache[a].time-cache[b].time);while(keys.length>LIMIT)delete cache[keys.shift()];localStorage.setItem(STORE,JSON.stringify(cache))}catch{}}
 function mount(root,heading){
   heading("Consulta de MAC","Identifique o fabricante registrado de um endereço MAC ou prefixo OUI.");
   root.innerHTML=`<section class="tool-panel mac-panel">
    <div class="tool-panel-heading"><div><h2>Identificação de fabricante</h2><p>Consulta pública com histórico local para acesso rápido, sem servidor próprio.</p></div><span class="tool-pill">REDE / DIAGNÓSTICO</span></div>
    <form id="mac-form" class="mac-form"><label for="mac-address">Endereço MAC ou prefixo OUI</label><div class="mac-input-row"><input id="mac-address" autocomplete="off" spellcheck="false" placeholder="Ex.: 00:1A:2B:3C:4D:5E" maxlength="24" required><button class="tool-primary" type="submit" id="mac-submit">Consultar MAC</button></div><p class="tool-hint">Aceita AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, AABB.CCDD.EEFF ou os 6 primeiros dígitos.</p></form>
    <div id="mac-status" class="mac-status" role="status" aria-live="polite">Digite um MAC para começar.</div>
    <div id="mac-result" hidden></div>
   </section><section class="tool-panel"><div class="tool-panel-heading"><div><h2>Consultas recentes</h2><p>Resultados salvos neste navegador para reutilização sem conexão.</p></div><button id="mac-clear" class="tool-secondary" type="button">Limpar histórico</button></div><div id="mac-history" class="mac-history"></div></section>
   <p class="tool-hint mac-disclaimer">O fabricante informado é o titular do bloco de endereços. A consulta não identifica necessariamente o modelo, o proprietário ou a localização do equipamento. A API externa recebe o MAC consultado quando usada.</p>`;
   const $=id=>root.querySelector("#"+id),status=$("mac-status"),result=$("mac-result"),field=$("mac-address"),submit=$("mac-submit");
   function history(){const entries=Object.entries(getCache()).sort((a,b)=>b[1].time-a[1].time).slice(0,8);$("mac-history").innerHTML=entries.length?entries.map(([k,v])=>`<button class="mac-history-item" type="button" data-mac="${escape(k)}"><span>${escape(format(k))}</span><strong>${escape(v.result.company||"Sem fabricante")}</strong></button>`).join(""):'<p class="tool-hint">Nenhuma consulta salva ainda.</p>';$("mac-history").querySelectorAll("[data-mac]").forEach(b=>b.onclick=()=>{field.value=format(b.dataset.mac);$("mac-form").requestSubmit()})}
   function show(data,key,source){const company=data.found===false?"Não encontrado":data.company||"Não informado";result.hidden=false;result.innerHTML=`<div class="mac-result-top"><div><span class="tool-section-caption">FABRICANTE REGISTRADO</span><h3>${escape(company)}</h3><p>${escape(format(key))}</p></div><span class="mac-source">${escape(source)}</span></div><div class="mac-details"><div><span>Prefixo identificado</span><strong>${escape(data.macPrefix||key.slice(0,6))}</strong></div><div><span>País</span><strong>${escape(data.country||"Não informado")}</strong></div><div><span>Tipo de bloco</span><strong>${escape(data.blockType||"Não informado")}</strong></div><div><span>Atualização do registro</span><strong>${escape(data.updated||"Não informado")}</strong></div></div>${data.address?`<p class="mac-address-note"><b>Endereço cadastrado:</b> ${escape(data.address)}</p>`:""}<button type="button" class="tool-secondary" id="mac-copy">Copiar fabricante</button>`;result.querySelector("#mac-copy").onclick=async()=>{try{await navigator.clipboard.writeText(company);status.textContent="Fabricante copiado."}catch{status.textContent="Não foi possível copiar automaticamente."}}}
   $("mac-form").onsubmit=async e=>{
     e.preventDefault();const key=normalize(field.value);
     if(!/^[0-9A-F]{6}$|^[0-9A-F]{12}$/.test(key)){status.textContent="Informe um MAC completo (12 dígitos) ou prefixo OUI (6 dígitos) válido.";result.hidden=true;return}
     field.value=format(key);const cache=getCache()[key]||getCache()[key.slice(0,6)];
     submit.disabled=true;status.textContent="Consultando fabricante...";
     try{
       // A API macadress publica Access-Control-Allow-Origin: * e pode ser usada no GitHub Pages.
       const response=await fetch("https://api.macadress.com/v1/vendor/"+encodeURIComponent(key),{signal:AbortSignal.timeout(9000)});
       if(response.status===404){
         result.hidden=true;status.textContent="Prefixo não registrado ou endereço MAC local/aleatório. Nenhum fabricante público identificado.";return;
       }
       if(response.status===429)throw Error("Limite gratuito da API atingido. Tente novamente mais tarde.");
       if(!response.ok)throw Error("Erro HTTP "+response.status+" ao consultar a API.");
       const company=(await response.text()).trim();
       if(!company||company.startsWith("*")){
         result.hidden=true;status.textContent="Nenhum fabricante público encontrado.";return;
       }
       const data={found:true,company,macPrefix:key.slice(0,6)};
       show(data,key,"Consulta online");putCache(key,data);
       status.textContent="Consulta concluída.";history();
     }catch(err){
       if(cache){show(cache.result,key,"Cache local");status.textContent="API indisponível. Resultado recuperado do histórico deste navegador."}
       else if(fallback[key.slice(0,6)]){const data={...fallback[key.slice(0,6)],found:true,macPrefix:key.slice(0,6)};show(data,key,"Base local de exemplo");status.textContent="API indisponível. Resultado da base local limitada."}
       else{result.hidden=true;status.textContent="Consulta online indisponível: "+(err?.message||"falha de rede ou CORS")+". Nenhum resultado local para este prefixo."}
     }finally{submit.disabled=false}
   };
   $("mac-clear").onclick=()=>{try{localStorage.removeItem(STORE)}catch{}history();status.textContent="Histórico local apagado."};
   history();
 }
 window.AlcansMac={mount};
})();
