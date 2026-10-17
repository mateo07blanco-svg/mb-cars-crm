import type { Moneda } from "./tipos";

const ZONA = "America/Argentina/Buenos_Aires";

// Momento (en ms) de hace N días; sirve para filtrar por período.
export function haceDias(dias: number): number {
  return Date.now() - dias * 86400000;
}

export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

export function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(fechaISO + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desdeISO: string, hastaISO: string): number {
  return Math.round((Date.parse(hastaISO + "T12:00:00Z") - Date.parse(desdeISO + "T12:00:00Z")) / 86400000);
}

export function fechaCorta(fechaISO: string | null): string {
  if (!fechaISO) return "Sin fecha";
  const hoy = hoyISO();
  const dif = diasEntre(hoy, fechaISO.slice(0, 10));
  if (dif === 0) return "Hoy";
  if (dif === 1) return "Mañana";
  if (dif === -1) return "Ayer";
  return new Date(fechaISO.slice(0, 10) + "T12:00:00Z").toLocaleDateString("es-AR", {
    day: "numeric", month: "short", timeZone: "UTC",
  });
}

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA,
  });
}

export function dinero(monto: number | null, moneda: Moneda): string {
  if (monto == null) return "";
  return (moneda === "USD" ? "US$ " : "$ ") + Math.round(monto).toLocaleString("es-AR");
}

export function soloDigitos(telefono: string | null): string {
  return (telefono ?? "").replace(/\D/g, "");
}

export function linkWhatsapp(telefono: string | null): string | null {
  let d = soloDigitos(telefono);
  if (d.length < 8) return null;
  if (!d.startsWith("54")) d = "549" + d.replace(/^0/, "");
  return "https://wa.me/" + d;
}
