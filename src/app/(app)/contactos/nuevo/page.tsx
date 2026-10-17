import { usuarioActual } from "@/lib/auth";
import { listarVendedores } from "@/lib/datos";
import { FormNuevo } from "./form-nuevo";

export default async function NuevoContacto() {
  const usuario = await usuarioActual();
  const vendedores = usuario.rol === "dueno" ? await listarVendedores() : [];
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo contacto</h1>
      <div className="tarjeta p-5">
        <FormNuevo vendedores={vendedores} usuarioId={usuario.id} />
      </div>
    </div>
  );
}
