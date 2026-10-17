import Link from "next/link";
import { CalendarClock, Flame, Plus, TriangleAlert, CircleDashed } from "lucide-react";
import { usuarioActual } from "@/lib/auth";
import { listarContactos, listarVendedores } from "@/lib/datos";
import { diasEntre, fechaCorta, hoyISO } from "@/lib/formato";
import type { Contacto } from "@/lib/tipos";
import { BotonesContacto, EtiquetaEtapa } from "@/componentes/etiquetas";
import { FiltroVendedor } from "@/componentes/filtro-vendedor";

const DIAS_ENFRIAMIENTO = 7;

type ClaveGrupo = "vencidos" | "hoy" | "enfriados" | "sin-plan";
type Grupo = { clave: ClaveGrupo; titulo: string; descripcion: string; items: { c: Contacto; porque: string }[] };

const ESTILO: Record<ClaveGrupo, { icono: typeof Flame; acento: string; texto: string; fondo: string }> = {
  vencidos: { icono: TriangleAlert, acento: "border-l-marca", texto: "text-red-400", fondo: "bg-marca/15 text-red-300" },
  hoy: { icono: CalendarClock, acento: "border-l-aviso", texto: "text-amber-300", fondo: "bg-aviso/15 text-amber-300" },
  enfriados: { icono: Flame, acento: "border-l-marca", texto: "text-red-400", fondo: "bg-marca/15 text-red-300" },
  "sin-plan": { icono: CircleDashed, acento: "border-l-borde-fuerte", texto: "text-texto-2", fondo: "bg-panel-3 text-texto-2" },
};

// Ordena el día: primero lo atrasado, después lo de hoy, lo enfriado y lo que quedó sin plan.
function armarGrupos(contactos: Contacto[]): Grupo[] {
  const hoy = hoyISO();
  const grupos: Grupo[] = [
    { clave: "vencidos", titulo: "Vencidos", descripcion: "El próximo paso ya pasó de fecha", items: [] },
    { clave: "hoy", titulo: "Para hoy", descripcion: "Lo que quedó agendado para hoy", items: [] },
    { clave: "enfriados", titulo: "Enfriados", descripcion: `Más de ${DIAS_ENFRIAMIENTO} días sin actividad y sin próximo paso`, items: [] },
    { clave: "sin-plan", titulo: "Sin próximo paso", descripcion: "Todavía no se enfriaron, pero no tienen nada agendado", items: [] },
  ];
  const [vencidos, deHoy, enfriados, sinPlan] = grupos;

  for (const c of contactos) {
    if (!c.abierto) continue;
    if (c.vencido) {
      const dias = diasEntre(c.proximo_paso_fecha!, hoy);
      vencidos.items.push({
        c,
        porque: `Vencido hace ${dias} ${dias === 1 ? "día" : "días"}` + (c.enfriado ? ` · enfriado (${c.dias_sin_actividad} días sin actividad)` : ""),
      });
    } else if (c.para_hoy) {
      deHoy.items.push({ c, porque: c.etapa === "nuevo" ? "Contacto nuevo: hacer el primer llamado" : "Agendado para hoy" });
    } else if (c.enfriado) {
      enfriados.items.push({ c, porque: `${c.dias_sin_actividad} días sin actividad y sin próximo paso` });
    } else if (!c.proximo_paso_fecha) {
      const resta = DIAS_ENFRIAMIENTO - c.dias_sin_actividad;
      sinPlan.items.push({
        c,
        porque: c.etapa === "nuevo" ? "Nuevo sin primer contacto agendado" : `Se enfría en ${resta} ${resta === 1 ? "día" : "días"} si no se agenda nada`,
      });
    }
  }
  vencidos.items.sort((a, b) => (a.c.proximo_paso_fecha! < b.c.proximo_paso_fecha! ? -1 : 1));
  enfriados.items.sort((a, b) => b.c.dias_sin_actividad - a.c.dias_sin_actividad);
  return grupos;
}

