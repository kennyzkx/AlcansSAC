"use strict";
(() => {
  let context = null;
  let busy = false;
  const history = [];
  const escape = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = document.createElement('section');
  el.className = 'alcans-ai';
  el.innerHTML = `<button type="button" class="alcans-ai-launch" aria-label="Abrir assistente Alcans" aria-expanded="false" title="Assistente Alcans"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 14 9l6 3-6 2-2 7-2-7-6-2 6-3 2-6Z"/><path d="M19 2v5M16.5 4.5h5"/></svg></button>
  <div class="alcans-ai-window" hidden role="dialog" aria-label="Assistente de atendimento Alcans">
    <header class="alcans-ai-header" title="Arraste para mover o chat"><div class="alcans-ai-brand"><span class="alcans-ai-star">✦</span><div><strong>AL · Assistente Alcans</strong><small>Seu apoio no atendimento humanizado</small></div></div><div class="alcans-ai-controls"><button type="button" class="alcans-ai-reset" title="Nova conversa" aria-label="Nova conversa">↻</button><button type="button" class="alcans-ai-close" title="Minimizar" aria-label="Minimizar">×</button></div></header>
    <div class="alcans-ai-messages" role="log" aria-live="polite" aria-relevant="additions"><div class="alcans-ai-intro"><span>✦</span><strong>Olá! Eu sou a AL. 🧡</strong><p>Sou sua assistente de atendimento da Alcans! Estou aqui para ajudar você a entender melhor cada situação, acolher o cliente e encontrar as palavras certas para uma conversa mais humana. Também posso indicar onde consultar os procedimentos no DOCS. Me conta: como posso ajudar no seu atendimento?</p></div></div>
    <form class="alcans-ai-form"><label class="alcans-ai-sr" for="alcans-ai-input">Mensagem ao assistente</label><textarea id="alcans-ai-input" rows="2" maxlength="1800" placeholder="Descreva a situação do cliente..."></textarea><button type="submit" class="alcans-ai-send" aria-label="Enviar mensagem">➤</button></form>
    <div class="alcans-ai-note">Não envie senhas, CPF ou dados sensíveis do cliente.</div>
  </div>`;
  document.body.appendChild(el);
  const launch=el.querySelector('.alcans-ai-launch'), win=el.querySelector('.alcans-ai-window'),header=el.querySelector('.alcans-ai-header'), messages=el.querySelector('.alcans-ai-messages'),form=el.querySelector('.alcans-ai-form'),input=el.querySelector('textarea'),send=el.querySelector('.alcans-ai-send');
  const open = () => {win.hidden=false;launch.setAttribute('aria-expanded','true');launch.classList.add('is-open');requestAnimationFrame(()=>input.focus());};
  const close = () => {win.hidden=true;launch.setAttribute('aria-expanded','false');launch.classList.remove('is-open');launch.focus();};
  launch.addEventListener('click',()=>win.hidden?open():close());
  el.querySelector('.alcans-ai-close').addEventListener('click',close);
  el.querySelector('.alcans-ai-reset').addEventListener('click',()=>{history.length=0;messages.innerHTML='<div class="alcans-ai-intro"><span>✦</span><strong>Olá novamente! Eu sou a AL. 🧡</strong><p>Vamos começar um novo atendimento? Me conte o que está acontecendo com o cliente. Posso sugerir uma resposta natural e orientar você até o procedimento certo no DOCS.</p></div>';input.focus();});
  function addMessage(role,text,links=[]) {
    const item=document.createElement('div');item.className='alcans-ai-message '+(role==='user'?'is-user':'is-assistant');
    const bubble=document.createElement('div');bubble.className='alcans-ai-bubble';bubble.textContent=text;item.append(bubble);
    if(role!=='user'&&text){const copy=document.createElement('button');copy.type='button';copy.className='alcans-ai-copy';copy.textContent='Copiar';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);copy.textContent='Copiado!';setTimeout(()=>copy.textContent='Copiar',1500);}catch{copy.textContent='Selecione o texto para copiar';}});item.append(copy);}
    for(const doc of links){if(!doc?.id||!doc?.title)continue;const b=document.createElement('button');b.type='button';b.className='alcans-ai-doc-link';b.textContent='📖 DOCS · '+doc.title;b.addEventListener('click',()=>{window.AlcansNavigate?.('procedimentos');window.AlcansDocs?.showArticle?.(doc.id);});item.append(b);}
    messages.append(item);messages.scrollTop=messages.scrollHeight;return item;
  }
  async function submit(){const text=input.value.trim();if(!text||busy||!context)return;busy=true;send.disabled=true;input.disabled=true;input.value='';messages.querySelector('.alcans-ai-intro')?.remove();addMessage('user',text);const wait=addMessage('assistant','Pensando na melhor abordagem...');
    try{
      const asksProcedure=/\b(procedimento|passo a passo|docs|como fazer|como realizar|onde encontro|onde consultar)\b/i.test(text);
      const wantsHuman=/insatisfeit|irritad|reclama|chatead|frustrad|nervos|brav|decepcionad|aborrecid|visita t[eé]cnica|humaniz|empati|acolh|como falar|como conversar|como abordar|como lidar/i.test(text);
      const humanOnly=wantsHuman&&!asksProcedure;
      const prompt=humanOnly?text+'\n\n[Orientação para AL: foque exclusivamente na escuta, em perguntar o que aconteceu e em uma mensagem pronta natural. NÃO mencione DOCS, procedimentos, descontos ou cancelamento se não forem pedidos.]':text;
      const payload=history.slice(-8).concat({role:'user',content:prompt});
      const {data,error}=await context.client.functions.invoke('alcans-ai',{body:{messages:payload}});
      if(error){let detail='Não foi possível consultar a IA agora.';try{const body=await error.context?.json();if(body?.error)detail=body.error;}catch{}throw new Error(detail);}
      if(!data?.reply)throw new Error(data?.error||'Resposta vazia. Tente novamente.');
      const cleanReply=humanOnly?data.reply.replace(/(?:^|\n)\s*(?:N[aã]o localizei|N[aã]o encontrei)[^\n]*DOCS[^\n]*/gi,'').trim():data.reply;
      wait.remove();addMessage('assistant',cleanReply,humanOnly?[]:(Array.isArray(data.docs)?data.docs:[]));
      history.push({role:'user',content:text},{role:'assistant',content:cleanReply});
    }catch(e){wait.remove();addMessage('assistant',e.message||'Erro ao consultar a IA.');}
    finally{busy=false;send.disabled=false;input.disabled=false;input.focus();}
  }
  form.addEventListener('submit',e=>{e.preventDefault();submit();});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();}});
  // Arrastar pela barra superior, sem interferir nos botões. Mantém posição ao navegar pelas abas.
  let drag=null;
  function clamp(x,y){const width=win.offsetWidth,height=win.offsetHeight;return {x:Math.max(8,Math.min(x,innerWidth-width-8)),y:Math.max(8,Math.min(y,innerHeight-height-8))};}
  function place(x,y){const p=clamp(x,y);win.style.left=p.x+'px';win.style.top=p.y+'px';win.style.right='auto';win.style.bottom='auto';}
  header.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button')||win.hidden)return;const rect=win.getBoundingClientRect();drag={x:e.clientX-rect.left,y:e.clientY-rect.top};header.setPointerCapture(e.pointerId);header.classList.add('dragging');});
  header.addEventListener('pointermove',e=>{if(!drag)return;place(e.clientX-drag.x,e.clientY-drag.y);});
  header.addEventListener('pointerup',e=>{if(!drag)return;drag=null;header.classList.remove('dragging');try{localStorage.setItem('alcans-ai-position',JSON.stringify({x:parseFloat(win.style.left),y:parseFloat(win.style.top)}));}catch{}});
  header.addEventListener('pointercancel',()=>{drag=null;header.classList.remove('dragging');});
  addEventListener('resize',()=>{if(win.style.left){const rect=win.getBoundingClientRect();place(rect.left,rect.top);}});
  try{const p=JSON.parse(localStorage.getItem('alcans-ai-position'));if(Number.isFinite(p?.x)&&Number.isFinite(p?.y))requestAnimationFrame(()=>place(p.x,p.y));}catch{}
  document.addEventListener('sac:ready',e=>{context=e.detail;});
})();
