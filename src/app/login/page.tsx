import { Suspense } from "react";
import { FormularioLogin } from "./formulario-login";

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="tarjeta w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold">MB Cars</h1>
        <p className="mb-6 text-sm text-slate-500">Ingresá con tu mail y contraseña.</p>
        <Suspense>
          <FormularioLogin />
        </Suspense>
      </div>
    </main>
  );
}
