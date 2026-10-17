import { Escudo } from "./logo";

// Marco de las pantallas sin sesión (ingreso, registro, formulario público).
export function PantallaAcceso({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fondo p-4">
      {/* Brillos de fondo con los colores de la marca */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-marca/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-accion/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Escudo className="h-16 w-16 drop-shadow-[0_8px_24px_rgba(225,29,46,0.45)]" />
          <p className="mt-3 text-2xl font-black tracking-tight text-white">
            MB <span className="text-marca">CARS</span>
          </p>
          <p className="text-[11px] font-medium tracking-[0.3em] text-apagado uppercase">Concesionaria</p>
        </div>
        <div className="tarjeta border-t-4 border-t-marca p-6 sm:p-8">
          <h1 className="text-xl font-bold text-texto">{titulo}</h1>
          <p className="mb-6 text-sm text-apagado">{subtitulo}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
