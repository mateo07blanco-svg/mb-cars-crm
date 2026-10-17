import Link from "next/link";
import {
  ArrowLeft, Car, DollarSign, Flame, Globe, Mail, MessageCircle, Phone, Settings2, StickyNote, User, type LucideIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { listarVendedores, obtenerContacto, obtenerHistorial } from "@/lib/datos";
import { dinero, fechaCorta, fechaHora } from "@/lib/formato";
import { ETIQUETA_MOTIVO, ETIQUETA_ORIGEN, ETIQUETA_TIPO, type Interaccion } from "@/lib/tipos";
import { BotonesContacto, COLOR_ETAPA, EtiquetaEtapa } from "@/componentes/etiquetas";
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
      <Link href="/tablero" className="inline-flex items-center gap-1 text-sm text-apagado hover:text-texto">
        <ArrowLeft className="h-4 w-4" /> Volver al tablero
      </Link>

      {c.enfriado && (
        <div className="flex items-center gap-3 rounded-xl border border-marca/60 bg-marca/15 p-4 text-sm text-red-300">
          <Flame className="h-5 w-5 shrink-0 text-marca" />
          <span><strong className="text-red-200">Enfriado:</strong> {c.dias_sin_actividad} días sin actividad y sin próximo paso. Registrá un contacto o agendá el próximo paso.</span>
        </div>
      )}

      <div className="tarjeta overflow-hidden">
        <div className={`h-1 ${COLOR_ETAPA[c.etapa].barra}`} />
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-panel-3 to-panel-2 text-lg font-bold text-texto ring-1 ring-borde">
              {c.nombre.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="titulo-pagina">{c.nombre}</h1>
                <EtiquetaEtapa etapa={c.etapa} />
              </div>
              <p className="mt-1 text-sm text-texto-2">{[c.telefono, c.email].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Dato icono={Car} texto={c.interes ?? "Sin vehículo de interés"} />
                {c.monto != null && <Dato icono={DollarSign} texto={dinero(c.monto, c.moneda)} resaltado />}
                <Dato icono={Globe} texto={ETIQUETA_ORIGEN[c.origen]} />
                <Dato icono={User} texto={c.vendedor_nombre} />
              </div>
              {c.etapa === "perdido" && c.motivo_perdida && (
                <p className="mt-3 text-sm text-texto-2">
                  Perdido por: <strong className="text-texto">{ETIQUETA_MOTIVO[c.motivo_perdida]}</strong>
                  {c.motivo_detalle && ` (${c.motivo_detalle})`}
                </p>
              )}
            </div>
          </div>
          <BotonesContacto telefono={c.telefono} email={c.email} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="tarjeta p-4">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-texto uppercase">Registrar interacción</h2>
            <FormInteraccion id={c.id} />
          </section>

          <section className="tarjeta p-4">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-texto uppercase">Historial</h2>
            <Historial items={historial} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="tarjeta p-4">
            <h2 className="mb-1 text-sm font-bold tracking-wide text-texto uppercase">Próximo paso</h2>
            {c.abierto ? (
              <>
                <p className={`mb-3 text-sm ${c.vencido ? "font-medium text-red-400" : "text-texto-2"}`}>
                  {c.proximo_paso ? `${fechaCorta(c.proximo_paso_fecha)}: ${c.proximo_paso}` : "Sin próximo paso definido."}
                  {c.vencido && " (vencido)"}
                </p>
                <FormProximoPaso id={c.id} paso={c.proximo_paso} fecha={c.proximo_paso_fecha} />
              </>
            ) : (
              <p className="text-sm text-apagado">Contacto cerrado, no necesita próximo paso.</p>
            )}
          </section>

          <section className="tarjeta p-4">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-texto uppercase">Etapa</h2>
            <SelectorEtapa id={c.id} nombre={c.nombre} etapa={c.etapa} />
          </section>

          <section className="tarjeta p-4">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-texto uppercase">Datos</h2>
            <FormDatos contacto={c} vendedores={vendedores} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Dato({ icono: Icono, texto, resaltado }: { icono: LucideIcon; texto: string; resaltado?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 ring-1 ring-inset ${resaltado ? "bg-exito/10 text-green-300 ring-exito/30" : "bg-panel-2 text-texto-2 ring-borde"}`}>
      <Icono className="h-3.5 w-3.5" /> {texto}
    </span>
  );
}

const ICONO: Record<string, { icono: LucideIcon; color: string }> = {
  llamada: { icono: Phone, color: "bg-accion/20 text-blue-300" },
  whatsapp: { icono: MessageCircle, color: "bg-exito/20 text-green-300" },
  mail: { icono: Mail, color: "bg-cyan-500/20 text-cyan-300" },
  visita: { icono: Car, color: "bg-aviso/20 text-amber-300" },
  nota: { icono: StickyNote, color: "bg-violet-500/20 text-violet-300" },
  formulario: { icono: Globe, color: "bg-marca/20 text-red-300" },
  sistema: { icono: Settings2, color: "bg-panel-3 text-apagado" },
};

function Historial({ items }: { items: Interaccion[] }) {
  if (!items.length) return <p className="text-sm text-apagado">Sin interacciones todavía.</p>;
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-borde">
      {items.map((i) => {
        const { icono: Icono, color } = ICONO[i.tipo];
        return (
          <li key={i.id} className="relative flex gap-3 text-sm">
            <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-panel ${color}`}>
              <Icono className="h-4 w-4" />
            </span>
            <div className="pt-1">
              <p className={i.tipo === "sistema" ? "text-apagado italic" : "text-texto"}>{i.nota}</p>
              <p className="mt-0.5 text-xs text-apagado">
                {fechaHora(i.fecha)} · {ETIQUETA_TIPO[i.tipo]}
                {i.autor && ` · ${i.autor.nombre}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
