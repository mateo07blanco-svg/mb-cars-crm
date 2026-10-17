import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { listarVendedores, obtenerContacto, obtenerHistorial } from "@/lib/datos";
import { dinero, fechaCorta, fechaHora } from "@/lib/formato";
import { ETIQUETA_MOTIVO, ETIQUETA_ORIGEN, ETIQUETA_TIPO, type Interaccion } from "@/lib/tipos";
import { BotonesContacto, EtiquetaEtapa } from "@/componentes/etiquetas";
import { FormDatos, FormInteraccion, FormProximoPaso, SelectorEtapa } from "./formularios";

export default async function Ficha({ params }: PageProps<"/contactos/[id]">) {
  const { id } = await params;
  const usuario = await usuarioActual();
  const [contacto, historial, vendedores] = await Promise.all([
    obtenerContacto(id),
    obtenerHistorial(id),
    usuario.rol === "dueno" ? listarVendedores() : Promise.resolve([]),
  ]);
  if (!contacto) notFound();
  const c = contacto;

  return (
    <div className="space-y-4">
      <Link href="/tablero" className="text-sm text-slate-500 hover:text-slate-900">← Volver al tablero</Link>

      {c.enfriado && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <strong>Enfriado:</strong> {c.dias_sin_actividad} días sin actividad y sin próximo paso. Registrá un contacto o agendá el próximo paso.
        </div>
      )}

      <div className="tarjeta flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{c.nombre}</h1>
            <EtiquetaEtapa etapa={c.etapa} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {[c.telefono, c.email].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm text-slate-500">
            {c.interes ?? "Sin vehículo de interés"}
            {c.monto != null && ` · ${dinero(c.monto, c.moneda)}`}
            {` · ${ETIQUETA_ORIGEN[c.origen]} · ${c.vendedor_nombre}`}
          </p>
          {c.etapa === "perdido" && c.motivo_perdida && (
            <p className="mt-1 text-sm text-slate-700">
              Perdido por: <strong>{ETIQUETA_MOTIVO[c.motivo_perdida]}</strong>
              {c.motivo_detalle && ` (${c.motivo_detalle})`}
            </p>
          )}
        </div>
        <BotonesContacto telefono={c.telefono} email={c.email} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="tarjeta p-4">
            <h2 className="mb-3 font-semibold">Registrar interacción</h2>
            <FormInteraccion id={c.id} />
          </section>

          <section className="tarjeta p-4">
            <h2 className="mb-3 font-semibold">Historial</h2>
            <Historial items={historial} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="tarjeta p-4">
            <h2 className="mb-1 font-semibold">Próximo paso</h2>
            {c.abierto ? (
              <>
                <p className={`mb-3 text-sm ${c.vencido ? "font-medium text-red-700" : "text-slate-600"}`}>
                  {c.proximo_paso ? `${fechaCorta(c.proximo_paso_fecha)}: ${c.proximo_paso}` : "Sin próximo paso definido."}
                  {c.vencido && " (vencido)"}
                </p>
                <FormProximoPaso id={c.id} paso={c.proximo_paso} fecha={c.proximo_paso_fecha} />
              </>
            ) : (
              <p className="text-sm text-slate-500">Contacto cerrado, no necesita próximo paso.</p>
            )}
          </section>

          <section className="tarjeta p-4">
            <h2 className="mb-3 font-semibold">Etapa</h2>
            <SelectorEtapa id={c.id} nombre={c.nombre} etapa={c.etapa} />
          </section>

          <section className="tarjeta p-4">
            <h2 className="mb-3 font-semibold">Datos</h2>
            <FormDatos contacto={c} vendedores={vendedores} />
          </section>
        </div>
      </div>
    </div>
  );
}

const ICONO: Record<string, string> = {
  llamada: "📞", whatsapp: "💬", mail: "✉️", visita: "🚗", nota: "📝", formulario: "🌐", sistema: "•",
};

function Historial({ items }: { items: Interaccion[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">Sin interacciones todavía.</p>;
  return (
    <ol className="space-y-3">
      {items.map((i) => (
        <li key={i.id} className={`flex gap-3 text-sm ${i.tipo === "sistema" ? "text-slate-500" : ""}`}>
          <span className="w-5 shrink-0 text-center">{ICONO[i.tipo]}</span>
          <div>
            <p className={i.tipo === "sistema" ? "italic" : ""}>{i.nota}</p>
            <p className="text-xs text-slate-400">
              {fechaHora(i.fecha)} · {ETIQUETA_TIPO[i.tipo]}
              {i.autor && ` · ${i.autor.nombre}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
