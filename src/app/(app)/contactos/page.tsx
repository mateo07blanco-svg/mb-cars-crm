import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { listarContactos } from "@/lib/datos";
import { dinero, fechaCorta } from "@/lib/formato";
import { ETAPAS, ETIQUETA_MOTIVO, ETIQUETA_ORIGEN, type Etapa } from "@/lib/tipos";
import { EtiquetaEtapa } from "@/componentes/etiquetas";

export default async function Contactos({ searchParams }: PageProps<"/contactos">) {
  const usuario = await usuarioActual();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const etapa = typeof sp.etapa === "string" ? (sp.etapa as Etapa) : "";

  const todos = await listarContactos({ vendedorId: usuario.rol === "dueno" ? null : usuario.id });
  const digitos = q.replace(/\D/g, "");
  const filtrados = todos
    .filter((c) => !etapa || c.etapa === etapa)
    .filter((c) =>
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      (c.email ?? "").includes(q) ||
      (c.interes ?? "").toLowerCase().includes(q) ||
      (digitos.length >= 3 && (c.telefono ?? "").replace(/\D/g, "").includes(digitos)),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Contactos <span className="text-base font-normal text-slate-500">({filtrados.length})</span></h1>
        <Link href="/contactos/nuevo" className="boton">+ Nuevo contacto</Link>
      </div>

      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="campo max-w-sm" placeholder="Buscar por nombre, teléfono, mail o vehículo" />
        <select name="etapa" defaultValue={etapa} className="campo w-auto">
          <option value="">Todas las etapas</option>
          {ETAPAS.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
        </select>
        <button className="boton-secundario">Buscar</button>
      </form>

      <div className="tarjeta overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Etapa</th>
              <th className="px-3 py-2">Vehículo</th>
              <th className="px-3 py-2">Monto</th>
              <th className="px-3 py-2">Próximo paso / motivo</th>
              <th className="px-3 py-2">Origen</th>
              {usuario.rol === "dueno" && <th className="px-3 py-2">Vendedor</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className={`border-t border-slate-100 ${c.enfriado ? "bg-red-50" : ""}`}>
                <td className="px-3 py-2">
                  <Link href={`/contactos/${c.id}`} className="font-medium hover:underline">{c.nombre}</Link>
                  <div className="text-xs text-slate-500">{c.telefono ?? c.email}</div>
                </td>
                <td className="px-3 py-2"><EtiquetaEtapa etapa={c.etapa} /></td>
                <td className="px-3 py-2 text-slate-600">{c.interes}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{dinero(c.monto, c.moneda)}</td>
                <td className={`px-3 py-2 ${c.enfriado || c.vencido ? "text-red-700" : "text-slate-600"}`}>
                  {c.etapa === "perdido" && c.motivo_perdida
                    ? ETIQUETA_MOTIVO[c.motivo_perdida]
                    : c.enfriado
                      ? `Enfriado (${c.dias_sin_actividad} días)`
                      : c.proximo_paso ? `${fechaCorta(c.proximo_paso_fecha)}: ${c.proximo_paso}` : ""}
                </td>
                <td className="px-3 py-2 text-slate-500">{ETIQUETA_ORIGEN[c.origen]}</td>
                {usuario.rol === "dueno" && <td className="px-3 py-2 text-slate-500">{c.vendedor_nombre}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtrados.length && <p className="p-6 text-center text-sm text-slate-500">No hay contactos que coincidan.</p>}
      </div>
    </div>
  );
}
