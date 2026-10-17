import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Etapa } from "@/lib/tipos";
import { ETIQUETA_ETAPA } from "@/lib/tipos";
import { linkWhatsapp } from "@/lib/formato";

// Un color por etapa, usado en etiquetas, columnas del tablero y gráficos.
export const COLOR_ETAPA: Record<Etapa, { etiqueta: string; barra: string; punto: string }> = {
  nuevo: { etiqueta: "bg-accion/15 text-blue-300 ring-accion/30", barra: "bg-accion", punto: "bg-accion" },
  contactado: { etiqueta: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30", barra: "bg-cyan-500", punto: "bg-cyan-400" },
  propuesta: { etiqueta: "bg-aviso/15 text-amber-300 ring-aviso/30", barra: "bg-aviso", punto: "bg-aviso" },
  ganado: { etiqueta: "bg-exito/15 text-green-300 ring-exito/30", barra: "bg-exito", punto: "bg-exito" },
  perdido: { etiqueta: "bg-panel-3 text-apagado ring-borde-fuerte", barra: "bg-borde-fuerte", punto: "bg-apagado" },
};

export function EtiquetaEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${COLOR_ETAPA[etapa].etiqueta}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${COLOR_ETAPA[etapa].punto}`} />
      {ETIQUETA_ETAPA[etapa]}
    </span>
  );
}

export function BotonesContacto({ telefono, email }: { telefono: string | null; email: string | null }) {
  const wa = linkWhatsapp(telefono);
  const base = "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition";
  return (
    <div className="flex flex-wrap gap-1.5">
      {telefono && (
        <a className={`${base} border-accion/40 bg-accion/10 text-blue-300 hover:bg-accion/20`} href={`tel:${telefono.replace(/\s/g, "")}`}>
          <Phone className="h-3.5 w-3.5" /> Llamar
        </a>
      )}
      {wa && (
        <a className={`${base} border-exito/40 bg-exito/10 text-green-300 hover:bg-exito/20`} href={wa} target="_blank" rel="noreferrer">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      )}
      {email && (
        <a className={`${base} border-borde bg-panel-2 text-texto-2 hover:bg-panel-3`} href={`mailto:${email}`}>
          <Mail className="h-3.5 w-3.5" /> Mail
        </a>
      )}
    </div>
  );
}
