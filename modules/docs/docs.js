'use strict';
(()=>{
 const root=()=>document.getElementById('docs-body');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const colors={Vermelho:'#ef4444',Laranja:'#ff6500',Verde:'#22c55e',Amarelo:'#eab308'};
 let section='procedimentos',ctx=null,items=[],path=[],version=0;
 const manager=()=>Number(ctx?.profile?.role_id)===1;
 const parent=()=>path.at(-1)||null;
 const storagePrefix=()=>ctx.client.storage.from('alcans-docs').getPublicUrl('test').data.publicUrl.replace(/test$/,'');
 function sanitize(html){const t=document.createElement('template');t.innerHTML=html;const allowed=new Set(['P','DIV','BR','B','STRONG','I','EM','U','SPAN','UL','OL','LI','H2','H3','BLOCKQUOTE','IMG']);const validColor=new Set(Object.values(colors).map(c=>{const s=document.createElement('span');s.style.color=c;return s.style.color}));function walk(n){for(const x of [...n.childNodes]){if(x.nodeType===8){x.remove();continue}if(x.nodeType!==1)continue;if(!allowed.has(x.tagName)){while(x.firstChild)x.parentNode.insertBefore(x.firstChild,x);x.remove();walk(n);continue}const color=x.style.color,src=x.getAttribute('src'),path=x.getAttribute('data-docs-path');for(const a of [...x.attributes])x.removeAttribute(a.name);if(x.tagName==='SPAN'&&validColor.has(color))x.style.color=color;if(x.tagName==='IMG'&&path&&/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(path)){x.setAttribute('data-docs-path',path);x.alt='Imagem do procedimento';x.loading='lazy';if(src?.startsWith('blob:'))x.src=src}walk(x)}}walk(t.content);return t.innerHTML}
 function dialog(html){const slot=root().querySelector('#docs-dialog');slot.innerHTML=`<div class="docs-overlay"><div class="docs-modal" role="dialog" aria-modal="true">${html}</div></div>`;slot.querySelector('.docs-close').onclick=()=>slot.replaceChildren();return slot}
 function render(){const name=section==='procedimentos'?'Procedimentos':'Sistemas',current=items.find(i=>i.id===parent()),children=items.filter(i=>i.section===section&&i.parent_id===parent()).sort((a,b)=>Number(b.kind==='folder')-Number(a.kind==='folder')||a.title.localeCompare(b.title,'pt-BR'));root().innerHTML=`<header class="docs-hero"><span class="docs-kicker">BASE DE CONHECIMENTO / ${name.toUpperCase()}</span><h1>${esc(current?.title||name)}</h1><p>${section==='procedimentos'?'Procedimentos, orientações e padrões de atendimento.':'Guias e referências dos sistemas utilizados pela equipe.'}</p></header><nav class="docs-crumb"><button data-depth="0">${name}</button>${path.map((id,i)=>`<span>›</span><button data-depth="${i+1}">${esc(items.find(x=>x.id===id)?.title||'Pasta')}</button>`).join('')}</nav><div class="docs-toolbar"><div><h2>${esc(current?.title||'Biblioteca de '+name.toLowerCase())}</h2><p>${children.length} itens nesta pasta</p></div>${manager()?'<div class="docs-actions"><button class="docs-btn docs-secondary" id="docs-add-folder">+ Nova pasta</button><button class="docs-btn docs-primary" id="docs-add-article">+ Novo documento</button></div>':''}</div><div class="docs-grid">${children.map(x=>`<div class="docs-tile-card"><button class="docs-tile" data-id="${x.id}"><span class="docs-tile-icon">${x.kind==='folder'?'▣':'▤'}</span><span><strong>${esc(x.title)}</strong><small>${x.kind==='folder'?'Pasta':'Abrir documento'}</small></span><span>→</span></button>${manager()?`<div class="docs-tile-actions"><button type="button" class="docs-btn docs-secondary" data-edit-doc="${x.id}">Editar</button><button type="button" class="docs-btn docs-danger" data-delete-doc="${x.id}">Excluir</button></div>`:''}</div>`).join('')||'<p class="docs-empty">Nenhum conteúdo nesta pasta.</p>'}</div><p class="docs-note">Documentação interna. Confira as informações antes de orientar um cliente.</p><div id="docs-dialog"></div>`;root().querySelectorAll('[data-depth]').forEach(b=>b.onclick=()=>{path=path.slice(0,Number(b.dataset.depth));render()});root().querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const x=items.find(i=>i.id===b.dataset.id);if(x.kind==='folder'){path.push(x.id);render()}else view(x)});root().querySelectorAll('[data-edit-doc]').forEach(b=>b.addEventListener('click',()=>{const x=items.find(i=>i.id===b.dataset.editDoc);if(x)edit(x)}));root().querySelectorAll('[data-delete-doc]').forEach(b=>b.addEventListener('click',()=>{const x=items.find(i=>i.id===b.dataset.deleteDoc);if(x)deleteDocument(x)}));root().querySelector('#docs-add-folder')?.addEventListener('click',()=>edit({kind:'folder',title:'',content:''}));root().querySelector('#docs-add-article')?.addEventListener('click',()=>edit({kind:'article',title:'',content:''}))}
 async function deleteDocument(x){if(!manager()||!x)return;if(x.kind==='folder'&&items.some(i=>i.parent_id===x.id)){alert('Esta pasta contém documentos ou subpastas. Remova ou reorganize o conteúdo antes de excluí-la.');return}if(!confirm(`Excluir ${x.kind==='folder'?'a pasta':'o procedimento'} “${x.title}”? Esta ação não pode ser desfeita.`))return;const {error}=await ctx.client.from('alcans_docs').delete().eq('id',x.id);if(error){alert('Não foi possível excluir: '+error.message);return}await load()}
 async function hydrateImages(container){for(const img of container.querySelectorAll('img[data-docs-path]')){const {data,error}=await ctx.client.storage.from('alcans-docs').createSignedUrl(img.dataset.docsPath,3600);if(!error)img.src=data.signedUrl}}
 function view(x){const d=dialog(`<div class="docs-modal-head"><div><span class="docs-kicker">DOCUMENTO ALCANS</span><h2>${esc(x.title)}</h2></div><button class="docs-close" aria-label="Fechar">×</button></div><article class="docs-article">${sanitize(x.content||'<p>Sem conteúdo.</p>')}</article><footer class="docs-footer"><span>Atualizado: ${new Date(x.updated_at).toLocaleDateString('pt-BR')}</span><div class="docs-actions">${manager()?'<button class="docs-btn docs-danger" id="docs-delete">Excluir</button><button class="docs-btn docs-primary" id="docs-edit">Editar</button>':''}</div></footer><p class="docs-feedback"></p>`);hydrateImages(d);d.querySelector('#docs-edit')?.addEventListener('click',()=>edit(x));d.querySelector('#docs-delete')?.addEventListener('click',()=>deleteDocument(x))}
 function edit(x){if(!manager())return;const d=dialog(`<div class="docs-modal-head"><div><span class="docs-kicker">EDITOR DE DOCUMENTOS</span><h2>${x.id?'Editar':'Criar'} ${x.kind==='folder'?'pasta':'documento'}</h2></div><button class="docs-close" aria-label="Fechar">×</button></div><label class="docs-label">Título<input id="docs-title" maxlength="160" value="${esc(x.title)}" placeholder="Nome do ${x.kind==='folder'?'grupo':'procedimento'}"></label>${x.kind==='article'?`<label class="docs-label">Conteúdo</label><div class="docs-format"><button data-command="bold"><b>B</b></button><button data-command="italic"><i>I</i></button><button data-command="insertUnorderedList">☷ Lista</button>${Object.entries(colors).map(([n,c])=>`<button data-color="${c}"><i style="background:${c}"></i>${n}</button>`).join('')}<label class="docs-upload">▧ Imagem<input type="file" id="docs-image" accept="image/png,image/jpeg,image/webp" hidden></label></div><div id="docs-editor" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Escreva as instruções, inclua imagens e destaques...">${sanitize(x.content||'')}</div><p class="docs-hint">Selecione as palavras para formatar. Imagens PNG, JPG ou WebP de até 5 MB.</p>`:''}<p class="docs-feedback" role="status"></p><footer class="docs-footer"><span>Disponível para a equipe autenticada.</span><button class="docs-btn docs-primary" id="docs-save">Salvar</button></footer>`);const editor=d.querySelector('#docs-editor'),feedback=d.querySelector('.docs-feedback');if(editor)hydrateImages(editor);let selection=null;
 const capture=()=>{if(!editor)return;const sel=window.getSelection();if(sel.rangeCount&&editor.contains(sel.anchorNode)&&editor.contains(sel.focusNode))selection=sel.getRangeAt(0).cloneRange()};
 editor?.addEventListener('mouseup',capture);editor?.addEventListener('keyup',capture);editor?.addEventListener('touchend',capture);
 // Evita que o clique na barra desfaça a seleção do texto.
 d.querySelectorAll('[data-command],[data-color]').forEach(b=>b.addEventListener('pointerdown',e=>{capture();e.preventDefault()}));
 editor?.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))});const restore=()=>{if(!editor)return false;editor.focus();if(selection){const sel=window.getSelection();sel.removeAllRanges();try{sel.addRange(selection);return true}catch{}}return false};
 const applyFormat=(command,value)=>{if(!restore())return;document.execCommand('styleWithCSS',false,true);document.execCommand(command,false,value);capture()};
 d.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>applyFormat(b.dataset.command,null));
 d.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>applyFormat('foreColor',b.dataset.color));d.querySelector('#docs-image')?.addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){feedback.textContent='Formato inválido ou arquivo acima de 5 MB.';return}feedback.textContent='Enviando imagem...';const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type],key=`${ctx.user.id}/${crypto.randomUUID()}.${ext}`;const {error}=await ctx.client.storage.from('alcans-docs').upload(key,file,{contentType:file.type});if(error){feedback.textContent=error.message;return}const {data:signed,error:signError}=await ctx.client.storage.from('alcans-docs').createSignedUrl(key,3600);if(signError){feedback.textContent=signError.message;return}restore();document.execCommand('insertImage',false,signed.signedUrl);const image=[...editor.querySelectorAll('img')].find(i=>i.src===signed.signedUrl);if(image)image.setAttribute('data-docs-path',key);feedback.textContent='Imagem inserida. Salve o documento.'});d.querySelector('#docs-save').onclick=async()=>{const title=d.querySelector('#docs-title').value.trim();if(!title){feedback.textContent='Informe um título.';return}const save=d.querySelector('#docs-save');save.disabled=true;feedback.textContent='Salvando...';const record={title,kind:x.kind,section,parent_id:x.id?x.parent_id:parent(),content:x.kind==='article'?sanitize(editor.innerHTML):'',updated_at:new Date().toISOString()};const query=x.id?ctx.client.from('alcans_docs').update(record).eq('id',x.id):ctx.client.from('alcans_docs').insert(record);const {error}=await query;if(error){feedback.textContent=error.message;save.disabled=false;return}await load()}}
 async function load(){const token=++version;const {data,error}=await ctx.client.from('alcans_docs').select('id,title,kind,section,parent_id,content,updated_at').order('title');if(token!==version||section!=='procedimentos')return;if(error){root().innerHTML=`<div class="docs-hero"><h1>Docs</h1><p>Não foi possível carregar a biblioteca.</p></div><div class="docs-error">${esc(error.message)}<p>Confira a configuração do módulo no Supabase.</p></div>`;return}items=data||[];path=path.filter(id=>items.some(x=>x.id===id));render()}

 // Galeria de Sistemas: cards simples, sem editor de procedimentos.
 let systemsVersion=0;
 let systems=[];
 const systemImageBucket='alcans-docs';
 const imageType={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
 const safeExternalUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.href:null}catch{return null}};
 async function loadSystems(){
   const token=++systemsVersion;
   root().innerHTML='<header class="docs-hero"><span class="docs-kicker">DOCS / SISTEMAS</span><h1>Sistemas</h1><p>Acesso rápido às plataformas da Alcans.</p></header><p class="docs-note">Carregando sistemas...</p>';
   const {data,error}=await ctx.client.from('alcans_systems').select('id,name,url,image_path,updated_at').order('name');
   if(token!==systemsVersion||section!=='sistemas')return;
   if(error){root().innerHTML=`<header class="docs-hero"><span class="docs-kicker">DOCS / SISTEMAS</span><h1>Sistemas</h1><p>Não foi possível carregar os sistemas.</p></header><div class="docs-error">${esc(error.message)}</div>`;return}
   systems=data||[];
   renderSystems();
 }
 function renderSystems(){
   if(section!=='sistemas')return;
   root().innerHTML=`<header class="docs-hero"><span class="docs-kicker">DOCS / SISTEMAS</span><h1>Sistemas</h1><p>Encontre e acesse rapidamente as plataformas utilizadas pela equipe.</p></header>
   <div class="docs-toolbar"><div><h2>Sistemas cadastrados</h2><p>${systems.length} ${systems.length===1?'sistema disponível':'sistemas disponíveis'}</p></div>${manager()?'<button type="button" class="docs-btn docs-primary" id="docs-new-system">+ Novo sistema</button>':''}</div>
   <div class="docs-systems-grid">${systems.map(x=>`<article class="docs-system-card" data-system-id="${x.id}"><div class="docs-system-picture" data-picture="${x.id}"><span class="docs-system-placeholder">${esc(x.name.slice(0,2).toUpperCase())}</span></div><div class="docs-system-details"><h3 title="${esc(x.name)}">${esc(x.name)}</h3><p>${esc((()=>{try{return new URL(x.url).hostname}catch{return 'Link indisponível'}})())}</p></div><div class="docs-system-actions"><a class="docs-btn docs-primary docs-system-access" href="${esc(safeExternalUrl(x.url)||'#')}" target="_blank" rel="noopener noreferrer" ${safeExternalUrl(x.url)?'':'aria-disabled="true"'}>Acessar ↗</a>${manager()?`<button type="button" class="docs-btn docs-secondary" data-edit-system="${x.id}">Editar</button><button type="button" class="docs-btn docs-danger" data-delete-system="${x.id}">Excluir</button>`:''}</div></article>`).join('')||'<div class="docs-empty docs-systems-empty">Nenhum sistema cadastrado ainda. '+(manager()?'Clique em “Novo sistema” para adicionar o primeiro.':'Os sistemas adicionados pelo Gestor aparecerão aqui.')+'</div>'}</div>
   <p class="docs-note">Os links são cadastrados pela gestão e abrem em uma nova aba.</p><div id="docs-dialog"></div>`;
   root().querySelector('#docs-new-system')?.addEventListener('click',()=>editSystem(null));
   root().querySelectorAll('[data-edit-system]').forEach(b=>b.addEventListener('click',()=>editSystem(systems.find(x=>x.id===b.dataset.editSystem))));
   root().querySelectorAll('[data-delete-system]').forEach(b=>b.addEventListener('click',()=>deleteSystem(systems.find(x=>x.id===b.dataset.deleteSystem))));
   for(const x of systems)if(x.image_path)showSystemImage(x);
 }
 async function showSystemImage(x){
   const slot=root()?.querySelector(`[data-picture="${x.id}"]`);
   if(!slot)return;
   const {data,error}=await ctx.client.storage.from(systemImageBucket).createSignedUrl(x.image_path,3600);
   if(error||!data?.signedUrl)return;
   if(!slot.isConnected||slot.dataset.picture!==x.id)return;
   const img=document.createElement('img');img.src=data.signedUrl;img.alt=`Logotipo de ${x.name}`;img.loading='lazy';
   img.onerror=()=>img.remove();slot.prepend(img);
 }
 async function deleteSystem(x){
   if(!manager()||!x||!confirm(`Excluir o sistema “${x.name}”?`))return;
   const {error}=await ctx.client.from('alcans_systems').delete().eq('id',x.id);
   if(error){alert('Não foi possível excluir: '+error.message);return}
   // O arquivo pode ser reaproveitado; não excluímos imagens antigas automaticamente.
   await loadSystems();
 }
 function editSystem(x){
   if(!manager())return;
   const d=dialog(`<div class="docs-modal-head"><div><span class="docs-kicker">DOCS / SISTEMAS</span><h2>${x?'Editar sistema':'Cadastrar sistema'}</h2></div><button type="button" class="docs-close" aria-label="Fechar">×</button></div>
   <form id="docs-system-form"><label class="docs-label">Nome do sistema<input id="docs-system-name" maxlength="160" required placeholder="Ex.: MK Solutions" value="${esc(x?.name||'')}"></label>
   <label class="docs-label">Link do sistema<input id="docs-system-url" type="url" required placeholder="https://exemplo.com.br" value="${esc(x?.url||'')}"></label>
   <label class="docs-label">Imagem ou logotipo ${x?'(opcional para substituir)':'(obrigatório)'}<input id="docs-system-image" type="file" accept="image/png,image/jpeg,image/webp" ${x?'':'required'}></label>
   <div class="docs-system-preview" id="docs-system-preview">${x?.image_path?'Imagem atual mantida se você não escolher outra.':'Selecione uma imagem PNG, JPG ou WebP (até 5 MB).'}</div>
   <p class="docs-feedback" role="status" aria-live="polite"></p><footer class="docs-footer"><span>Disponível para toda a equipe.</span><div class="docs-actions"><button type="button" class="docs-btn docs-secondary docs-close-form">Cancelar</button><button type="submit" class="docs-btn docs-primary" id="docs-system-save">Salvar sistema</button></div></footer></form>`);
   d.querySelector('.docs-close-form').onclick=()=>d.replaceChildren();
   const form=d.querySelector('#docs-system-form'),feedback=d.querySelector('.docs-feedback'),fileInput=d.querySelector('#docs-system-image'),preview=d.querySelector('#docs-system-preview');
   fileInput.onchange=()=>{const file=fileInput.files[0];preview.replaceChildren();if(!file)return;const img=document.createElement('img');img.src=URL.createObjectURL(file);img.alt='Prévia da imagem';img.onload=()=>URL.revokeObjectURL(img.src);preview.append(img)};
   form.onsubmit=async e=>{
     e.preventDefault();if(!manager())return;
     const name=d.querySelector('#docs-system-name').value.trim();
     const url=safeExternalUrl(d.querySelector('#docs-system-url').value.trim());
     if(!name||!url){feedback.textContent='Informe o nome e um link HTTPS válido.';return}
     const file=fileInput.files[0];
     if(!x&&!file){feedback.textContent='Selecione uma imagem.';return}
     if(file&&(!imageType[file.type]||file.size>5*1024*1024)){feedback.textContent='A imagem deve ser PNG, JPG ou WebP, com no máximo 5 MB.';return}
     const save=d.querySelector('#docs-system-save');save.disabled=true;feedback.textContent='Salvando sistema...';
     let image_path=x?.image_path||null;
     if(file){
       image_path=`${ctx.user.id}/${crypto.randomUUID()}.${imageType[file.type]}`;
       const {error}=await ctx.client.storage.from(systemImageBucket).upload(image_path,file,{contentType:file.type,upsert:false});
       if(error){feedback.textContent='Erro ao enviar a imagem: '+error.message;save.disabled=false;return}
     }
     const record={name,url,image_path,updated_at:new Date().toISOString()};
     const query=x?ctx.client.from('alcans_systems').update(record).eq('id',x.id):ctx.client.from('alcans_systems').insert(record);
     const {error}=await query;
     if(error){feedback.textContent='Erro ao salvar: '+error.message;save.disabled=false;return}
     d.replaceChildren();await loadSystems();
   };
 }

 window.AlcansDocs={showArticle:async id=>{if(section!=='procedimentos')return; if(!items.length)await load();const x=items.find(i=>i.id===id&&i.kind==='article');if(!x)return;const chain=[];let current=x;while(current?.parent_id){const folder=items.find(i=>i.id===current.parent_id);if(!folder)break;chain.unshift(folder.id);current=folder;}path=chain;render();view(x);},open(s,c){ctx=c;if(s==='sistemas'){if(section!==s){section=s;path=[]}loadSystems();return}if(section!==s){section=s;path=[];load()}else if(!items.length)load();else render()}};
})();
