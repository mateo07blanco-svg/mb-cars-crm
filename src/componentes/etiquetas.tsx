import type { Etapa } from "@/lib/tipos";
import { ETIQUETA_ETAPA } from "@/lib/tipos";
import { linkWhatsapp } from "@/lib/formato";

const COLOR_ETAPA: Record<Etapa, string> = {
  nuevo: "bg-sky-100 text-sky-800",
  contactado: "bg-indigo-100 text-indigo-800",
  propuesta: "bg-violet-100 text-violet-800",
  ganado: "bg-green-100 text-green-800",
  perdido: "bg-slate-200 text-slate-700",
};

export function EtiquetaEtapa({ etapa }: { etapa: Etapa }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${COLOR_ETAPA[etapa]}`}>{ETIQUETA_ETAPA[etapa]}</span>;
}

export function BotonesContacto({ telefono, email }: { telefono: string | null; email: string | null }) {
  const wa = linkWhatsapp(telefono);
  return (
    <div className="flex flex-wrap gap-1.5">
      {telefono && <a className="boton-secundario px-2 py-1 text-xs" href={`tel:${telefono.replace(/\s/g, "")}`}>Llamar</a>}
      {wa && <a className="boton-secundario px-2 py-1 text-xs" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
      {email && <a className="boton-secundario px-2 py-1 text-xs" href={`mailto:${email}`}>Mail</a>}
    </div>
  );
}
