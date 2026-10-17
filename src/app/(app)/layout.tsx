import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { usuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "@/lib/acciones";
import { Logo } from "@/componentes/logo";
import { Navegacion } from "./navegacion";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-fondo">
      <aside className="border-b border-borde bg-panel lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0">
        {/* Franja roja de marca arriba del menú */}
        <div className="h-1 bg-gradient-to-r from-marca via-marca to-marca-oscuro" />
        <div className="flex items-center justify-between px-5 py-4 lg:py-6">
          <Link href="/hoy"><Logo /></Link>
        </div>
        <Suspense fallback={<div className="flex-1" />}>
          <Lateral />
        </Suspense>
      </aside>
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<Cargando />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}

function Cargando() {
  return (
    <div className="flex items-center gap-3 text-sm text-apagado">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-borde border-t-marca" />
      Cargando…
    </div>
  );
}

async function Lateral() {
  const usuario = await usuarioActual();
  const supabase = await crearClienteServidor();
  // La alerta del menú: lo que el usuario tiene atrasado o enfriado.
  let q = supabase.from("contactos_estado").select("id", { count: "exact", head: true }).or("vencido.eq.true,enfriado.eq.true");
  if (usuario.rol === "vendedor") q = q.eq("vendedor_id", usuario.id);
  const { count } = await q;
  const iniciales = usuario.nombre.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <Navegacion esDueno={usuario.rol === "dueno"} alertas={count ?? 0} />
      <div className="flex items-center gap-3 border-t border-borde px-4 py-3 lg:mt-auto lg:py-4">
        <Link href="/cuenta" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 hover:bg-panel-2" title="Mi cuenta">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accion to-accion-oscuro text-sm font-bold text-white">
            {iniciales}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-texto">{usuario.nombre}</span>
            <span className="block text-xs text-apagado">{usuario.rol === "dueno" ? "Dueño" : "Vendedor"}</span>
          </span>
        </Link>
        <form action={cerrarSesion}>
          <button className="rounded-lg p-2 text-apagado hover:bg-panel-2 hover:text-marca" title="Salir">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
