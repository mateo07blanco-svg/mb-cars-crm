"use client";

import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function CambiarContrasena() {
  const [estado, setEstado] = useState<{ error?: string; ok?: boolean }>({});
  const [enviando, setEnviando] = useState(false);

  async function cambiar(fd: FormData) {
    const nueva = String(fd.get("nueva"));
    if (nueva !== String(fd.get("repetir"))) {
      setEstado({ error: "Las dos contraseñas no coinciden." });
      return;
    }
    setEnviando(true);
    const { error } = await crearClienteNavegador().auth.updateUser({ password: nueva });
    setEnviando(false);
    setEstado(error ? { error: error.message } : { ok: true });
  }

  return (
    <form action={cambiar} className="space-y-3">
      <div>
        <label className="etiqueta" htmlFor="nueva">Nueva contraseña (mínimo 8 caracteres)</label>
        <input className="campo" id="nueva" name="nueva" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      <div>
        <label className="etiqueta" htmlFor="repetir">Repetila</label>
        <input className="campo" id="repetir" name="repetir" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-green-700">Listo, la próxima vez entrá con la nueva.</p>}
      <button className="boton" disabled={enviando}>{enviando ? "Guardando…" : "Cambiar contraseña"}</button>
    </form>
  );
}
