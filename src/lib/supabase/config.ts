// La URL y la clave publicable de Supabase no son secretas: viajan al navegador
// igual. Las variables de entorno permiten apuntar a otro proyecto sin tocar código.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mmhptsrguvlladyafina.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_JRCClL8CehZzLnhnDwdESA_Bxi9OSBQ";
