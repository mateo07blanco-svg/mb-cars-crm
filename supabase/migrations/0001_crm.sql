-- CRM MB Cars: modelo de datos, reglas y permisos.
-- Las reglas viven en la base: aunque alguien saltee la pantalla, no puede ver
-- contactos ajenos ni borrar nada.

-- ───────────── Tipos ─────────────
create type public.rol as enum ('dueno', 'vendedor');
create type public.etapa as enum ('nuevo', 'contactado', 'propuesta', 'ganado', 'perdido');
create type public.origen as enum ('formulario', 'manual', 'csv');
create type public.moneda as enum ('USD', 'ARS');
create type public.tipo_interaccion as enum
  ('llamada', 'whatsapp', 'mail', 'visita', 'nota', 'formulario', 'sistema');
create type public.motivo_perdida as enum
  ('precio', 'financiacion_rechazada', 'compro_en_otra', 'no_responde', 'sin_unidad', 'desistio', 'otro');

-- ───────────── Tablas ─────────────
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete restrict,
  nombre text not null,
  email text,
  rol public.rol not null default 'vendedor',
  -- Una cuenta nueva arranca inactiva hasta que el dueño la habilita: así, si
  -- alguien se registra por su cuenta, no ve nada ni recibe contactos.
  activo boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.contactos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text,
  email text,
  telefono_norm text generated always as (nullif(regexp_replace(coalesce(telefono, ''), '\D', '', 'g'), '')) stored,
  origen public.origen not null,
  interes text, -- vehículo o consulta
  etapa public.etapa not null default 'nuevo',
  motivo_perdida public.motivo_perdida,
  motivo_detalle text,
  monto numeric(14, 2) check (monto is null or monto >= 0),
  moneda public.moneda not null default 'USD',
  vendedor_id uuid not null references public.perfiles (id),
  proximo_paso text,
  proximo_paso_fecha date,
  ultima_actividad timestamptz not null default now(),
  etapa_desde timestamptz not null default now(),
  cerrado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint contacto_con_telefono_o_email check (telefono is not null or email is not null),
  constraint perdido_con_motivo check (etapa <> 'perdido' or motivo_perdida is not null),
  constraint otro_con_detalle check (motivo_perdida is distinct from 'otro' or length(trim(coalesce(motivo_detalle, ''))) > 0)
);

create index contactos_vendedor_idx on public.contactos (vendedor_id, etapa);
create index contactos_telefono_idx on public.contactos (telefono_norm);
create index contactos_email_idx on public.contactos (lower(email));

create table public.interacciones (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.contactos (id),
  autor_id uuid references public.perfiles (id) default auth.uid(),
  tipo public.tipo_interaccion not null,
  nota text not null check (length(trim(nota)) > 0),
  fecha timestamptz not null default now(),
  creado_en timestamptz not null default now()
);

create index interacciones_contacto_idx on public.interacciones (contacto_id, fecha desc);

-- ───────────── Funciones de apoyo ─────────────
create function public.hoy() returns date
language sql stable as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date
$$;

-- Cambiar este número cambia el umbral de enfriamiento en toda la app.
create function public.dias_enfriamiento() returns int
language sql immutable as $$ select 7 $$;

create function public.mi_rol() returns public.rol
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid() and activo
$$;

create function public.es_dueno() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mi_rol() = 'dueno', false)
$$;

create function public.puede_ver(p_vendedor uuid) returns boolean
language sql stable as $$
  select public.es_dueno() or (p_vendedor = auth.uid() and public.mi_rol() is not null)
$$;

-- ───────────── Nada se borra ─────────────
create function public.prohibir_borrado() returns trigger
language plpgsql as $$
begin
  raise exception 'En este CRM no se borra nada: marcá el contacto como perdido con su motivo.';
end $$;

create trigger contactos_no_borrar before delete on public.contactos
  for each row execute function public.prohibir_borrado();
create trigger interacciones_no_borrar before delete on public.interacciones
  for each row execute function public.prohibir_borrado();
create trigger perfiles_no_borrar before delete on public.perfiles
  for each row execute function public.prohibir_borrado();

-- El historial tampoco se edita.
create function public.prohibir_edicion_historial() returns trigger
language plpgsql as $$
begin
  raise exception 'El historial no se edita: agregá una nota nueva.';
end $$;

create trigger interacciones_no_editar before update on public.interacciones
  for each row execute function public.prohibir_edicion_historial();

-- ───────────── Reglas de contactos ─────────────
create function public.contactos_antes_de_guardar() returns trigger
language plpgsql as $$
begin
  new.email := nullif(lower(trim(new.email)), '');
  new.telefono := nullif(trim(new.telefono), '');
  new.proximo_paso := nullif(trim(new.proximo_paso), '');

  if tg_op = 'UPDATE' then
    new.creado_en := old.creado_en;
    new.origen := old.origen;
    new.actualizado_en := now();
    if new.etapa is distinct from old.etapa then
      new.etapa_desde := now();
      new.ultima_actividad := now();
    end if;
  end if;

  if new.etapa <> 'perdido' then
    new.motivo_perdida := null;
    new.motivo_detalle := null;
  end if;

  if new.etapa in ('ganado', 'perdido') then
    if tg_op = 'UPDATE' and old.etapa = new.etapa then
      new.cerrado_en := old.cerrado_en;
    elsif tg_op = 'UPDATE' then
      new.cerrado_en := now();
    else
      new.cerrado_en := coalesce(new.cerrado_en, now());
    end if;
  else
    new.cerrado_en := null;
  end if;

  return new;
