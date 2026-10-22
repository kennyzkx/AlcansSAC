/* Alcans — Consulta de CNPJ e QSA. Dados via Edge Function autenticada. */
"use strict";
(()=>{
 const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const digits=s=>String(s||"").replace(/\D/g,"");
 const mask=v=>v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*$/,"$1.$2.$3/$4-$5");
 const valid=v=>{
   if(v.length!==14||/^(\d)\1{13}$/.test(v))return false;
   const calc=(length,weights)=>{let sum=0;for(let i=0;i<weights.length;i++)sum+=Number(v[i])*weights[i];return sum%11<2?0:11-sum%11};
   return calc(12,[5,4,3,2,9,8,7,6,5,4,3,2])===+v[12]&&calc(13,[6,5,4,3,2,9,8,7,6,5,4,3,2])===+v[13];
 };
 function mount(root,heading){
   heading("Consulta CNPJ","Consulte os sócios e administradores cadastrados no QSA.");
   root.innerHTML=`<section class="tool-panel cnpj-panel">
    <div class="tool-panel-heading"><div><h2>Quadro de Sócios e Administradores</h2><p>Informe o CNPJ para visualizar o QSA da empresa.</p></div></div>
    <form id="cnpj-form" class="mac-form">
      <label for="cnpj-input">CNPJ</label>
      <div class="mac-input-row"><input id="cnpj-input" type="text" inputmode="numeric" autocomplete="off" maxlength="18" placeholder="00.000.000/0000-00" required aria-describedby="cnpj-status"><button class="tool-primary" type="submit" id="cnpj-submit">Consultar</button></div>
    </form>
    <div id="cnpj-status" class="mac-status" role="status" aria-live="polite"></div>
    <div id="cnpj-result" hidden></div>
   </section>`;
   const input=root.querySelector("#cnpj-input"),form=root.querySelector("#cnpj-form"),status=root.querySelector("#cnpj-status"),result=root.querySelector("#cnpj-result"),btn=root.querySelector("#cnpj-submit");
   input.addEventListener("input",()=>{const pos=digits(input.value).slice(0,14);input.value=pos.length>12?mask(pos):pos;result.hidden=true;status.textContent="";});
   form.addEventListener("submit",async e=>{
     e.preventDefault();
     const cnpj=digits(input.value);
     result.hidden=true;
     if(!valid(cnpj)){status.textContent="CNPJ inválido. Confira os 14 dígitos.";return;}
     btn.disabled=true;btn.textContent="Consultando...";status.textContent="Consultando QSA...";
     try{
       const {data,error}=await window.centralSAC.functions.invoke("consulta-cnpj-qsa",{body:{cnpj}});
       if(error){
         let message="Não foi possível consultar o CNPJ agora.";
         if(error.context&&typeof error.context.json==="function"){try{const body=await error.context.json();message=body.error||message;}catch{}}
         throw new Error(message);
       }
       if(!data||data.error)throw new Error(data?.error||"Resposta inválida da consulta.");
       const socios=Array.isArray(data.socios)?data.socios:[];
       result.innerHTML=`<div class="cnpj-company"><span class="tool-kicker">EMPRESA</span><h3>${escape(data.empresa||"Empresa não informada")}</h3><p>${escape(mask(cnpj))}</p></div>
       <div class="cnpj-qsa-title">Quadro de Sócios e Administradores</div>
       ${socios.length?`<div class="cnpj-qsa-list">${socios.map(s=>`<div class="cnpj-qsa-person"><strong>${escape(s.nome)}</strong><span>${escape(s.qualificacao)}</span></div>`).join("")}</div>`:'<p class="cnpj-empty">Nenhum integrante do QSA informado pela fonte consultada.</p>'}`;
       result.hidden=false;status.textContent="";
     }catch(err){status.textContent=err?.message||"Falha ao consultar CNPJ."}
     finally{btn.disabled=false;btn.textContent="Consultar";}
   });
 }
 window.AlcansCNPJ={mount};
})();
