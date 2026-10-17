import { FormularioRegistro } from "./formulario-registro";

export default function Registro() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="tarjeta w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-slate-500">
          Después de crearla, el dueño tiene que habilitarte para que veas tus contactos.
        </p>
        <FormularioRegistro />
      </div>
    </main>
  );
}
