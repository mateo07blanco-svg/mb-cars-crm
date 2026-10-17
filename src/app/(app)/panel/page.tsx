import Link from "next/link";
import { duenoActual } from "@/lib/auth";
import { listarContactos, listarVendedores } from "@/lib/datos";
import { dinero, haceDias } from "@/lib/formato";
import { COLOR_ETAPA } from "@/componentes/etiquetas";
import { ETIQUETA_ETAPA, ETIQUETA_ORIGEN, MOTIVOS, type Contacto, type Origen } from "@/lib/tipos";

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
        <h1 className="titulo-pagina">Panel del dueño</h1>
        <div className="flex flex-wrap gap-1">
          {PERIODOS.map((x) => (
            <Link
              key={x.valor}
              href={`/panel?periodo=${x.valor}`}
              className={`rounded-md px-3 py-1.5 text-sm ${x.valor === periodo ? "bg-marca text-white" : "bg-panel text-texto-2 hover:bg-panel-3"}`}
            >
              {x.etiqueta}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero color="accion" titulo="Entraron" valor={entraron.length} detalle="contactos nuevos en el período" />
        <Numero color="exito" titulo="Ganados" valor={ganados.length} detalle={[dinero(suma(ganados, "USD"), "USD"), suma(ganados, "ARS") ? dinero(suma(ganados, "ARS"), "ARS") : ""].filter(Boolean).join(" + ")} />
        <Numero color="marca" titulo="Perdidos" valor={perdidos.length} detalle={cerrados ? `Se ganó el ${Math.round((ganados.length / cerrados) * 100)}% de lo cerrado` : ""} />
        <Numero color="aviso" titulo="Enfriados ahora" valor={abiertos.filter((c) => c.enfriado).length} detalle={`de ${abiertos.length} abiertos`} alerta />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta p-4">
          <h2 className="mb-4 text-sm font-bold tracking-wide text-texto uppercase">¿Por qué se perdieron?</h2>
          {motivos.length ? (
            <Barras filas={motivos.map((m) => ({ etiqueta: m.etiqueta, n: m.n }))} total={perdidos.length} color="bg-gradient-to-r from-marca-oscuro to-marca" />
          ) : <p className="text-sm text-apagado">No hubo perdidos en el período.</p>}
        </section>

        <section className="tarjeta p-4">
          <h2 className="mb-4 text-sm font-bold tracking-wide text-texto uppercase">¿De dónde vienen?</h2>
          <Barras filas={origenes.map((x) => ({ etiqueta: ETIQUETA_ORIGEN[x.o], n: x.n }))} total={entraron.length} color="bg-gradient-to-r from-accion-oscuro to-accion" />
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs text-apagado">
              <tr><th className="py-1">Origen</th><th>Entraron</th><th>Ya ganados</th><th>Siguen abiertos</th></tr>
            </thead>
            <tbody>
              {origenes.map((x) => (
                <tr key={x.o} className="border-t border-borde">
                  <td className="py-1.5">{ETIQUETA_ORIGEN[x.o]}</td>
                  <td>{x.n}</td>
                  <td>{x.ganados}{x.n ? <span className="text-apagado"> ({Math.round((x.ganados / x.n) * 100)}%)</span> : null}</td>
                  <td>{x.abiertos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="tarjeta overflow-x-auto p-4">
        <h2 className="mb-4 text-sm font-bold tracking-wide text-texto uppercase">Por vendedor</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-apagado">
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
                <tr key={v.id} className="border-t border-borde">
                  <td className="py-1.5"><Link href={`/hoy?vendedor=${v.id}`} className="hover:underline">{v.nombre}</Link></td>
                  <td>{suyos(entraron).length}</td>
                  <td>{suyos(ganados).length}</td>
                  <td>{suyos(perdidos).length}</td>
                  <td>{abiertosV.length}</td>
                  <td>{abiertosV.filter((c) => c.vencido).length}</td>
                  <td className={enfriados ? "font-medium text-red-400" : ""}>{enfriados}</td>
                  <td>{dinero(suma(abiertosV, "USD"), "USD")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="tarjeta p-4">
        <h2 className="mb-4 text-sm font-bold tracking-wide text-texto uppercase">Abiertos hoy por etapa</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["nuevo", "contactado", "propuesta"] as const).map((e) => {
            const deEtapa = abiertos.filter((c) => c.etapa === e);
            return (
              <div key={e} className="rounded-lg border border-borde bg-panel-2 p-4">
                <div className={`mb-3 h-1 w-10 rounded-full ${COLOR_ETAPA[e].barra}`} />
                <p className="text-sm text-texto-2">{ETIQUETA_ETAPA[e]}</p>
                <p className="text-2xl font-bold">{deEtapa.length}</p>
                <p className="text-xs text-apagado">{dinero(suma(deEtapa, "USD"), "USD")} en juego</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const COLOR_NUMERO = {
  accion: { borde: "border-t-accion", texto: "text-blue-300", brillo: "from-accion/15" },
  exito: { borde: "border-t-exito", texto: "text-green-300", brillo: "from-exito/15" },
  marca: { borde: "border-t-marca", texto: "text-red-300", brillo: "from-marca/15" },
  aviso: { borde: "border-t-aviso", texto: "text-amber-300", brillo: "from-aviso/15" },
};

function Numero({ titulo, valor, detalle, alerta, color }: {
  titulo: string; valor: number; detalle?: string; alerta?: boolean; color: keyof typeof COLOR_NUMERO;
}) {
  const c = COLOR_NUMERO[color];
  return (
    <div className={`tarjeta border-t-4 bg-gradient-to-b to-panel p-5 ${c.borde} ${c.brillo}`}>
      <p className="text-xs font-semibold tracking-wide text-apagado uppercase">{titulo}</p>
      <p className={`mt-1 text-4xl font-bold ${alerta && valor ? "text-red-400" : c.texto}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-apagado">{detalle}</p>}
    </div>
  );
}

function Barras({ filas, total, color }: { filas: { etiqueta: string; n: number }[]; total: number; color: string }) {
  const max = Math.max(1, ...filas.map((f) => f.n));
  return (
    <ul className="space-y-2">
      {filas.map((f) => (
        <li key={f.etiqueta} className="grid grid-cols-[150px_1fr_70px] items-center gap-2 text-sm">
          <span className="truncate text-texto-2">{f.etiqueta}</span>
          <span className="h-3 overflow-hidden rounded-full bg-panel-3">
            <span className={`block h-3 rounded-full ${color}`} style={{ width: `${(f.n / max) * 100}%` }} />
          </span>
          <span className="text-right text-texto-2">
            {f.n} {total ? <span className="text-xs text-apagado">({Math.round((f.n / total) * 100)}%)</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
