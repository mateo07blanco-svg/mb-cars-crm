import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";
import type { Usuario } from "./tipos";

// Devuelve el usuario con sesión y perfil activo; si no, lo manda a donde corresponde.
export async function usuarioActual(): Promise<Usuario> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/login");

  const { data: perfil } = await supabase.from("perfiles").select("id, nombre, rol, activo").eq("id", id).single();
  if (!perfil || !perfil.activo) redirect("/login?pendiente=1");
  return { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol };
}

export async function duenoActual(): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (usuario.rol !== "dueno") redirect("/hoy");
  return usuario;
}
