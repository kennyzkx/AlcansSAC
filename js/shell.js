"use strict";
(function(){
 const registry=window.ALCANS_MODULES||[];
 const byId=id=>registry.find(m=>m.id===id);
 const group=document.getElementById("admin-nav-group");
 const submenu=document.querySelector("#admin-submenu .sidebar-submenu-inner");
 const toggle=document.getElementById("admin-nav");
 const menu=document.getElementById("admin-submenu");
 const bar=document.getElementById("tabbar");
 const dynamicNav=document.getElementById("dynamic-main-nav");
 let tabs=["inicio"],current="inicio",context=null;
 function permitted(m){return Boolean(m&&context&&m.access(context));}
 function setExpanded(open){
   toggle.setAttribute("aria-expanded",String(open));
   menu.classList.toggle("is-open",open);
   menu.setAttribute("aria-hidden",String(!open));
 }
 const toolIcons={
   ferramentas:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12M14 13h4M14 17h4"/>',
   multas:'<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 7h6M9 11h2M15 11h.01M9 15h2M15 15h.01M9 19h6"/>',
   mac:'<rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="4" width="7" height="6" rx="1.5"/><rect x="8.5" y="15" width="7" height="6" rx="1.5"/><path d="M6.5 10v3h11v-3M12 13v2"/>',
   docs:'<path d="M4 5.5c3-1 5.5-.6 8 1.2 2.5-1.8 5-2.2 8-1.2v13c-3-1-5.5-.6-8 1.2-2.5-1.8-5-2.2-8-1.2z"/><path d="M12 6.7v13"/>',
   procedimentos:'<path d="M4 5.5c3-1 5.5-.6 8 1.2 2.5-1.8 5-2.2 8-1.2v13c-3-1-5.5-.6-8 1.2-2.5-1.8-5-2.2-8-1.2z"/><path d="M12 6.7v13"/>',
   sistemas:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
   consumo:'<path d="M4 19.5h16M7 16v-5M12 16V6M17 16V9"/><path d="M4 4.5h16" opacity=".5"/>'
 };
 function makeToolIcon(kind){
   const holder=document.createElement("span");
   holder.className="alcans-tool-nav-icon";
   holder.setAttribute("aria-hidden","true");
   holder.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+toolIcons[kind]+'</svg>';
   return holder;
 }
 function renderMenu(){
   submenu.replaceChildren();
   for(const m of registry.filter(m=>m.group==="administracao"&&permitted(m))){
     const button=document.createElement("button");
     button.type="button";button.className="sidebar-subitem";
     button.dataset.adminTarget=m.id;
     const icon=document.createElement("span");icon.setAttribute("aria-hidden","true");icon.textContent=m.icon;
     button.append(icon,document.createTextNode(m.title));
     button.addEventListener("click",()=>navigate(m.id));
     submenu.append(button);
   }
   dynamicNav.replaceChildren();
   const tools=registry.filter(m=>m.group==="ferramentas"&&permitted(m));
   if(tools.length){
     const wrapper=document.createElement("div");wrapper.className="sidebar-admin-group";
     const head=document.createElement("button");head.type="button";head.className="nav-link sidebar-admin-toggle";
     head.innerHTML='<span class="nav-icon" data-tools-icon></span><span class="sidebar-nav-label">Ferramentas</span><svg class="sidebar-chevron" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
     head.querySelector("[data-tools-icon]").append(makeToolIcon("ferramentas"));
     head.setAttribute("aria-expanded","false");
     const sub=document.createElement("div");sub.className="sidebar-submenu";
     const inner=document.createElement("div");inner.className="sidebar-submenu-inner";
     for(const m of tools){const b=document.createElement("button");b.type="button";b.className="sidebar-subitem";b.dataset.toolTarget=m.id;
       const i=makeToolIcon(m.id);b.append(i,document.createTextNode(m.title));b.addEventListener("click",()=>navigate(m.id));inner.append(b);}
     sub.append(inner);head.addEventListener("click",()=>{const open=head.getAttribute("aria-expanded")!=="true";head.setAttribute("aria-expanded",String(open));sub.classList.toggle("is-open",open);});
     wrapper.append(head,sub);dynamicNav.append(wrapper);
   }
   const docs=registry.filter(m=>m.group==="docs"&&permitted(m));
   if(docs.length){
     const wrapper=document.createElement("div");wrapper.className="sidebar-admin-group";
     const head=document.createElement("button");head.type="button";head.className="nav-link sidebar-admin-toggle";
     head.innerHTML='<span class="nav-icon" data-docs-icon></span><span class="sidebar-nav-label">Docs</span><svg class="sidebar-chevron" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
     head.querySelector("[data-docs-icon]").append(makeToolIcon("docs"));
     head.setAttribute("aria-expanded","false");
     const sub=document.createElement("div");sub.className="sidebar-submenu";
     const inner=document.createElement("div");inner.className="sidebar-submenu-inner";
     for(const m of docs){const b=document.createElement("button");b.type="button";b.className="sidebar-subitem";b.dataset.docsTarget=m.id; b.append(makeToolIcon(m.id),document.createTextNode(m.title));b.addEventListener("click",()=>navigate(m.id));inner.append(b);}
     sub.append(inner);head.addEventListener("click",()=>{const open=head.getAttribute("aria-expanded")!=="true";head.setAttribute("aria-expanded",String(open));sub.classList.toggle("is-open",open);});
     wrapper.append(head,sub);dynamicNav.append(wrapper);
   }
   group.hidden=!registry.some(m=>m.group==="administracao"&&permitted(m));
 }
 function render(){
   const m=byId(current);if(!m)return;
   document.getElementById("dashboard-page").hidden=current!=="inicio";
   document.getElementById("admin-page").hidden=m.group!=="administracao";
   document.getElementById("empty-page").hidden=true;
   document.getElementById("tool-page").hidden=m.group!=="ferramentas";
   document.getElementById("docs-page").hidden=m.group!=="docs";
   if(m.group==="docs"&&window.AlcansDocs)window.AlcansDocs.open(current,context);
   const docsHead=dynamicNav.querySelector("[data-docs-icon]")?.closest(".sidebar-admin-toggle");
   if(docsHead){docsHead.classList.toggle("active",m.group==="docs");dynamicNav.querySelectorAll("[data-docs-target]").forEach(b=>b.classList.toggle("active",b.dataset.docsTarget===current));}
   const toolHead=dynamicNav.querySelector(".sidebar-admin-toggle");
   if(toolHead){toolHead.classList.toggle("active",m.group==="ferramentas");dynamicNav.querySelectorAll("[data-tool-target]").forEach(b=>b.classList.toggle("active",b.dataset.toolTarget===current));}
   if(m.group==="ferramentas"&&window.AlcansTools)window.AlcansTools.open(current);
   document.getElementById("topbar-current").textContent=m.title;
   document.querySelector('[data-page="inicio"]').classList.toggle("active",current==="inicio");
   toggle.classList.toggle("active",m.group==="administracao");
   submenu.querySelectorAll("[data-admin-target]").forEach(b=>b.classList.toggle("active",b.dataset.adminTarget===current));
   if(m.group==="administracao"){
     // Reutiliza as telas existentes e seus carregamentos, sem recriar formulários.
     const btn=document.getElementById(m.openButton);
     if(btn)btn.click();
   }
   bar.replaceChildren();
   for(const id of tabs.filter(id=>permitted(byId(id)))){
     const module=byId(id),tab=document.createElement("div");
     tab.className="tab"+(id===current?" active":"");
     const label=document.createElement("button");label.type="button";label.className="tab-label";
     label.textContent=module.title;label.addEventListener("click",()=>navigate(id));
     const close=document.createElement("button");close.type="button";close.className="tab-close";
     close.textContent="×";close.setAttribute("aria-label","Fechar aba "+module.title);
     close.addEventListener("click",()=>{
       tabs=tabs.filter(k=>k!==id);
       if(current===id)current=tabs.at(-1)||"inicio";
       if(!tabs.includes(current))tabs.push(current);
       render();history.replaceState(null,"",location.pathname+location.search+(current==="inicio"?"":"#"+current));
     });
     tab.append(label,close);bar.append(tab);
   }
 }
 function navigate(id){
   if(!permitted(byId(id)))return;
   if(!tabs.includes(id))tabs.push(id);
   current=id;render();
   history.replaceState(null,"",location.pathname+location.search+(id==="inicio"?"":"#"+id));
 }
 document.addEventListener("sac:ready",({detail:c})=>{
   context=c;renderMenu();
   toggle.addEventListener("click",()=>setExpanded(toggle.getAttribute("aria-expanded")!=="true"));
   document.querySelector('[data-page="inicio"]').addEventListener("click",()=>navigate("inicio"));
   const name=c.profile.display_name||c.user.email.split("@")[0];
   document.getElementById("top-user").textContent=name.split(" ")[0];
   const parts=name.split(/\s+/);
   document.getElementById("avatar").textContent=((parts[0]?.[0]||"A")+(parts.at(-1)?.[0]||"T")).toUpperCase();
   document.getElementById("logout").addEventListener("click",async()=>{
     await c.client.auth.signOut();location.replace(SAC.base.href+"index.html");
   });
   // Compatibilidade com módulos antigos que usam data-permission.
   document.querySelectorAll("[data-permission]").forEach(el=>{
     const p=el.dataset.permission;
     el.hidden=p==="users.view"?!c.canUsers:p==="roles.manage"?!c.canRoles:
       p==="results.import"?!c.canImport:p==="users.manage"?!c.canUsers:false;
   });
   // Sem hash (novo login): Início. Com hash válido (F5): manter a aba atual.
   // Nunca forçar Administração por causa do cargo do usuário.
   const requested=decodeURIComponent(location.hash.slice(1));
   current=permitted(byId(requested))?requested:"inicio";
   if(current==="inicio"&&location.hash)history.replaceState(null,"",location.pathname+location.search);
   if(byId(current)?.group==="administracao")setExpanded(true);
   if(byId(current)?.group==="docs"){const head=dynamicNav.querySelector("[data-docs-icon]")?.closest(".sidebar-admin-toggle");if(head){head.setAttribute("aria-expanded","true");head.nextElementSibling.classList.add("is-open");}}
   if(byId(current)?.group==="ferramentas"){const head=dynamicNav.querySelector(".sidebar-admin-toggle");if(head){head.setAttribute("aria-expanded","true");dynamicNav.querySelector(".sidebar-submenu").classList.add("is-open");}}
   tabs=current==="inicio"?["inicio"]:["inicio",current];
   render();
 });
 SAC.check();
})();
