import "server-only";
import { crearClienteServidor } from "./supabase/server";
import type { Contacto, Interaccion } from "./tipos";

export async function listarContactos(opciones: { vendedorId?: string | null; soloAbiertos?: boolean } = {}) {
  const supabase = await crearClienteServidor();
  let q = supabase.from("contactos_estado").select("*");
  if (opciones.vendedorId) q = q.eq("vendedor_id", opciones.vendedorId);
  if (opciones.soloAbiertos) q = q.eq("abierto", true);
  const { data, error } = await q.order("proximo_paso_fecha", { ascending: true, nullsFirst: true }).limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as Contacto[];
}

export async function obtenerContacto(id: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("contactos_estado").select("*").eq("id", id).maybeSingle();
  return data as Contacto | null;
}

export async function obtenerHistorial(contactoId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("interacciones")
    .select("id, tipo, nota, fecha, autor:perfiles(nombre)")
    .eq("contacto_id", contactoId)
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Interaccion[];
}

export async function listarVendedores() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("activo", true)
    .order("rol", { ascending: false })
    .order("nombre");
  return (data ?? []) as { id: string; nombre: string; rol: "dueno" | "vendedor" }[];
}
