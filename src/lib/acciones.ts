"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";
import { usuarioActual, duenoActual } from "./auth";
import type { Etapa, Moneda, MotivoPerdida, Rol, TipoInteraccion } from "./tipos";

export type Resultado = { error?: string; ok?: boolean; mensaje?: string };

function texto(fd: FormData, campo: string): string | null {
  const v = fd.get(campo);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function numero(fd: FormData, campo: string): number | null {
  const t = texto(fd, campo);
  if (t == null) return null;
  // Acepta "25.000", "25000" o "25000,50".
  const n = Number(t.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Traduce los errores de la base a algo que un vendedor entienda.
function mensajeError(error: { message: string; code?: string }): string {
  if (error.code === "42501" || error.message.includes("row-level security")) return "No tenés permiso para hacer eso.";
  if (error.message.includes("contacto_con_telefono_o_email")) return "Cargá al menos un teléfono o un mail.";
  if (error.message.includes("perdido_con_motivo")) return "Para marcarlo como perdido elegí un motivo.";
  if (error.message.includes("otro_con_detalle")) return "Si el motivo es «Otro», contá cuál fue.";
  return error.message;
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function crearContacto(_prev: Resultado, fd: FormData): Promise<Resultado> {
  const usuario = await usuarioActual();
  const supabase = await crearClienteServidor();

  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "Falta el nombre." };

  const { data, error } = await supabase
    .from("contactos")
    .insert({
      nombre,
      telefono: texto(fd, "telefono"),
      email: texto(fd, "email"),
      interes: texto(fd, "interes"),
      monto: numero(fd, "monto"),
      moneda: (texto(fd, "moneda") as Moneda) ?? "USD",
      origen: "manual",
      vendedor_id: usuario.rol === "dueno" ? texto(fd, "vendedor_id") ?? usuario.id : usuario.id,
      proximo_paso: texto(fd, "proximo_paso"),
      proximo_paso_fecha: texto(fd, "proximo_paso_fecha"),
    })
    .select("id")
    .single();
  if (error) return { error: mensajeError(error) };

  const nota = texto(fd, "nota");
  if (nota) {
    await supabase.from("interacciones").insert({ contacto_id: data.id, autor_id: usuario.id, tipo: "nota", nota });
  }
  redirect(`/contactos/${data.id}`);
}

export async function guardarDatos(id: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  const usuario = await usuarioActual();
  const supabase = await crearClienteServidor();

  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "Falta el nombre." };

  const cambios: Record<string, unknown> = {
    nombre,
    telefono: texto(fd, "telefono"),
    email: texto(fd, "email"),
    interes: texto(fd, "interes"),
    monto: numero(fd, "monto"),
    moneda: texto(fd, "moneda") ?? "USD",
  };
  if (usuario.rol === "dueno" && texto(fd, "vendedor_id")) cambios.vendedor_id = texto(fd, "vendedor_id");

  const { error } = await supabase.from("contactos").update(cambios).eq("id", id);
  if (error) return { error: mensajeError(error) };
  refresh();
  return { ok: true, mensaje: "Datos guardados." };
}

export async function cambiarEtapa(
  id: string,
  etapa: Etapa,
  motivo?: MotivoPerdida | null,
  detalle?: string | null,
): Promise<Resultado> {
  await usuarioActual();
  const supabase = await crearClienteServidor();

  if (etapa === "perdido" && !motivo) return { error: "Para marcarlo como perdido elegí un motivo." };

  const cambios: Record<string, unknown> = { etapa };
  if (etapa === "perdido") {
    cambios.motivo_perdida = motivo;
    cambios.motivo_detalle = detalle?.trim() || null;
  }
  // Un contacto cerrado no necesita próximo paso.
  if (etapa === "ganado" || etapa === "perdido") {
    cambios.proximo_paso = null;
    cambios.proximo_paso_fecha = null;
  }

  const { data, error } = await supabase.from("contactos").update(cambios).eq("id", id).select("id");
  if (error) return { error: mensajeError(error) };
  if (!data?.length) return { error: "No se encontró el contacto." };
  refresh();
  return { ok: true };
}

export async function guardarProximoPaso(id: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  await usuarioActual();
  const supabase = await crearClienteServidor();

  const paso = texto(fd, "proximo_paso");
  const fecha = texto(fd, "proximo_paso_fecha");
  if ((paso && !fecha) || (!paso && fecha)) return { error: "El próximo paso necesita qué hacer y cuándo." };

  const { error } = await supabase
    .from("contactos")
    .update({ proximo_paso: paso, proximo_paso_fecha: fecha })
    .eq("id", id);
  if (error) return { error: mensajeError(error) };
  refresh();
  return { ok: true, mensaje: "Próximo paso guardado." };
}

export async function registrarInteraccion(contactoId: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  const usuario = await usuarioActual();
  const supabase = await crearClienteServidor();

  const nota = texto(fd, "nota");
  const tipo = (texto(fd, "tipo") ?? "nota") as TipoInteraccion;
  if (!nota) return { error: "Escribí qué pasó en la nota." };

  const { error } = await supabase
    .from("interacciones")
    .insert({ contacto_id: contactoId, autor_id: usuario.id, tipo, nota });
  if (error) return { error: mensajeError(error) };

  // Si cargó también el próximo paso, lo actualizamos en el mismo movimiento.
  const paso = texto(fd, "proximo_paso");
  const fecha = texto(fd, "proximo_paso_fecha");
  if (paso && fecha) {
    const { error: e2 } = await supabase
      .from("contactos")
      .update({ proximo_paso: paso, proximo_paso_fecha: fecha })
      .eq("id", contactoId);
    if (e2) return { error: mensajeError(e2) };
  }

  // El primer contacto con alguien nuevo lo pasa a "contactado".
  if (tipo !== "nota") {
    await supabase.from("contactos").update({ etapa: "contactado" }).eq("id", contactoId).eq("etapa", "nuevo");
  }

  refresh();
  return { ok: true, mensaje: "Interacción registrada." };
}

// ───────── Importación CSV ─────────

export type FilaImportacion = {
  nombre: string;
  telefono: string | null;
  email: string | null;
  interes: string | null;
  monto: number | null;
  moneda: Moneda;
  vendedor_id: string | null;
  nota: string | null;
};

export async function buscarExistentes(telefonos: string[], emails: string[]) {
  await usuarioActual();
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("buscar_existentes", { p_telefonos: telefonos, p_emails: emails });
  if (error) return { error: mensajeError(error), existentes: [] as { clave: string; vendedor_nombre: string }[] };
  return { existentes: (data ?? []) as { clave: string; vendedor_nombre: string }[] };
}

export async function importarContactos(filas: FilaImportacion[]): Promise<Resultado & { cantidad?: number }> {
  const usuario = await usuarioActual();
  const supabase = await crearClienteServidor();
  if (filas.length === 0) return { error: "No hay filas para importar." };
  if (filas.length > 2000) return { error: "Importá de a 2000 filas como máximo." };

  const aInsertar = filas.map((f) => ({
    nombre: f.nombre,
    telefono: f.telefono,
    email: f.email,
    interes: f.interes,
    monto: f.monto,
    moneda: f.moneda,
    origen: "csv" as const,
    vendedor_id: usuario.rol === "dueno" ? f.vendedor_id ?? usuario.id : usuario.id,
    proximo_paso: "Primer contacto (importado)",
    proximo_paso_fecha: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()),
  }));

  const { data, error } = await supabase.from("contactos").insert(aInsertar).select("id");
  if (error) return { error: mensajeError(error) };

  const notas = filas
    .map((f, i) => (f.nota ? { contacto_id: data[i].id, autor_id: usuario.id, tipo: "nota" as const, nota: f.nota } : null))
    .filter((n) => n !== null);
  if (notas.length) await supabase.from("interacciones").insert(notas);

  refresh();
  return { ok: true, cantidad: data.length };
}

// ───────── Formulario público ─────────

export async function enviarFormulario(_prev: Resultado, fd: FormData): Promise<Resultado> {
  // Campo trampa: los robots lo completan, las personas no lo ven.
  if (texto(fd, "empresa")) return { ok: true };

  const nombre = texto(fd, "nombre");
  const telefono = texto(fd, "telefono");
  const email = texto(fd, "email");
  if (!nombre) return { error: "Dejanos tu nombre." };
  if (!telefono && !email) return { error: "Dejanos un teléfono o un mail para contactarte." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("alta_formulario", {
    p_nombre: nombre,
    p_telefono: telefono,
    p_email: email,
    p_mensaje: texto(fd, "mensaje"),
    p_interes: texto(fd, "interes"),
  });
  if (error) return { error: "No pudimos enviar tu consulta. Probá de nuevo en un rato." };
  return { ok: true };
}

// ───────── Equipo ─────────

export async function actualizarPerfil(id: string, cambios: { activo?: boolean; rol?: Rol }): Promise<Resultado> {
  await duenoActual();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update(cambios).eq("id", id);
  if (error) return { error: mensajeError(error) };
  refresh();
  return { ok: true };
}
