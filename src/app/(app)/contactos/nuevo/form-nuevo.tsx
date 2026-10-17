"use client";

import { useActionState } from "react";
import { crearContacto } from "@/lib/acciones";
import { hoyISO } from "@/lib/formato";
import { CamposContacto } from "../[id]/formularios";

export function FormNuevo({ vendedores, usuarioId }: { vendedores: { id: string; nombre: string }[]; usuarioId: string }) {
  const [estado, accion, enviando] = useActionState(crearContacto, {});
  return (
    <form action={accion} className="space-y-3">
      <CamposContacto />
      {vendedores.length > 0 && (
        <div>
          <label className="etiqueta">Asignar a</label>
          <select name="vendedor_id" className="campo" defaultValue={usuarioId}>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
        <div>
          <label className="etiqueta">Próximo paso</label>
          <input name="proximo_paso" className="campo" defaultValue="Primer contacto" />
        </div>
        <div>
          <label className="etiqueta">Fecha</label>
          <input name="proximo_paso_fecha" type="date" className="campo" defaultValue={hoyISO()} />
        </div>
      </div>
      <div>
        <label className="etiqueta">Nota inicial</label>
        <textarea name="nota" className="campo" rows={3} placeholder="Ej.: Pasó por el salón preguntando por la Hilux." />
      </div>
      {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}
      <button className="boton" disabled={enviando}>{enviando ? "Guardando…" : "Guardar contacto"}</button>
    </form>
  );
}
