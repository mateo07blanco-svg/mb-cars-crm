"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navegacion({ esDueno, alertas }: { esDueno: boolean; alertas: number }) {
  const ruta = usePathname();
  const items = [
    { href: "/hoy", texto: "Hoy", alerta: alertas },
    { href: "/tablero", texto: "Tablero" },
    { href: "/contactos", texto: "Contactos" },
    { href: "/importar", texto: "Importar CSV" },
    ...(esDueno ? [{ href: "/panel", texto: "Panel" }, { href: "/equipo", texto: "Equipo" }] : []),
  ];

  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {items.map((i) => {
        const activo = ruta === i.href || ruta.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-md px-3 py-1.5 ${activo ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {i.texto}
            {!!i.alerta && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">{i.alerta}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
