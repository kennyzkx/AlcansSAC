'use strict';
/* CentralSAC: importar CSV por ilha. Adicione este script após admin.js na página da Administração. */
(() => {
  const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const importMount=document.getElementById('sac-import-mount');
  const islandsMount=document.getElementById('sac-islands-mount');
  if(!importMount||!islandsMount)return;
  islandsMount.innerHTML=`<div class="admin-heading"><div class="eyebrow">ORGANIZAÇÃO</div><h1>Configurar ilhas</h1><p>Vincule os colaboradores aos seus respectivos líderes.</p></div><div class="panel admin-card sac-import-card" id="sac-import-setup" hidden><h2>Estrutura das ilhas</h2><div class="sac-field"><label>Nome da ilha<input id="sac-island-name" placeholder="Ex.: Ilha 01"></label><button class="admin-button" id="sac-add-island" type="button">Criar ilha</button></div><div class="sac-field"><label>Ilha<select id="sac-setup-island"></select></label><label>Líder responsável<select id="sac-setup-leader"></select></label><button class="admin-button" id="sac-set-leader" type="button">Vincular líder</button></div><div class="sac-field"><label>Atendente<select id="sac-setup-agent"></select></label><label>Login mk no CSV<input id="sac-bi-login" placeholder="ex.: joao.silva"></label><button class="admin-button" id="sac-set-agent" type="button">Vincular atendente</button></div><div class="sac-island-list"><h3>Ilhas cadastradas</h3><div id="sac-island-list" aria-live="polite"></div></div><p id="sac-setup-status" class="admin-status" role="status"></p></div>`;
  importMount.innerHTML=`<div class="admin-heading"><div class="eyebrow">RESULTADOS DO BI</div><h1>Importar resultados</h1><p>Uma base ativa por ilha. A importação substitui integralmente os resultados anteriores.</p></div><div class="panel admin-card sac-import-card"><div class="sac-import-top"><div class="sac-import-symbol">⇧</div><div><h2>Atualizar indicadores</h2><p>Selecione a competência e o arquivo exportado do BI.</p></div></div><div class="sac-import-fields"><label>Ilha<select id="sac-import-island"></select></label><label>Mês de referência<select id="sac-month"></select></label></div><label class="sac-file-zone">Arquivo CSV do BI<input id="sac-file" type="file" accept=".csv,text/csv"></label><button class="admin-button" type="button" id="sac-preview">Conferir arquivo</button><div id="sac-preview-info" class="sac-preview" aria-live="polite"></div><button class="admin-button" type="button" id="sac-confirm" disabled>Confirmar substituição integral</button><p id="sac-import-status" class="admin-status" role="status"></p></div>`;
  const el=id=>document.getElementById(id);
  const msg=(id,text)=>{el(id).textContent=text;};
  const months=el('sac-month');const now=new Date();for(let y=now.getFullYear()-1;y<=now.getFullYear()+1;y++){monthNames.forEach((name,i)=>months.add(new Option(name+'/'+y,y+'-'+String(i+1).padStart(2,'0'))));}months.value='2026-10';
  let config=null,readyRows=null,readyIsland=null,readyPeriod=null;
  const call=async(fn,args={})=>{const {data,error}=await SAC.client.rpc(fn,args);if(error)throw new Error(error.message);return data;};
  function options(select,rows,label,value){select.replaceChildren();for(const r of rows)select.add(new Option(label(r),value(r)));}
  async function refresh(){config=await call('sac_import_config');options(el('sac-import-island'),config.islands,r=>`${r.name}${r.period?' — base '+r.period:''}`,r=>r.id);options(el('sac-setup-island'),config.islands,r=>r.name,r=>r.id);options(el('sac-setup-leader'),config.people.filter(p=>p.role==='Líder'),p=>p.name,p=>p.user_id);options(el('sac-setup-agent'),config.people.filter(p=>p.role==='Agente'),p=>p.name,p=>p.user_id);el('sac-import-setup').hidden=!config.is_gestor;el('sac-preview').disabled=!config.islands.length;
    const list=el('sac-island-list');list.replaceChildren();
    if(!config.islands.length){const empty=document.createElement('p');empty.textContent='Nenhuma ilha cadastrada.';list.append(empty);}
    for(const island of config.islands){
      const row=document.createElement('div');row.className='sac-island-row';
      const info=document.createElement('div');const title=document.createElement('strong');title.textContent=island.name;
      const meta=document.createElement('small');const members=config.members.filter(m=>String(m.island_id)===String(island.id)).length;
      meta.textContent=members+' colaborador(es) vinculado(s)'+(island.period?' • Base '+island.period:' • Sem base importada');info.append(title,meta);
      const button=document.createElement('button');button.type='button';button.className='sac-delete-island';button.textContent='Excluir ilha';
      button.disabled=members>0||!!island.period;button.title=button.disabled?'Para excluir, a ilha precisa estar sem colaboradores e sem resultados':'Excluir ilha vazia';
      button.addEventListener('click',async()=>{
        if(!window.confirm('Excluir definitivamente a ilha "'+island.name+'"? Esta ação não pode ser desfeita.'))return;
        button.disabled=true;
        try{await call('sac_delete_empty_island',{p_island_id:Number(island.id)});await refresh();msg('sac-setup-status','Ilha excluída com sucesso.');}
        catch(e){msg('sac-setup-status',e.message);button.disabled=false;}
      });row.append(info,button);list.append(row);
    }
  }
  function parseCSV(text){
    text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0];const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
    const rows=[];let cells=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===sep&&!quoted){cells.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;cells.push(cell);if(cells.some(x=>x.trim()))rows.push(cells);cells=[];cell='';}else cell+=c;}
    if(quoted)throw new Error('CSV contém aspas não fechadas.');cells.push(cell);if(cells.some(x=>x.trim()))rows.push(cells);
    if(rows.length<2)throw new Error('CSV sem registros.');const headers=rows.shift().map(s=>s.trim().replace(/^\uFEFF/,''));
    const required=['Login mk','Voice','Webchat','Whatsapp','Total','TMA Segundos','Produtividade','% Satisfeito','% FCR'];
    for(const h of required)if(!headers.includes(h))throw new Error('Coluna ausente: '+h);
    return rows.map((cells,i)=>{if(cells.length!==headers.length)throw new Error('Linha '+(i+2)+' possui quantidade incorreta de colunas.');return Object.fromEntries(headers.map((h,j)=>[h,cells[j].trim()]));});
  }
  function num(v,integer=false){const s=String(v??'').trim();if(!s)return null;let normalized=s.replace(/\s/g,'');if(normalized.includes(',')&&normalized.includes('.'))normalized=normalized.replace(/\./g,'').replace(',','.');else normalized=normalized.replace(',','.');const n=Number(normalized);if(!Number.isFinite(n)||(integer&&!Number.isInteger(n)))throw new Error('Número inválido: '+s);return n;}
  function count(v){const n=num(v,true);if(n===null||n<0)throw new Error('Contagem inválida: '+v);return n;}
  function pct(v){const n=num(String(v).replace('%',''));if(n!==null&&(n<0||n>100))throw new Error('Percentual fora de 0–100: '+v);return n;}
  function prepare(rows,island){const members=config.members.filter(m=>String(m.island_id)===String(island));const logins=new Set();return rows.map((r,i)=>{const login=String(r['Login mk']||'').toLowerCase().trim();if(!login||logins.has(login))throw new Error('Login mk ausente ou duplicado na linha '+(i+2));logins.add(login);if(!members.some(m=>m.bi_login.toLowerCase()===login))throw new Error('Login mk não vinculado à ilha: '+login);return {bi_login:login,total:count(r.Total),voice:count(r.Voice),webchat:count(r.Webchat),whatsapp:count(r.Whatsapp),tma_seconds:num(r['TMA Segundos'],true),produtividade:num(r.Produtividade),fcr:pct(r['% FCR']),satisfacao:pct(r['% Satisfeito']),faixa_produtividade:r['Faixa Produtividade SAC']||null};});}
  function invalidate(){readyRows=null;readyIsland=null;readyPeriod=null;el('sac-confirm').disabled=true;}
  for(const id of ['sac-import-island','sac-month','sac-file'])el(id).addEventListener('change',invalidate);
  el('sac-preview').onclick=async()=>{invalidate();try{const file=el('sac-file').files[0];if(!file)throw new Error('Selecione um CSV.');if(file.size>2_000_000)throw new Error('Arquivo maior que 2 MB.');const island=el('sac-import-island').value,period=el('sac-month').value;if(!island||!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw new Error('Selecione ilha e mês válidos.');const rows=prepare(parseCSV(await file.text()),island);if(rows.length>500)throw new Error('Máximo de 500 colaboradores por ilha.');const current=config.islands.find(i=>String(i.id)===String(island));const total=rows.reduce((a,r)=>a+r.total,0);el('sac-preview-info').textContent=`Ilha: ${current.name} | Competência: ${period.slice(5)}/${period.slice(0,4)} | ${rows.length} colaboradores | ${total} atendimentos. Base anterior: ${current.period||'nenhuma'}. A base anterior será apagada integralmente.`;readyRows=rows;readyIsland=Number(island);readyPeriod=period;el('sac-confirm').disabled=false;msg('sac-import-status','Prévia validada. Confira e confirme a substituição.');}catch(e){msg('sac-import-status',e.message);}};
  el('sac-confirm').onclick=async()=>{if(!readyRows)return;const island=config.islands.find(i=>i.id===readyIsland);if(!window.confirm(`Substituir TODOS os resultados da ilha ${island.name} pela competência ${readyPeriod}? Esta ação não pode ser desfeita.`))return;el('sac-confirm').disabled=true;try{const result=await call('sac_replace_island',{p_island_id:readyIsland,p_period:readyPeriod,p_rows:readyRows});msg('sac-import-status',`Importação concluída: ${result.rows} colaboradores, ${readyPeriod}.`);invalidate();await refresh();}catch(e){msg('sac-import-status','Nenhum dado foi substituído: '+e.message);}};
  el('sac-add-island').onclick=async()=>{try{await call('sac_setup',{p_action:'create',p_name:el('sac-island-name').value});await refresh();msg('sac-setup-status','Ilha criada.');}catch(e){msg('sac-setup-status',e.message);}};
  el('sac-set-leader').onclick=async()=>{try{await call('sac_setup',{p_action:'leader',p_island_id:Number(el('sac-setup-island').value),p_leader:el('sac-setup-leader').value});await refresh();msg('sac-setup-status','Líder vinculado.');}catch(e){msg('sac-setup-status',e.message);}};
  el('sac-set-agent').onclick=async()=>{try{await call('sac_setup',{p_action:'member',p_island_id:Number(el('sac-setup-island').value),p_user:el('sac-setup-agent').value,p_login:el('sac-bi-login').value});await refresh();msg('sac-setup-status','Atendente vinculado ao Login mk.');}catch(e){msg('sac-setup-status',e.message);}};
  document.addEventListener('sac:ready',async()=>{try{await refresh();}catch(e){msg('sac-import-status',e.message);}});
})();