end $$;

create trigger contactos_antes before insert or update on public.contactos
  for each row execute function public.contactos_antes_de_guardar();

create function public.etiqueta_etapa(e public.etapa) returns text
language sql immutable as $$
  select case e
    when 'nuevo' then 'Nuevo' when 'contactado' then 'Contactado'
    when 'propuesta' then 'Propuesta' when 'ganado' then 'Ganado'
    when 'perdido' then 'Perdido' end
$$;

create function public.etiqueta_motivo(m public.motivo_perdida) returns text
language sql immutable as $$
  select case m
    when 'precio' then 'Precio'
    when 'financiacion_rechazada' then 'Financiación rechazada'
    when 'compro_en_otra' then 'Compró en otra concesionaria'
    when 'no_responde' then 'No responde'
    when 'sin_unidad' then 'No había la unidad'
    when 'desistio' then 'Desistió'
    when 'otro' then 'Otro' end
$$;

-- Deja asentado en el historial el alta, los cambios de etapa y las reasignaciones.
create function public.contactos_registrar_cambios() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_autor uuid := coalesce(auth.uid(), new.vendedor_id);
  v_nota text;
begin
  if tg_op = 'INSERT' then
    insert into interacciones (contacto_id, autor_id, tipo, nota, fecha)
    values (new.id, v_autor, 'sistema',
      'Alta del contacto (' || case new.origen when 'formulario' then 'formulario web'
        when 'manual' then 'carga manual' else 'importación CSV' end || ')', new.creado_en);
    return new;
  end if;

  if new.etapa is distinct from old.etapa then
    v_nota := 'Etapa: ' || etiqueta_etapa(old.etapa) || ' → ' || etiqueta_etapa(new.etapa);
    if new.etapa = 'perdido' then
      v_nota := v_nota || '. Motivo: ' || etiqueta_motivo(new.motivo_perdida)
        || coalesce(' (' || nullif(trim(new.motivo_detalle), '') || ')', '');
    end if;
    insert into interacciones (contacto_id, autor_id, tipo, nota) values (new.id, v_autor, 'sistema', v_nota);
  end if;

  if new.vendedor_id is distinct from old.vendedor_id then
    insert into interacciones (contacto_id, autor_id, tipo, nota)
    select new.id, v_autor, 'sistema', 'Reasignado a ' || p.nombre from perfiles p where p.id = new.vendedor_id;
  end if;

  return new;
end $$;

create trigger contactos_despues after insert or update on public.contactos
  for each row execute function public.contactos_registrar_cambios();

-- Cada interacción real cuenta como actividad (sirve para el enfriamiento).
create function public.interacciones_actualizar_actividad() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo <> 'sistema' then
    update contactos set ultima_actividad = greatest(ultima_actividad, new.fecha)
    where id = new.contacto_id;
  end if;
  return new;
end $$;

create trigger interacciones_despues after insert on public.interacciones
  for each row execute function public.interacciones_actualizar_actividad();

-- ───────────── Perfil automático para cada usuario nuevo ─────────────
create function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)), new.email);
  return new;
end $$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

-- ───────────── Vista con el estado calculado ─────────────
-- security_invoker: la vista respeta los permisos de quien consulta.
create view public.contactos_estado with (security_invoker = true) as
select
  c.*,
  p.nombre as vendedor_nombre,
  (c.etapa in ('nuevo', 'contactado', 'propuesta')) as abierto,
  (c.etapa in ('contactado', 'propuesta')
    and (c.proximo_paso_fecha is null or c.proximo_paso_fecha < public.hoy())
    and c.ultima_actividad < now() - make_interval(days => public.dias_enfriamiento())) as enfriado,
  (c.etapa in ('nuevo', 'contactado', 'propuesta') and c.proximo_paso_fecha < public.hoy()) as vencido,
  (c.etapa in ('nuevo', 'contactado', 'propuesta') and c.proximo_paso_fecha = public.hoy()) as para_hoy,
  floor(extract(epoch from now() - c.ultima_actividad) / 86400)::int as dias_sin_actividad
from public.contactos c
join public.perfiles p on p.id = c.vendedor_id;

-- ───────────── Permisos (RLS) ─────────────
alter table public.perfiles enable row level security;
alter table public.contactos enable row level security;
alter table public.interacciones enable row level security;

create policy "usuarios activos ven el equipo" on public.perfiles
  for select to authenticated using (public.mi_rol() is not null or id = auth.uid());

create policy "ver contactos propios o todos si es dueño" on public.contactos
  for select to authenticated using (public.puede_ver(vendedor_id));
