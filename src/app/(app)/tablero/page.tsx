import { usuarioActual } from "@/lib/auth";
import { listarContactos, listarVendedores } from "@/lib/datos";
import { haceDias } from "@/lib/formato";
import { FiltroVendedor } from "@/componentes/filtro-vendedor";
import { Tablero } from "./tablero";

const DIAS_CERRADOS_VISIBLES = 60;

export default async function PaginaTablero({ searchParams }: PageProps<"/tablero">) {
  const usuario = await usuarioActual();
  const { vendedor } = await searchParams;
  const esDueno = usuario.rol === "dueno";
  const filtro = esDueno ? (typeof vendedor === "string" ? vendedor : null) : usuario.id;

  const [contactos, vendedores] = await Promise.all([
    listarContactos({ vendedorId: filtro }),
    esDueno ? listarVendedores() : Promise.resolve([]),
  ]);

  // Ganados y perdidos viejos no aportan al tablero; siguen guardados y se ven en Contactos.
  const limite = haceDias(DIAS_CERRADOS_VISIBLES);
  const visibles = contactos.filter((c) => c.abierto || (c.cerrado_en && Date.parse(c.cerrado_en) >= limite));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo-pagina">Tablero</h1>
          <p className="text-sm text-apagado">
            Arrastrá las tarjetas para cambiar de etapa. Ganados y perdidos de los últimos {DIAS_CERRADOS_VISIBLES} días.
          </p>
        </div>
        {esDueno && <FiltroVendedor vendedores={vendedores} actual={filtro} />}
      </div>
      <Tablero contactos={visibles} mostrarVendedor={esDueno && !filtro} />
    </div>
  );
}
