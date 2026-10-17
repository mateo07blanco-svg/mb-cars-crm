import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { listarContactos, listarVendedores } from "@/lib/datos";
import { diasEntre, fechaCorta, hoyISO } from "@/lib/formato";
import type { Contacto } from "@/lib/tipos";
import { BotonesContacto, EtiquetaEtapa } from "@/componentes/etiquetas";
import { FiltroVendedor } from "@/componentes/filtro-vendedor";

const DIAS_ENFRIAMIENTO = 7;

type Grupo = { clave: string; titulo: string; descripcion: string; color: string; items: { c: Contacto; porque: string }[] };

// Ordena el día: primero lo atrasado, después lo de hoy, lo enfriado y lo que quedó sin plan.
function armarGrupos(contactos: Contacto[]): Grupo[] {
  const hoy = hoyISO();
  const grupos: Grupo[] = [
    { clave: "vencidos", titulo: "Vencidos", descripcion: "El próximo paso ya pasó de fecha.", color: "border-red-500", items: [] },
    { clave: "hoy", titulo: "Para hoy", descripcion: "Lo que quedó agendado para hoy.", color: "border-amber-500", items: [] },
    { clave: "enfriados", titulo: "Enfriados", descripcion: `Más de ${DIAS_ENFRIAMIENTO} días sin actividad y sin próximo paso.`, color: "border-red-500", items: [] },
    { clave: "sin-plan", titulo: "Sin próximo paso", descripcion: "Todavía no se enfriaron, pero no tienen nada agendado.", color: "border-slate-400", items: [] },
  ];
  const [vencidos, deHoy, enfriados, sinPlan] = grupos;

  for (const c of contactos) {
    if (!c.abierto) continue;
    if (c.vencido) {
      const dias = diasEntre(c.proximo_paso_fecha!, hoy);
      vencidos.items.push({
        c,
        porque: `Vencido hace ${dias} ${dias === 1 ? "día" : "días"}` + (c.enfriado ? `. Además está enfriado: ${c.dias_sin_actividad} días sin actividad.` : "."),
      });
    } else if (c.para_hoy) {
      deHoy.items.push({ c, porque: c.etapa === "nuevo" ? "Contacto nuevo: hacer el primer llamado." : "Agendado para hoy." });
    } else if (c.enfriado) {
      enfriados.items.push({ c, porque: `${c.dias_sin_actividad} días sin actividad y sin próximo paso.` });
    } else if (!c.proximo_paso_fecha) {
      const resta = DIAS_ENFRIAMIENTO - c.dias_sin_actividad;
      sinPlan.items.push({
        c,
        porque: c.etapa === "nuevo" ? "Nuevo sin primer contacto agendado." : `Se enfría en ${resta} ${resta === 1 ? "día" : "días"} si no se agenda nada.`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hoy</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {esDueno && <FiltroVendedor vendedores={vendedores} actual={filtro} />}
          <Link href="/contactos/nuevo" className="boton">+ Nuevo contacto</Link>
        </div>
      </div>

      {porVendedor.map(({ v, contactos }) => (
        <section key={v?.id ?? "yo"} className="space-y-4">
          {v && <h2 className="border-b border-slate-200 pb-1 text-lg font-semibold">{v.nombre}</h2>}
          <ListaDelDia grupos={armarGrupos(contactos)} />
        </section>
      ))}
    </div>
  );
}

function ListaDelDia({ grupos }: { grupos: Grupo[] }) {
  const total = grupos.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) {
    return <p className="tarjeta p-6 text-center text-slate-500">Nada pendiente para hoy. Todo al día.</p>;
  }
  return (
    <div className="space-y-5">
      {grupos.filter((g) => g.items.length).map((g) => (
        <div key={g.clave}>
          <h3 className="mb-2 text-sm font-semibold">
            {g.titulo} <span className="font-normal text-slate-500">· {g.items.length} · {g.descripcion}</span>
          </h3>
          <ul className="space-y-2">
            {g.items.map(({ c, porque }) => (
              <li
                key={c.id}
                className={`tarjeta flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 p-3 ${g.color} ${c.enfriado ? "bg-red-50" : ""}`}
              >
                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/contactos/${c.id}`} className="font-medium hover:underline">{c.nombre}</Link>
                    <EtiquetaEtapa etapa={c.etapa} />
                  </div>
                  <p className="text-xs text-slate-500">{c.interes ?? "Sin vehículo de interés"}</p>
                </div>
                <div className="min-w-56 flex-[2] text-sm">
                  <p className={c.enfriado || c.vencido ? "font-medium text-red-700" : "text-slate-700"}>{porque}</p>
                  <p className="text-slate-600">
                    <span className="text-slate-400">Próximo paso: </span>
                    {c.proximo_paso ? `${c.proximo_paso} (${fechaCorta(c.proximo_paso_fecha)})` : "sin definir"}
                  </p>
                </div>
                <BotonesContacto telefono={c.telefono} email={c.email} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
