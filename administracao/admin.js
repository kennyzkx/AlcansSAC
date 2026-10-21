"use strict";
const adminViews={home:document.getElementById('admin-home'),users:document.getElementById('admin-users-container'),roles:document.getElementById('admin-roles-container'),import:document.getElementById('admin-import-container'),islands:document.getElementById('admin-islands-container')};
function showAdminView(view){for(const [key,el] of Object.entries(adminViews))el.hidden=key!==view;document.querySelectorAll('[data-admin-target]').forEach(b=>b.classList.toggle('active',b.dataset.adminTarget===view));}
document.querySelectorAll('[data-admin-back]').forEach(el=>el.hidden=true);
let refreshUsers=()=>Promise.resolve(),refreshRoles=()=>Promise.resolve();
document.getElementById('open-users').addEventListener('click',async()=>{if(!SAC.context?.canUsers)return;showAdminView('users');await refreshUsers();});
document.getElementById('open-roles').addEventListener('click',async()=>{if(!SAC.context?.canRoles)return;showAdminView('roles');await refreshRoles();});
document.getElementById('open-import').addEventListener('click',()=>{if(SAC.context?.canImport)showAdminView('import');});
document.getElementById('open-islands').addEventListener('click',()=>{if(SAC.context?.canUsers)showAdminView('islands');});
// A navegação inicial é controlada exclusivamente pelo shell.js.
// Não acionar itens da Administração durante sac:ready.

{
"use strict";
async function invokeAdmin(payload){const {data,error}=await SAC.client.functions.invoke('manage-users',{body:payload});if(error)throw new Error(data?.error||error.message||'Falha na operação');if(data?.error)throw new Error(data.error);return data;}
let roles=[],profiles=[],me;
async function loadUsers(){const results=await Promise.all([SAC.client.from('app_roles').select('id,name,is_system').order('name'),SAC.client.from('app_profiles').select('user_id,display_name,role_id,active').order('display_name')]);if(results.some(r=>r.error)){document.getElementById('users-status').textContent='Não foi possível carregar usuários.';return;}[roles,profiles]=results.map(r=>r.data||[]);const select=document.getElementById('invite-role');select.replaceChildren();roles.filter(r=>r.name!=='Gestor').forEach(r=>select.add(new Option(r.name,r.id)));renderUsers();}
function renderUsers(){const wrap=document.getElementById('users-list');wrap.replaceChildren();profiles.forEach(p=>{const row=document.createElement('div');row.className='user-row';const info=document.createElement('div');info.className='user-info';const name=document.createElement('strong');name.textContent=p.display_name||'Usuário sem nome';const state=document.createElement('small');state.textContent=p.active?'Ativo':'Inativo';info.append(name,state);const actions=document.createElement('div');actions.className='user-actions';const select=document.createElement('select');select.setAttribute('aria-label','Cargo de '+(p.display_name||'usuário'));const role=roles.find(r=>r.id===p.role_id);roles.filter(r=>r.name!=='Gestor'||role?.name==='Gestor').forEach(r=>select.add(new Option(r.name,r.id)));select.value=String(p.role_id||'');select.disabled=p.user_id===me||role?.name==='Gestor';const save=document.createElement('button');save.className='admin-button';save.textContent='Salvar';save.disabled=select.disabled;save.onclick=async()=>{save.disabled=true;try{await invokeAdmin({action:'set_role',user_id:p.user_id,role_id:Number(select.value)});document.getElementById('users-status').textContent='Cargo atualizado.';await loadUsers();}catch(e){document.getElementById('users-status').textContent=e.message;}finally{save.disabled=false;}};actions.append(select,save);row.append(info,actions);wrap.append(row);});}
document.addEventListener('sac:ready',({detail:c})=>{me=c.user.id;});
document.getElementById('invite-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;document.getElementById('invite-status').textContent='Criando usuário...';try{const values=Object.fromEntries(new FormData(form));await invokeAdmin({action:'create_user',...values,role_id:Number(values.role_id)});form.reset();document.getElementById('invite-status').textContent='Usuário criado com sucesso.';await loadUsers();}catch(err){document.getElementById('invite-status').textContent=err.message;}finally{button.disabled=false;}});

refreshUsers=loadUsers;
}
{
"use strict";
async function invokeAdmin(payload){const {data,error}=await SAC.client.functions.invoke('manage-users',{body:payload});if(error)throw new Error(data?.error||error.message||'Falha na operação');if(data?.error)throw new Error(data.error);return data;}
let roles=[],permissions=[],rolePermissions=[];
async function loadRoles(){const results=await Promise.all([SAC.client.from('app_roles').select('id,name,is_system').order('name'),SAC.client.from('app_permissions').select('code,description').order('code'),SAC.client.from('app_role_permissions').select('role_id,permission_code')]);if(results.some(r=>r.error)){document.getElementById('roles-status').textContent='Não foi possível carregar cargos.';return;}[roles,permissions,rolePermissions]=results.map(r=>r.data||[]);const select=document.getElementById('edit-role'),previous=select.value;select.replaceChildren();roles.filter(r=>!r.is_system).forEach(r=>select.add(new Option(r.name,r.id)));if([...select.options].some(o=>o.value===previous))select.value=previous;renderChecks();}
function renderChecks(){const id=Number(document.getElementById('edit-role').value),wrap=document.getElementById('permission-checks');wrap.replaceChildren();permissions.filter(p=>['dashboard.view','results.team.view','results.manage'].includes(p.code)).forEach(p=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=p.code;input.checked=rolePermissions.some(r=>r.role_id===id&&r.permission_code===p.code);input.disabled=!id;label.append(input,document.createTextNode(p.description));wrap.append(label);});document.getElementById('save-permissions').disabled=!id;}

document.getElementById('edit-role').addEventListener('change',renderChecks);
document.getElementById('role-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;try{await invokeAdmin({action:'create_role',name:new FormData(form).get('name')});form.reset();document.getElementById('roles-status').textContent='Cargo criado.';await loadRoles();}catch(err){document.getElementById('roles-status').textContent=err.message;}});
document.getElementById('save-permissions').addEventListener('click',async()=>{try{await invokeAdmin({action:'set_role_permissions',role_id:Number(document.getElementById('edit-role').value),permissions:[...document.querySelectorAll('#permission-checks input:checked')].map(i=>i.value)});document.getElementById('roles-status').textContent='Permissões atualizadas.';await loadRoles();}catch(err){document.getElementById('roles-status').textContent=err.message;}});

refreshRoles=loadRoles;
}