create policy "crear contactos propios o cualquiera si es dueño" on public.contactos
  for insert to authenticated with check (public.puede_ver(vendedor_id));
-- El with check impide que un vendedor se saque un contacto de encima pasándoselo a otro.
create policy "editar contactos propios o todos si es dueño" on public.contactos
  for update to authenticated using (public.puede_ver(vendedor_id)) with check (public.puede_ver(vendedor_id));

create policy "ver historial de contactos visibles" on public.interacciones
  for select to authenticated
  using (exists (select 1 from public.contactos c where c.id = contacto_id));
create policy "agregar interacciones a contactos visibles" on public.interacciones
  for insert to authenticated
  with check (autor_id = auth.uid() and tipo <> 'sistema'
    and exists (select 1 from public.contactos c where c.id = contacto_id));

revoke all on public.perfiles, public.contactos, public.interacciones, public.contactos_estado from anon;
grant select on public.perfiles to authenticated;
grant select, insert, update on public.contactos, public.interacciones to authenticated;
grant select on public.contactos_estado to authenticated;

-- ───────────── Formulario web (público) ─────────────
-- Reparte en ronda: le toca al vendedor activo que hace más tiempo no recibe uno.
create function public.proximo_vendedor() returns uuid
language sql stable security definer set search_path = public as $$
  select p.id from perfiles p
  where p.activo and p.rol = 'vendedor'
  order by (select max(c.creado_en) from contactos c where c.vendedor_id = p.id and c.origen = 'formulario') nulls first,
           p.nombre
  limit 1
$$;

create function public.alta_formulario(
  p_nombre text, p_telefono text, p_email text, p_mensaje text default null, p_interes text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_tel text := nullif(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(trim(p_email)), '');
  v_existente contactos%rowtype;
  v_vendedor uuid;
  v_id uuid;
begin
  if length(trim(coalesce(p_nombre, ''))) = 0 then raise exception 'Falta el nombre'; end if;
  if v_tel is null and v_email is null then raise exception 'Falta teléfono o mail'; end if;
  if length(coalesce(p_mensaje, '')) > 2000 or length(p_nombre) > 200 then raise exception 'Texto demasiado largo'; end if;

  select * into v_existente from contactos
  where (v_tel is not null and length(v_tel) >= 6 and telefono_norm = v_tel)
     or (v_email is not null and lower(email) = v_email)
  order by creado_en desc limit 1;

  if found then
    insert into interacciones (contacto_id, autor_id, tipo, nota)
    values (v_existente.id, v_existente.vendedor_id, 'formulario',
      'Volvió a escribir por el formulario web' || coalesce(': ' || nullif(trim(p_mensaje), ''), '')
      || coalesce(' (interés: ' || nullif(trim(p_interes), '') || ')', ''));
    return 'existente';
  end if;

  v_vendedor := proximo_vendedor();
  if v_vendedor is null then
    select id into v_vendedor from perfiles where activo and rol = 'dueno' limit 1;
  end if;
  if v_vendedor is null then raise exception 'No hay usuarios activos para asignar'; end if;

  insert into contactos (nombre, telefono, email, origen, interes, vendedor_id, proximo_paso, proximo_paso_fecha)
  values (trim(p_nombre), nullif(trim(p_telefono), ''), v_email, 'formulario', nullif(trim(p_interes), ''),
          v_vendedor, 'Primer contacto: respondió el formulario web', hoy())
  returning id into v_id;

  if nullif(trim(p_mensaje), '') is not null then
    insert into interacciones (contacto_id, autor_id, tipo, nota)
    values (v_id, v_vendedor, 'formulario', 'Mensaje del formulario: ' || trim(p_mensaje));
  end if;

  return 'nuevo';
end $$;

revoke all on function public.alta_formulario(text, text, text, text, text) from public;
grant execute on function public.alta_formulario(text, text, text, text, text) to anon, authenticated;

-- ───────────── Duplicados para la importación CSV ─────────────
-- Devuelve solo qué teléfonos o mails ya existen y de quién son, sin exponer el resto de la ficha.
create function public.buscar_existentes(p_telefonos text[], p_emails text[])
returns table (clave text, vendedor_nombre text)
language sql stable security definer set search_path = public as $$
  select c.telefono_norm, p.nombre from contactos c join perfiles p on p.id = c.vendedor_id
  where mi_rol() is not null and c.telefono_norm = any (p_telefonos)
  union
  select lower(c.email), p.nombre from contactos c join perfiles p on p.id = c.vendedor_id
  where mi_rol() is not null and lower(c.email) = any (p_emails)
$$;

revoke all on function public.buscar_existentes(text[], text[]) from public;
grant execute on function public.buscar_existentes(text[], text[]) to authenticated;

-- Supabase da permiso de ejecución a anon por defecto: se lo sacamos a todo lo que no sea el formulario.
revoke execute on function public.proximo_vendedor() from public, anon, authenticated;
revoke execute on function public.buscar_existentes(text[], text[]) from anon;
revoke execute on function public.mi_rol(), public.es_dueno(), public.puede_ver(uuid) from anon;
