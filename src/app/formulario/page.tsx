import { FormularioPublico } from "./formulario-publico";

export const metadata = { title: "MB Cars · Consultas" };

export default function Formulario() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="tarjeta w-full max-w-md p-6">
        <h1 className="text-xl font-semibold">MB Cars</h1>
        <p className="mb-5 text-sm text-slate-500">Dejanos tus datos y un vendedor te contacta a la brevedad.</p>
        <FormularioPublico />
      </div>
    </main>
  );
}
