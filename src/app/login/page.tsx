import { Suspense } from "react";
import { PantallaAcceso } from "@/componentes/pantalla-acceso";
import { FormularioLogin } from "./formulario-login";

export default function Login() {
  return (
    <PantallaAcceso titulo="Ingresar" subtitulo="Entrá con tu mail y contraseña.">
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </PantallaAcceso>
  );
}
