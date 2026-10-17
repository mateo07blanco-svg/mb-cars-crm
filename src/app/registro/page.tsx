import { PantallaAcceso } from "@/componentes/pantalla-acceso";
import { FormularioRegistro } from "./formulario-registro";

export default function Registro() {
  return (
    <PantallaAcceso titulo="Crear cuenta" subtitulo="Después de crearla, el dueño tiene que habilitarte para que veas tus contactos.">
      <FormularioRegistro />
    </PantallaAcceso>
  );
}
