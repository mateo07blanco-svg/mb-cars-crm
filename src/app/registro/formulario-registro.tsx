"use client";

import Link from "next/link";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioRegistro() {
  const [estado, setEstado] = useState<{ error?: string; listo?: boolean }>({});
  const [enviando, setEnviando] = useState(false);

  async function registrar(fd: FormData) {
    setEnviando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
      options: { data: { nombre: String(fd.get("nombre")).trim() }, emailRedirectTo: `${location.origin}/login` },
    });
    setEnviando(false);
    setEstado(error ? { error: error.message } : { listo: true });
  }

  if (estado.listo) {
    return (
      <p className="rounded-md bg-exito/10 p-3 text-sm text-green-400">
        Listo. Revisá tu mail para confirmar la cuenta y avisale al dueño para que te habilite.{" "}
        <Link href="/login" className="underline">Volver al ingreso</Link>
      </p>
    );
  }

  return (
    <form action={registrar} className="space-y-4">
      <div>
        <label className="etiqueta" htmlFor="nombre">Nombre</label>
        <input className="campo" id="nombre" name="nombre" required />
      </div>
      <div>
        <label className="etiqueta" htmlFor="email">Mail</label>
        <input className="campo" id="email" name="email" type="email" required />
      </div>
      <div>
        <label className="etiqueta" htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
        <input className="campo" id="password" name="password" type="password" minLength={8} required />
      </div>
      {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}
      <button className="boton-marca w-full py-2.5" disabled={enviando}>{enviando ? "Creando…" : "Crear cuenta"}</button>
    </form>
  );
}
