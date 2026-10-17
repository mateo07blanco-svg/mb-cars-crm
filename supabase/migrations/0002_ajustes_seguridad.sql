-- Ajustes sugeridos por el asesor de seguridad de Supabase.

-- Las funciones de disparadores no tienen que poder llamarse desde la API.
revoke execute on function public.contactos_registrar_cambios(), public.crear_perfil(),
  public.interacciones_actualizar_actividad(), public.prohibir_borrado(),
  public.prohibir_edicion_historial(), public.contactos_antes_de_guardar()
  from public, anon, authenticated;

-- Las de permisos solo las usan usuarios con sesión.
revoke execute on function public.mi_rol(), public.es_dueno(), public.puede_ver(uuid) from public, anon;
grant execute on function public.mi_rol(), public.es_dueno(), public.puede_ver(uuid) to authenticated;
revoke execute on function public.buscar_existentes(text[], text[]) from public, anon;

-- search_path fijo en todas las funciones.
alter function public.puede_ver(uuid) set search_path = public;
alter function public.hoy() set search_path = public;
alter function public.dias_enfriamiento() set search_path = public;
alter function public.prohibir_borrado() set search_path = public;
alter function public.prohibir_edicion_historial() set search_path = public;
alter function public.contactos_antes_de_guardar() set search_path = public;
alter function public.etiqueta_etapa(public.etapa) set search_path = public;
alter function public.etiqueta_motivo(public.motivo_perdida) set search_path = public;
