import { duenoActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FilaUsuario } from "./fila-usuario";

export default async function Equipo() {
  const yo = await duenoActual();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("perfiles").select("id, nombre, email, rol, activo").order("activo").order("nombre");
  const usuarios = data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <p className="text-sm text-slate-500">
          Un vendedor nuevo se registra desde la pantalla de ingreso («Creá tu cuenta») y aparece acá como pendiente.
          Habilitalo para que vea sus contactos y entre en la ronda del formulario web. Pausar a alguien no borra nada.
        </p>
      </div>
      <div className="tarjeta divide-y divide-slate-100">
        {usuarios.map((u) => (
          <FilaUsuario key={u.id} usuario={u} esYo={u.id === yo.id} />
        ))}
      </div>
    </div>
  );
}
