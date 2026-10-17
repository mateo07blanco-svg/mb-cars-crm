import { Suspense } from "react";
import { usuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "@/lib/acciones";
import { Navegacion } from "./navegacion";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold">MB Cars</span>
          <Suspense fallback={<div className="h-8" />}>
            <Encabezado />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Suspense fallback={<Cargando />}>{children}</Suspense>
      </main>
    </div>
  );
}

function Cargando() {
  return <p className="text-sm text-slate-500">Cargando…</p>;
}

async function Encabezado() {
  const usuario = await usuarioActual();
  const supabase = await crearClienteServidor();
  // La alerta del menú: lo que el usuario tiene atrasado o enfriado.
  let q = supabase.from("contactos_estado").select("id", { count: "exact", head: true }).or("vencido.eq.true,enfriado.eq.true");
  if (usuario.rol === "vendedor") q = q.eq("vendedor_id", usuario.id);
  const { count } = await q;

  return (
    <>
      <Navegacion esDueno={usuario.rol === "dueno"} alertas={count ?? 0} />
      <div className="ml-auto flex items-center gap-3 text-sm">
        <span className="text-slate-600">
          {usuario.nombre}
          {usuario.rol === "dueno" && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">Dueño</span>}
        </span>
        <form action={cerrarSesion}>
          <button className="text-slate-500 hover:text-slate-900">Salir</button>
        </form>
      </div>
    </>
  );
}
