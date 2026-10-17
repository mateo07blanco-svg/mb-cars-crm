"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { cambiarEtapa } from "@/lib/acciones";
import { dinero, fechaCorta } from "@/lib/formato";
import { ETAPAS, ETIQUETA_MOTIVO, type Contacto, type Etapa, type MotivoPerdida } from "@/lib/tipos";
import { DialogoPerdido } from "@/componentes/dialogo-perdido";
import { COLOR_ETAPA } from "@/componentes/etiquetas";

export function Tablero({ contactos, mostrarVendedor }: { contactos: Contacto[]; mostrarVendedor: boolean }) {
  const [items, setItems] = useState(contactos);
  const [arrastrando, setArrastrando] = useState<Contacto | null>(null);
  const [pendientePerdido, setPendientePerdido] = useState<Contacto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Cuando el servidor manda datos nuevos, reemplazan a los locales.
  const [recibidos, setRecibidos] = useState(contactos);
  if (recibidos !== contactos) {
    setRecibidos(contactos);
    setItems(contactos);
  }

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  function mover(c: Contacto, etapa: Etapa, motivo?: MotivoPerdida, detalle?: string) {
    const anterior = items;
    setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, etapa, enfriado: false } : x)));
    setError(null);
    startTransition(async () => {
      const r = await cambiarEtapa(c.id, etapa, motivo, detalle);
      if (r.error) {
        setItems(anterior);
        setError(`${c.nombre}: ${r.error}`);
      }
    });
  }

  function alSoltar(e: DragEndEvent) {
    setArrastrando(null);
    const c = items.find((x) => x.id === e.active.id);
    const destino = e.over?.id as Etapa | undefined;
    if (!c || !destino || destino === c.etapa) return;
    if (destino === "perdido") setPendientePerdido(c);
    else mover(c, destino);
  }

  return (
    <>
      {error && <p className="rounded-md bg-marca/10 p-3 text-sm text-red-400">{error}</p>}
      <DndContext
        sensors={sensores}
        onDragStart={(e: DragStartEvent) => setArrastrando(items.find((x) => x.id === e.active.id) ?? null)}
        onDragEnd={alSoltar}
        onDragCancel={() => setArrastrando(null)}
      >
        <div className="grid grid-flow-col auto-cols-[minmax(210px,1fr)] gap-3 overflow-x-auto pb-4">
          {ETAPAS.map((etapa) => {
            const deEtapa = items.filter((c) => c.etapa === etapa.valor);
            return (
              <Columna key={etapa.valor} etapa={etapa.valor} titulo={etapa.etiqueta} contactos={deEtapa}>
                {deEtapa.map((c) => (
                  <Tarjeta key={c.id} contacto={c} mostrarVendedor={mostrarVendedor} />
                ))}
              </Columna>
            );
          })}
        </div>
        <DragOverlay>{arrastrando && <ContenidoTarjeta contacto={arrastrando} mostrarVendedor={mostrarVendedor} />}</DragOverlay>
      </DndContext>

      {pendientePerdido && (
        <DialogoPerdido
          nombre={pendientePerdido.nombre}
          onCancelar={() => setPendientePerdido(null)}
          onConfirmar={(motivo, detalle) => {
            mover(pendientePerdido, "perdido", motivo, detalle);
            setPendientePerdido(null);
          }}
        />
      )}
    </>
  );
}

function Columna({ etapa, titulo, contactos, children }: {
  etapa: Etapa; titulo: string; contactos: Contacto[]; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const enfriados = contactos.filter((c) => c.enfriado).length;
  const totalUsd = contactos.filter((c) => c.moneda === "USD").reduce((s, c) => s + (c.monto ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[65vh] flex-col overflow-hidden rounded-xl border transition-colors ${isOver ? "border-accion bg-accion/10" : "border-borde bg-panel/60"}`}
    >
      <div className={`h-1 ${COLOR_ETAPA[etapa].barra}`} />
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
            <span className={`h-2 w-2 rounded-full ${COLOR_ETAPA[etapa].punto}`} />
            {titulo}
          </h2>
          <span className="rounded-full bg-panel-3 px-2 py-0.5 text-xs font-semibold text-texto-2">{contactos.length}</span>
        </div>
        <p className="mt-1 flex items-center gap-2 text-xs text-apagado">
          {totalUsd > 0 && <span className="font-medium text-texto-2">{dinero(totalUsd, "USD")}</span>}
          {enfriados > 0 && <span className="font-semibold text-red-400">🔥 {enfriados} enfriado{enfriados > 1 && "s"}</span>}
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">{children}</div>
    </div>
  );
}

function Tarjeta({ contacto, mostrarVendedor }: { contacto: Contacto; mostrarVendedor: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contacto.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`touch-none ${isDragging ? "opacity-30" : ""}`}>
      <ContenidoTarjeta contacto={contacto} mostrarVendedor={mostrarVendedor} />
    </div>
  );
}

function ContenidoTarjeta({ contacto: c, mostrarVendedor }: { contacto: Contacto; mostrarVendedor: boolean }) {
  return (
    <div
      className={`cursor-grab rounded-lg border p-3 text-sm shadow-md shadow-black/30 transition hover:border-borde-fuerte active:cursor-grabbing ${
        c.enfriado ? "border-marca/70 bg-gradient-to-br from-marca/20 to-panel-2" : "border-borde bg-panel-2"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/contactos/${c.id}`} className="font-semibold text-texto hover:text-accion" onPointerDown={(e) => e.stopPropagation()}>
          {c.nombre}
        </Link>
        {c.monto != null && <span className="shrink-0 text-xs font-medium text-green-300">{dinero(c.monto, c.moneda)}</span>}
      </div>
      {c.interes && <p className="text-xs text-apagado">{c.interes}</p>}
      {c.abierto && (
        <p className={`mt-1 text-xs ${c.enfriado || c.vencido ? "font-medium text-red-400" : "text-texto-2"}`}>
          {c.enfriado
            ? `Enfriado · ${c.dias_sin_actividad} días sin actividad`
            : c.proximo_paso
              ? `${fechaCorta(c.proximo_paso_fecha)}: ${c.proximo_paso}`
              : "Sin próximo paso"}
        </p>
      )}
      {c.etapa === "perdido" && c.motivo_perdida && (
        <p className="mt-1 text-xs text-apagado">Motivo: {ETIQUETA_MOTIVO[c.motivo_perdida]}</p>
      )}
      {mostrarVendedor && <p className="mt-2 border-t border-borde pt-1.5 text-[11px] text-apagado">{c.vendedor_nombre}</p>}
    </div>
  );
}
