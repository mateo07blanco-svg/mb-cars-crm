import { usuarioActual } from "@/lib/auth";
import { listarVendedores } from "@/lib/datos";
import { Importador } from "./importador";

export default async function Importar() {
  const usuario = await usuarioActual();
  const vendedores = usuario.rol === "dueno" ? await listarVendedores() : [];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="titulo-pagina">Importar contactos desde CSV</h1>
        <p className="text-sm text-apagado">
          Subí el archivo, revisá la vista previa y recién ahí se guarda.
          {usuario.rol === "dueno"
            ? " La columna «vendedor» asigna cada fila (si queda vacía, queda a tu nombre)."
            : " Todos los contactos importados quedan asignados a vos."}
        </p>
      </div>
      <Importador vendedores={vendedores} />
    </div>
  );
}