export default async function Hoy({ searchParams }: PageProps<"/hoy">) {
  const usuario = await usuarioActual();
  const { vendedor } = await searchParams;
  const esDueno = usuario.rol === "dueno";
  const filtro = esDueno ? (typeof vendedor === "string" ? vendedor : null) : usuario.id;

  const [contactos, vendedores] = await Promise.all([
    listarContactos({ vendedorId: filtro, soloAbiertos: true }),
    esDueno ? listarVendedores() : Promise.resolve([]),
  ]);

  // El dueño ve el día de cada vendedor por separado.
  const porVendedor = esDueno && !filtro
    ? vendedores.map((v) => ({ v, contactos: contactos.filter((c) => c.vendedor_id === v.id) })).filter((x) => x.contactos.length)
    : [{ v: null, contactos }];

  const resumen = armarGrupos(contactos);
  const saludo = usuario.nombre.split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-marca first-letter:uppercase">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}
          </p>
          <h1 className="titulo-pagina mt-1">{esDueno ? "El día del equipo" : `Hola, ${saludo}`}</h1>
          <p className="text-sm text-apagado">A quién contactar hoy, por qué y cuál es el próximo paso.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {esDueno && <FiltroVendedor vendedores={vendedores} actual={filtro} />}
          <Link href="/contactos/nuevo" className="boton"><Plus className="h-4 w-4" /> Nuevo contacto</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumen.map((g) => {
          const e = ESTILO[g.clave];
          const Icono = e.icono;
          return (
            <div key={g.clave} className={`tarjeta border-l-4 ${e.acento} p-4`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-apagado uppercase">{g.titulo}</p>
                <span className={`rounded-lg p-1.5 ${e.fondo}`}><Icono className="h-4 w-4" /></span>
              </div>
              <p className={`mt-2 text-3xl font-bold ${g.items.length ? e.texto : "text-apagado"}`}>{g.items.length}</p>
            </div>
          );
        })}
      </div>

      {porVendedor.map(({ v, contactos }) => (
        <section key={v?.id ?? "yo"} className="space-y-5">
          {v && (
            <div className="flex items-center gap-3 border-b border-borde pb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-3 text-xs font-bold text-texto">
                {v.nombre.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <h2 className="text-lg font-semibold">{v.nombre}</h2>
              <span className="text-sm text-apagado">{contactos.length} abiertos</span>
            </div>
          )}
          <ListaDelDia grupos={armarGrupos(contactos)} />
        </section>
      ))}
    </div>
  );
}

function ListaDelDia({ grupos }: { grupos: Grupo[] }) {
  const total = grupos.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) {
    return <p className="tarjeta p-8 text-center text-apagado">Nada pendiente para hoy. Todo al día. 👌</p>;
  }
  return (
    <div className="space-y-6">
      {grupos.filter((g) => g.items.length).map((g) => {
        const e = ESTILO[g.clave];
        const Icono = e.icono;
        return (
          <div key={g.clave}>
            <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
              <Icono className={`h-4 w-4 ${e.texto}`} />
              {g.titulo}
              <span className="rounded-full bg-panel-3 px-2 py-0.5 text-xs text-texto-2">{g.items.length}</span>
              <span className="hidden font-normal text-apagado sm:inline">· {g.descripcion}</span>
            </h3>
            <ul className="space-y-2">
              {g.items.map(({ c, porque }) => (
                <li
                  key={c.id}
                  className={`tarjeta flex flex-wrap items-center gap-x-6 gap-y-3 border-l-4 px-4 py-3 transition hover:border-borde-fuerte ${e.acento} ${c.enfriado ? "bg-gradient-to-r from-marca/15 to-panel" : ""}`}
                >
                  <div className="min-w-48 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/contactos/${c.id}`} className="font-semibold text-texto hover:text-accion">{c.nombre}</Link>
                      <EtiquetaEtapa etapa={c.etapa} />
                    </div>
                    <p className="mt-0.5 text-xs text-apagado">{c.interes ?? "Sin vehículo de interés"}</p>
                  </div>
                  <div className="min-w-56 flex-[2] text-sm">
                    <p className={`font-medium ${c.enfriado || c.vencido ? "text-red-400" : e.texto}`}>{porque}</p>
                    <p className="text-texto-2">
                      <span className="text-apagado">Próximo paso: </span>
                      {c.proximo_paso ? `${c.proximo_paso} · ${fechaCorta(c.proximo_paso_fecha)}` : "sin definir"}
                    </p>
                  </div>
                  <BotonesContacto telefono={c.telefono} email={c.email} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
