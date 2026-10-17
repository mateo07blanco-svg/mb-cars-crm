"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ChartColumn, SquareKanban, Upload, UserCog, Users } from "lucide-react";

export function Navegacion({ esDueno, alertas }: { esDueno: boolean; alertas: number }) {
  const ruta = usePathname();
  const items = [
    { href: "/hoy", texto: "Hoy", icono: CalendarCheck, alerta: alertas },
    { href: "/tablero", texto: "Tablero", icono: SquareKanban },
    { href: "/contactos", texto: "Contactos", icono: Users },
    { href: "/importar", texto: "Importar CSV", icono: Upload },
    ...(esDueno
      ? [
          { href: "/panel", texto: "Panel del dueño", icono: ChartColumn, seccion: "Dirección" },
          { href: "/equipo", texto: "Equipo", icono: UserCog },
        ]
      : []),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((i) => {
        const activo = ruta === i.href || ruta.startsWith(i.href + "/");
        const Icono = i.icono;
        return (
          <div key={i.href} className="shrink-0">
            {"seccion" in i && (
              <p className="mt-5 mb-1 hidden px-3 text-[10px] font-semibold tracking-[0.2em] text-apagado uppercase lg:block">{i.seccion}</p>
            )}
            <Link
              href={i.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activo
                  ? "bg-marca/15 text-white shadow-[inset_3px_0_0_var(--color-marca)]"
                  : "text-texto-2 hover:bg-panel-2 hover:text-texto"
              }`}
            >
              <Icono className={`h-4 w-4 ${activo ? "text-marca" : "text-apagado group-hover:text-texto-2"}`} />
              <span className="whitespace-nowrap">{i.texto}</span>
              {!!i.alerta && (
                <span className="ml-auto rounded-full bg-marca px-2 py-0.5 text-xs font-bold text-white">{i.alerta}</span>
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
