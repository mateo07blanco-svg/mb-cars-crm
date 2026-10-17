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
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <DndContext
        sensors={sensores}
        onDragStart={(e: DragStartEvent) => setArrastrando(items.find((x) => x.id === e.active.id) ?? null)}
        onDragEnd={alSoltar}
        onDragCancel={() => setArrastrando(null)}
      >
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-4">
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
      className={`flex min-h-[60vh] flex-col rounded-lg border p-2 transition-colors ${isOver ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-100/70"}`}
    >
      <div className="mb-2 px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          <span className="text-xs text-slate-500">{contactos.length}</span>
        </div>
        <p className="text-xs text-slate-500">
          {totalUsd > 0 && dinero(totalUsd, "USD")}
          {enfriados > 0 && <span className="ml-2 font-medium text-red-600">{enfriados} enfriado{enfriados > 1 && "s"}</span>}
        </p>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
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
    <div className={`cursor-grab rounded-md border bg-white p-2.5 text-sm shadow-sm ${c.enfriado ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/contactos/${c.id}`} className="font-medium hover:underline" onPointerDown={(e) => e.stopPropagation()}>
          {c.nombre}
        </Link>
        {c.monto != null && <span className="shrink-0 text-xs text-slate-500">{dinero(c.monto, c.moneda)}</span>}
      </div>
      {c.interes && <p className="text-xs text-slate-500">{c.interes}</p>}
      {c.abierto && (
        <p className={`mt-1 text-xs ${c.enfriado || c.vencido ? "font-medium text-red-700" : "text-slate-600"}`}>
          {c.enfriado
            ? `Enfriado · ${c.dias_sin_actividad} días sin actividad`
            : c.proximo_paso
              ? `${fechaCorta(c.proximo_paso_fecha)}: ${c.proximo_paso}`
              : "Sin próximo paso"}
        </p>
      )}
      {c.etapa === "perdido" && c.motivo_perdida && (
        <p className="mt-1 text-xs text-slate-500">Motivo: {ETIQUETA_MOTIVO[c.motivo_perdida]}</p>
      )}
      {mostrarVendedor && <p className="mt-1 text-xs text-slate-400">{c.vendedor_nombre}</p>}
    </div>
  );
}
