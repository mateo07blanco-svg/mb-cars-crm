import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

const RUTAS_PUBLICAS = ["/login", "/registro", "/formulario", "/api/formulario"];

// Refresca la sesión en cada pedido y manda al login a quien no la tenga.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (aGuardar, headers) => {
        aGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        aGuardar.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => respuesta.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((r) => ruta === r || ruta.startsWith(r + "/"));

  if (!data?.claims && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv)$).*)"],
};
