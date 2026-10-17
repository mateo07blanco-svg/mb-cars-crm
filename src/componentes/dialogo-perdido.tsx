"use client";

import { useState } from "react";
import { MOTIVOS, type MotivoPerdida } from "@/lib/tipos";

export function DialogoPerdido({ nombre, onCancelar, onConfirmar }: {
  nombre: string;
  onCancelar: () => void;
  onConfirmar: (motivo: MotivoPerdida, detalle: string) => void;
}) {
  const [motivo, setMotivo] = useState<MotivoPerdida | "">("");
  const [detalle, setDetalle] = useState("");
  const falta = !motivo || (motivo === "otro" && !detalle.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancelar}>
      <div className="tarjeta w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">¿Por qué se perdió?</h2>
        <p className="mb-4 text-sm text-slate-500">{nombre} queda guardado como perdido con este motivo.</p>
        <div className="space-y-2">
          {MOTIVOS.map((m) => (
            <label key={m.valor} className="flex items-center gap-2 text-sm">
              <input type="radio" name="motivo" checked={motivo === m.valor} onChange={() => setMotivo(m.valor)} />
              {m.etiqueta}
            </label>
          ))}
        </div>
        <textarea
          className="campo mt-3"
          rows={2}
          placeholder={motivo === "otro" ? "Contá cuál fue (obligatorio)" : "Detalle (opcional)"}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="boton-secundario" onClick={onCancelar}>Cancelar</button>
          <button className="boton bg-red-600 hover:bg-red-700" disabled={falta} onClick={() => motivo && onConfirmar(motivo, detalle)}>
            Marcar perdido
          </button>
        </div>
      </div>
    </div>
  );
}
