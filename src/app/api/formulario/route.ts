import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Para conectar el formulario del sitio de MB Cars: recibe un POST (form o JSON)
// y carga la consulta igual que la página /formulario.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const tipo = request.headers.get("content-type") ?? "";
  let datos: Record<string, string> = {};
  try {
    if (tipo.includes("application/json")) {
      datos = await request.json();
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => { if (typeof v === "string") datos[k] = v; });
    }
  } catch {
    return Response.json({ error: "Formato inválido" }, { status: 400, headers: CORS });
  }

  const limpio = (k: string) => (typeof datos[k] === "string" && datos[k].trim()) || null;
  const volver = limpio("volver");

  if (!limpio("empresa")) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.rpc("alta_formulario", {
      p_nombre: limpio("nombre"),
      p_telefono: limpio("telefono"),
      p_email: limpio("email"),
      p_mensaje: limpio("mensaje"),
      p_interes: limpio("interes"),
    });
    if (error) return Response.json({ error: error.message }, { status: 400, headers: CORS });
  }

  // Un formulario HTML común puede mandar "volver" con la página de gracias del sitio.
  if (volver && /^https?:\/\//.test(volver)) return Response.redirect(volver, 303);
  return Response.json({ ok: true }, { headers: CORS });
}
