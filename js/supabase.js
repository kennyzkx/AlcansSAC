// Chave pública: as permissões reais são verificadas pelo Supabase (RLS).
// Nunca inclua service_role nem chave secreta no navegador.
window.centralSAC = supabase.createClient(
  "https://tgwvwxljbhvglioaabns.supabase.co",
  "sb_publishable_XofKZf0uhuFQDw9dvy2LLw_Q4AZ_ykK",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
