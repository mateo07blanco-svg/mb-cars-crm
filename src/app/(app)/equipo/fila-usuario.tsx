"use client";

import { useState, useTransition } from "react";
import { actualizarPerfil } from "@/lib/acciones";
import type { Rol } from "@/lib/tipos";

type Perfil = { id: string; nombre: string; email: string | null; rol: Rol; activo: boolean };

export function FilaUsuario({ usuario: u, esYo }: { usuario: Perfil; esYo: boolean }) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cambiar(cambios: { activo?: boolean; rol?: Rol }) {
    setError(null);
    startTransition(async () => {
      const r = await actualizarPerfil(u.id, cambios);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-48 flex-1">
        <p className="font-medium">
          {u.nombre}
          {!u.activo && <span className="ml-2 rounded bg-aviso/10 px-1.5 py-0.5 text-xs text-amber-400">Pendiente / pausado</span>}
        </p>
        <p className="text-xs text-apagado">{u.email}</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      {esYo ? (
        <span className="text-sm text-apagado">Dueño (vos)</span>
      ) : (
        <>
          <select className="campo w-auto" value={u.rol} disabled={pendiente} onChange={(e) => cambiar({ rol: e.target.value as Rol })}>
            <option value="vendedor">Vendedor</option>
            <option value="dueno">Dueño</option>
          </select>
          <button className={u.activo ? "boton-secundario" : "boton"} disabled={pendiente} onClick={() => cambiar({ activo: !u.activo })}>
            {u.activo ? "Pausar" : "Habilitar"}
          </button>
        </>
      )}
    </div>
  );
}
