import { PantallaAcceso } from "@/componentes/pantalla-acceso";
import { FormularioPublico } from "./formulario-publico";

export const metadata = { title: "MB Cars · Consultas" };

export default function Formulario() {
  return (
    <PantallaAcceso titulo="¿Te interesa un vehículo?" subtitulo="Dejanos tus datos y un vendedor te contacta a la brevedad.">
      <FormularioPublico />
    </PantallaAcceso>
  );
}
