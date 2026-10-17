export type Rol = "dueno" | "vendedor";
export type Etapa = "nuevo" | "contactado" | "propuesta" | "ganado" | "perdido";
export type Origen = "formulario" | "manual" | "csv";
export type Moneda = "USD" | "ARS";
export type TipoInteraccion = "llamada" | "whatsapp" | "mail" | "visita" | "nota" | "formulario" | "sistema";
export type MotivoPerdida =
  | "precio" | "financiacion_rechazada" | "compro_en_otra" | "no_responde" | "sin_unidad" | "desistio" | "otro";

export type Usuario = { id: string; nombre: string; rol: Rol };

export type Contacto = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  origen: Origen;
  interes: string | null;
  etapa: Etapa;
  motivo_perdida: MotivoPerdida | null;
  motivo_detalle: string | null;
  monto: number | null;
  moneda: Moneda;
  vendedor_id: string;
  vendedor_nombre: string;
  proximo_paso: string | null;
  proximo_paso_fecha: string | null;
  ultima_actividad: string;
  creado_en: string;
  cerrado_en: string | null;
  abierto: boolean;
  enfriado: boolean;
  vencido: boolean;
  para_hoy: boolean;
  dias_sin_actividad: number;
};

export type Interaccion = {
  id: string;
  tipo: TipoInteraccion;
  nota: string;
  fecha: string;
  autor: { nombre: string } | null;
};

export const ETAPAS: { valor: Etapa; etiqueta: string }[] = [
  { valor: "nuevo", etiqueta: "Nuevo" },
  { valor: "contactado", etiqueta: "Contactado" },
  { valor: "propuesta", etiqueta: "Propuesta" },
  { valor: "ganado", etiqueta: "Ganado" },
  { valor: "perdido", etiqueta: "Perdido" },
];

export const ETIQUETA_ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.valor, e.etiqueta])) as Record<Etapa, string>;

export const ETIQUETA_ORIGEN: Record<Origen, string> = {
  formulario: "Formulario web",
  manual: "Carga manual",
  csv: "Importación CSV",
};

export const MOTIVOS: { valor: MotivoPerdida; etiqueta: string }[] = [
  { valor: "precio", etiqueta: "Precio" },
  { valor: "financiacion_rechazada", etiqueta: "Financiación rechazada" },
  { valor: "compro_en_otra", etiqueta: "Compró en otra concesionaria" },
  { valor: "no_responde", etiqueta: "No responde" },
  { valor: "sin_unidad", etiqueta: "No había la unidad" },
  { valor: "desistio", etiqueta: "Desistió" },
  { valor: "otro", etiqueta: "Otro" },
];

export const ETIQUETA_MOTIVO = Object.fromEntries(MOTIVOS.map((m) => [m.valor, m.etiqueta])) as Record<MotivoPerdida, string>;

export const TIPOS_INTERACCION: { valor: TipoInteraccion; etiqueta: string }[] = [
  { valor: "llamada", etiqueta: "Llamada" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
  { valor: "mail", etiqueta: "Mail" },
  { valor: "visita", etiqueta: "Visita al salón" },
  { valor: "nota", etiqueta: "Nota" },
];

export const ETIQUETA_TIPO: Record<TipoInteraccion, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  mail: "Mail",
  visita: "Visita",
  nota: "Nota",
  formulario: "Formulario web",
  sistema: "Sistema",
};
