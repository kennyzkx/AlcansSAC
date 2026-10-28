// Carregamento ordenado: evita inicializar o login antes da biblioteca Supabase.
(() => {
 const isLogin = /(?:^|\/)index\.html$/.test(location.pathname) || location.pathname.endsWith('/');
 const login = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js', 'js/supabase.js', 'js/script.js'];
 const dashboard = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js', 'js/supabase.js', 'js/auth.js', 'core/modules.js', 'js/shell.js', 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', 'modules/ferramentas/generalFines.js', 'modules/ferramentas/saoCarlosFines.js', 'js/calendar.js', 'modules/ferramentas/ferramentas.js', 'modules/ferramentas/mac.js', 'modules/ferramentas/cnpj.js', 'modules/docs/docs.js', 'js/dashboard.js', 'js/ai-chat.js', 'administracao/admin.js', 'administracao/importacao.js'];
 const load = (src) => new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=src;script.async=false;
   script.onload=resolve;script.onerror=()=>reject(new Error(src));
   document.head.appendChild(script);
 });
 const supabaseSources=[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
 ];
 (async()=>{
   let loaded=false;
   for(const src of supabaseSources){try{await load(src);if(window.supabase?.createClient){loaded=true;break}}catch(e){}}
   if(!loaded)throw new Error('A biblioteca do Supabase não carregou. Verifique sua conexão.');
   const scripts=(isLogin?login:dashboard).filter(src=>!src.includes('@supabase/supabase-js'));
   for(const src of scripts){
     try{await load(src)}catch(e){
       if(/^https?:/.test(src)){console.warn('Biblioteca opcional indisponível:',src);continue}
       throw e;
     }
   }
 })().catch(err=>{
  console.error('Falha ao iniciar Alcans:',err);
  const target=document.getElementById(isLogin?'form-feedback':'auth-loading');
  if(target)target.textContent='Não foi possível carregar o sistema. Atualize a página ou verifique sua conexão.';
 });
})();
