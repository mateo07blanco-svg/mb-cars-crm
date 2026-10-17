"use client";

import { useActionState } from "react";
import { enviarFormulario } from "@/lib/acciones";

export function FormularioPublico() {
  const [estado, accion, enviando] = useActionState(enviarFormulario, {});

  if (estado.ok) {
    return <p className="rounded-md bg-exito/10 p-4 text-green-400">¡Gracias! Recibimos tu consulta y te vamos a contactar pronto.</p>;
  }

  return (
    <form action={accion} className="space-y-3">
      <div>
        <label className="etiqueta" htmlFor="nombre">Nombre y apellido *</label>
        <input className="campo" id="nombre" name="nombre" required maxLength={200} />
      </div>
      <div>
        <label className="etiqueta" htmlFor="telefono">Teléfono / WhatsApp</label>
        <input className="campo" id="telefono" name="telefono" inputMode="tel" />
      </div>
      <div>
        <label className="etiqueta" htmlFor="email">Mail</label>
        <input className="campo" id="email" name="email" type="email" />
      </div>
      <div>
        <label className="etiqueta" htmlFor="interes">¿Qué vehículo te interesa?</label>
        <input className="campo" id="interes" name="interes" placeholder="Ej.: Toyota Hilux" />
      </div>
      <div>
        <label className="etiqueta" htmlFor="mensaje">Mensaje</label>
        <textarea className="campo" id="mensaje" name="mensaje" rows={3} maxLength={2000} />
      </div>
      {/* Campo trampa para robots: oculto para las personas. */}
      <input name="empresa" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}
      <button className="boton-marca w-full py-2.5" disabled={enviando}>{enviando ? "Enviando…" : "Enviar consulta"}</button>
    </form>
  );
}
