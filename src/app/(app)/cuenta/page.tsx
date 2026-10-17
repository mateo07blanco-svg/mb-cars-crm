import { usuarioActual } from "@/lib/auth";
import { CambiarContrasena } from "./cambiar-contrasena";

export default async function Cuenta() {
  const usuario = await usuarioActual();
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="titulo-pagina">Mi cuenta</h1>
      <p className="text-sm text-apagado">{usuario.nombre}</p>
      <div className="tarjeta p-5">
        <h2 className="mb-3 font-semibold">Cambiar contraseña</h2>
        <CambiarContrasena />
      </div>
    </div>
  );
}
