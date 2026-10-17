"use client";

import { useActionState, useState, useTransition } from "react";
import {
  cambiarEtapa, guardarDatos, guardarProximoPaso, registrarInteraccion, type Resultado,
} from "@/lib/acciones";
import { hoyISO, sumarDias } from "@/lib/formato";
import { ETAPAS, TIPOS_INTERACCION, type Contacto, type Etapa } from "@/lib/tipos";
import { DialogoPerdido } from "@/componentes/dialogo-perdido";

function Aviso({ r }: { r: Resultado }) {
  if (r.error) return <p className="text-sm text-red-600">{r.error}</p>;
  if (r.mensaje) return <p className="text-sm text-green-700">{r.mensaje}</p>;
  return null;
}

function AtajosFecha({ onElegir }: { onElegir: (f: string) => void }) {
  const hoy = hoyISO();
  const atajos = [
    { t: "Hoy", f: hoy },
    { t: "Mañana", f: sumarDias(hoy, 1) },
    { t: "En 3 días", f: sumarDias(hoy, 3) },
    { t: "En una semana", f: sumarDias(hoy, 7) },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {atajos.map((a) => (
        <button key={a.t} type="button" className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100" onClick={() => onElegir(a.f)}>
          {a.t}
        </button>
      ))}
    </div>
  );
}

export function FormInteraccion({ id }: { id: string }) {
  const [fecha, setFecha] = useState("");
  const [clave, setClave] = useState(0);
  const [estado, accion, enviando] = useActionState(async (prev: Resultado, fd: FormData) => {
    const r = await registrarInteraccion(id, prev, fd);
    // Después de guardar bien, se limpia para la próxima.
    if (r.ok) {
      setFecha("");
      setClave((k) => k + 1);
    }
    return r;
  }, {});

  return (
    <form key={clave} action={accion} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {TIPOS_INTERACCION.map((t, i) => (
          <label key={t.valor} className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="tipo" value={t.valor} defaultChecked={i === 0} />
            {t.etiqueta}
          </label>
        ))}
      </div>
      <textarea name="nota" className="campo" rows={3} placeholder="¿Qué pasó? Ej.: Lo llamé, quiere ver la unidad el sábado." required />
      <div className="rounded-md bg-slate-50 p-3">
        <p className="etiqueta">Próximo paso (opcional, lo actualiza en la ficha)</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <input name="proximo_paso" className="campo" placeholder="Ej.: Confirmar test drive" />
          <input name="proximo_paso_fecha" type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="mt-2"><AtajosFecha onElegir={setFecha} /></div>
      </div>
      <div className="flex items-center gap-3">
        <button className="boton" disabled={enviando}>{enviando ? "Guardando…" : "Registrar"}</button>
        <Aviso r={estado} />
      </div>
    </form>
  );
}

export function FormProximoPaso({ id, paso, fecha }: { id: string; paso: string | null; fecha: string | null }) {
  const [estado, accion, enviando] = useActionState(guardarProximoPaso.bind(null, id), {});
  const [f, setF] = useState(fecha ?? "");
  return (
    <form action={accion} className="space-y-2">
      <input name="proximo_paso" className="campo" defaultValue={paso ?? ""} placeholder="Qué hay que hacer" />
      <input name="proximo_paso_fecha" type="date" className="campo" value={f} onChange={(e) => setF(e.target.value)} />
      <AtajosFecha onElegir={setF} />
      <div className="flex items-center gap-3">
        <button className="boton" disabled={enviando}>Guardar</button>
        <Aviso r={estado} />
      </div>
    </form>
  );
}

export function SelectorEtapa({ id, nombre, etapa }: { id: string; nombre: string; etapa: Etapa }) {
  const [pendiente, startTransition] = useTransition();
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiar(nueva: Etapa, motivo?: Parameters<typeof cambiarEtapa>[2], detalle?: string) {
    setError(null);
    startTransition(async () => {
      const r = await cambiarEtapa(id, nueva, motivo, detalle);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ETAPAS.map((e) => (
          <button
            key={e.valor}
            type="button"
            disabled={pendiente || e.valor === etapa}
            onClick={() => (e.valor === "perdido" ? setPidiendoMotivo(true) : cambiar(e.valor))}
            className={`rounded-md border px-2.5 py-1 text-sm ${e.valor === etapa ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 hover:bg-slate-100"}`}
          >
            {e.etiqueta}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {pidiendoMotivo && (
        <DialogoPerdido
          nombre={nombre}
          onCancelar={() => setPidiendoMotivo(false)}
          onConfirmar={(m, d) => {
            setPidiendoMotivo(false);
            cambiar("perdido", m, d);
          }}
        />
      )}
    </div>
  );
}

export function FormDatos({ contacto: c, vendedores }: { contacto: Contacto; vendedores: { id: string; nombre: string }[] }) {
  const [estado, accion, enviando] = useActionState(guardarDatos.bind(null, c.id), {});
  return (
    <form action={accion} className="space-y-2">
      <CamposContacto valores={c} />
      {vendedores.length > 0 && (
        <div>
          <label className="etiqueta">Vendedor asignado</label>
          <select name="vendedor_id" className="campo" defaultValue={c.vendedor_id}>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button className="boton" disabled={enviando}>Guardar datos</button>
        <Aviso r={estado} />
      </div>
    </form>
  );
}

export function CamposContacto({ valores }: { valores?: Partial<Contacto> }) {
  return (
    <>
      <div>
        <label className="etiqueta">Nombre *</label>
        <input name="nombre" className="campo" defaultValue={valores?.nombre ?? ""} required />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="etiqueta">Teléfono</label>
          <input name="telefono" className="campo" defaultValue={valores?.telefono ?? ""} placeholder="11 5555-1234" />
        </div>
        <div>
          <label className="etiqueta">Mail</label>
          <input name="email" type="email" className="campo" defaultValue={valores?.email ?? ""} />
        </div>
      </div>
      <div>
        <label className="etiqueta">Vehículo de interés</label>
        <input name="interes" className="campo" defaultValue={valores?.interes ?? ""} placeholder="Ej.: Toyota Hilux 0km" />
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <div>
          <label className="etiqueta">Monto estimado</label>
          <input name="monto" inputMode="numeric" className="campo" defaultValue={valores?.monto != null ? Math.round(Number(valores.monto)) : ""} />
        </div>
        <div>
          <label className="etiqueta">Moneda</label>
          <select name="moneda" className="campo" defaultValue={valores?.moneda ?? "USD"}>
            <option value="USD">USD</option>
            <option value="ARS">Pesos</option>
          </select>
        </div>
      </div>
    </>
  );
}
