"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioLogin() {
  const router = useRouter();
  const pendiente = useSearchParams().get("pendiente");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function ingresar(fd: FormData) {
    setEnviando(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
    });
    if (error) {
      setError("Mail o contraseña incorrectos.");
      setEnviando(false);
      return;
    }
    router.replace("/hoy");
    router.refresh();
  }

  return (
    <form action={ingresar} className="space-y-4">
      {pendiente && (
        <p className="rounded-md bg-aviso/10 p-3 text-sm text-amber-400">
          Tu cuenta todavía no está habilitada. Pedile al dueño que la active desde «Equipo».
        </p>
      )}
      <div>
        <label className="etiqueta" htmlFor="email">Mail</label>
        <input className="campo" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="etiqueta" htmlFor="password">Contraseña</label>
        <input className="campo" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="boton-marca w-full py-2.5" disabled={enviando}>{enviando ? "Ingresando…" : "Ingresar"}</button>
      <p className="text-center text-xs text-apagado">
        ¿Sos vendedor nuevo? <Link href="/registro" className="text-accion hover:underline">Creá tu cuenta</Link>
      </p>
    </form>
  );
}
