"use strict";
// Cadastro único das telas. Para adicionar uma nova aba, registre-a aqui.
// As permissões de interface não substituem a autorização no Supabase.
window.ALCANS_MODULES = Object.freeze([
 {id:"inicio",title:"Início",icon:"⌂",group:"main",access:c=>c.canDashboard,container:"dashboard-page"},
 {id:"multas",title:"Calculadora de Multas",icon:"▧",group:"ferramentas",access:c=>Boolean(c.user),container:"tool-page"},
 {id:"consumo",title:"Análise de Consumo",icon:"◫",group:"ferramentas",access:c=>Boolean(c.user),container:"tool-page"},
 {id:"cnpj",title:"Consulta CNPJ",icon:"building-2",group:"ferramentas",access:c=>Boolean(c.user),container:"tool-page"},
 {id:"mac",title:"Consulta de MAC",icon:"network",group:"ferramentas",access:c=>Boolean(c.user),container:"tool-page"},
 {id:"procedimentos",title:"Procedimentos",icon:"book-open",group:"docs",access:c=>Boolean(c.user),container:"docs-page"},
 {id:"sistemas",title:"Sistemas",icon:"monitor-cog",group:"docs",access:c=>Boolean(c.user),container:"docs-page"},
 {id:"users",title:"Gerir usuários",icon:"♙",group:"administracao",access:c=>c.canUsers,container:"admin-users-container",openButton:"open-users"},
 {id:"roles",title:"Cargos e permissões",icon:"⚙",group:"administracao",access:c=>c.canRoles,container:"admin-roles-container",openButton:"open-roles"},
 {id:"import",title:"Importar resultados",icon:"⇧",group:"administracao",access:c=>c.canImport,container:"admin-import-container",openButton:"open-import"},
 {id:"islands",title:"Configurar ilhas",icon:"▦",group:"administracao",access:c=>c.canUsers,container:"admin-islands-container",openButton:"open-islands"}
]);
