import Link from "next/link";
import { duenoActual } from "@/lib/auth";
import { listarContactos, listarVendedores } from "@/lib/datos";
import { dinero, haceDias } from "@/lib/formato";
import { ETAPAS, ETIQUETA_ORIGEN, MOTIVOS, type Contacto, type Origen } from "@/lib/tipos";

const PERIODOS = [
  { valor: "7", etiqueta: "Últimos 7 días" },
  { valor: "30", etiqueta: "Últimos 30 días" },
  { valor: "90", etiqueta: "Últimos 90 días" },
  { valor: "todo", etiqueta: "Todo" },
];

export default async function Panel({ searchParams }: PageProps<"/panel">) {
  await duenoActual();
  const { periodo: p } = await searchParams;
  const periodo = PERIODOS.some((x) => x.valor === p) ? (p as string) : "30";
  const desde = periodo === "todo" ? 0 : haceDias(Number(periodo));
  const enPeriodo = (iso: string | null) => !!iso && Date.parse(iso) >= desde;

  const [contactos, vendedores] = await Promise.all([listarContactos(), listarVendedores()]);
  const entraron = contactos.filter((c) => enPeriodo(c.creado_en));
  const ganados = contactos.filter((c) => c.etapa === "ganado" && enPeriodo(c.cerrado_en));
  const perdidos = contactos.filter((c) => c.etapa === "perdido" && enPeriodo(c.cerrado_en));
  const cerrados = ganados.length + perdidos.length;
  const suma = (xs: Contacto[], m: "USD" | "ARS") => xs.filter((c) => c.moneda === m).reduce((s, c) => s + (c.monto ?? 0), 0);

  const motivos = MOTIVOS.map((m) => ({ ...m, n: perdidos.filter((c) => c.motivo_perdida === m.valor).length }))
    .filter((m) => m.n)
    .sort((a, b) => b.n - a.n);

  const origenes = (Object.keys(ETIQUETA_ORIGEN) as Origen[]).map((o) => {
    const deOrigen = entraron.filter((c) => c.origen === o);
    const ganadosOrigen = deOrigen.filter((c) => c.etapa === "ganado").length;
    return { o, n: deOrigen.length, ganados: ganadosOrigen, abiertos: deOrigen.filter((c) => c.abierto).length };
  });

  const abiertos = contactos.filter((c) => c.abierto);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Panel del dueño</h1>
        <div className="flex flex-wrap gap-1">
          {PERIODOS.map((x) => (
            <Link
              key={x.valor}
              href={`/panel?periodo=${x.valor}`}
              className={`rounded-md px-3 py-1.5 text-sm ${x.valor === periodo ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              {x.etiqueta}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero titulo="Entraron" valor={entraron.length} detalle="contactos nuevos en el período" />
        <Numero titulo="Ganados" valor={ganados.length} detalle={[dinero(suma(ganados, "USD"), "USD"), suma(ganados, "ARS") ? dinero(suma(ganados, "ARS"), "ARS") : ""].filter(Boolean).join(" + ")} />
        <Numero titulo="Perdidos" valor={perdidos.length} detalle={cerrados ? `Se ganó el ${Math.round((ganados.length / cerrados) * 100)}% de lo cerrado` : ""} />
        <Numero titulo="Enfriados ahora" valor={abiertos.filter((c) => c.enfriado).length} detalle={`de ${abiertos.length} abiertos`} alerta />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta p-4">
          <h2 className="mb-3 font-semibold">¿Por qué se perdieron?</h2>
          {motivos.length ? (
            <Barras filas={motivos.map((m) => ({ etiqueta: m.etiqueta, n: m.n }))} total={perdidos.length} color="bg-red-400" />
          ) : <p className="text-sm text-slate-500">No hubo perdidos en el período.</p>}
        </section>

        <section className="tarjeta p-4">
          <h2 className="mb-3 font-semibold">¿De dónde vienen?</h2>
          <Barras filas={origenes.map((x) => ({ etiqueta: ETIQUETA_ORIGEN[x.o], n: x.n }))} total={entraron.length} color="bg-blue-400" />
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr><th className="py-1">Origen</th><th>Entraron</th><th>Ya ganados</th><th>Siguen abiertos</th></tr>
            </thead>
            <tbody>
              {origenes.map((x) => (
                <tr key={x.o} className="border-t border-slate-100">
                  <td className="py-1.5">{ETIQUETA_ORIGEN[x.o]}</td>
                  <td>{x.n}</td>
                  <td>{x.ganados}{x.n ? <span className="text-slate-400"> ({Math.round((x.ganados / x.n) * 100)}%)</span> : null}</td>
                  <td>{x.abiertos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="tarjeta overflow-x-auto p-4">
        <h2 className="mb-3 font-semibold">Por vendedor</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-1">Vendedor</th><th>Entraron</th><th>Ganados</th><th>Perdidos</th>
              <th>Abiertos</th><th>Vencidos</th><th>Enfriados</th><th>En juego (USD)</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v) => {
              const suyos = (xs: Contacto[]) => xs.filter((c) => c.vendedor_id === v.id);
              const abiertosV = suyos(abiertos);
              const enfriados = abiertosV.filter((c) => c.enfriado).length;
              return (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="py-1.5"><Link href={`/hoy?vendedor=${v.id}`} className="hover:underline">{v.nombre}</Link></td>
                  <td>{suyos(entraron).length}</td>
                  <td>{suyos(ganados).length}</td>
                  <td>{suyos(perdidos).length}</td>
                  <td>{abiertosV.length}</td>
                  <td>{abiertosV.filter((c) => c.vencido).length}</td>
                  <td className={enfriados ? "font-medium text-red-600" : ""}>{enfriados}</td>
                  <td>{dinero(suma(abiertosV, "USD"), "USD")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="tarjeta p-4">
        <h2 className="mb-3 font-semibold">Abiertos hoy por etapa</h2>
        <Barras
          filas={ETAPAS.filter((e) => ["nuevo", "contactado", "propuesta"].includes(e.valor)).map((e) => ({ etiqueta: e.etiqueta, n: abiertos.filter((c) => c.etapa === e.valor).length }))}
          total={abiertos.length}
          color="bg-violet-400"
        />
      </section>
    </div>
  );
}

function Numero({ titulo, valor, detalle, alerta }: { titulo: string; valor: number; detalle?: string; alerta?: boolean }) {
  return (
    <div className="tarjeta p-4">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className={`text-3xl font-semibold ${alerta && valor ? "text-red-600" : ""}`}>{valor}</p>
      {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}

function Barras({ filas, total, color }: { filas: { etiqueta: string; n: number }[]; total: number; color: string }) {
  const max = Math.max(1, ...filas.map((f) => f.n));
  return (
    <ul className="space-y-2">
      {filas.map((f) => (
        <li key={f.etiqueta} className="grid grid-cols-[150px_1fr_70px] items-center gap-2 text-sm">
          <span className="truncate text-slate-700">{f.etiqueta}</span>
          <span className="h-4 rounded bg-slate-100">
            <span className={`block h-4 rounded ${color}`} style={{ width: `${(f.n / max) * 100}%` }} />
          </span>
          <span className="text-right text-slate-600">
            {f.n} {total ? <span className="text-xs text-slate-400">({Math.round((f.n / total) * 100)}%)</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
