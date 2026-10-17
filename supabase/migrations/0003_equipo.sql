-- El dueño habilita, pausa y cambia el rol de los usuarios desde la pantalla Equipo.
create policy "el dueño administra el equipo" on public.perfiles
  for update to authenticated using (public.es_dueno()) with check (public.es_dueno());

grant update (nombre, rol, activo) on public.perfiles to authenticated;

-- Evita que el dueño se quite a sí mismo el acceso por error.
create function public.perfiles_proteger_dueno() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.id = auth.uid() and (new.activo is distinct from old.activo or new.rol is distinct from old.rol) then
    raise exception 'No podés cambiar tu propio rol ni desactivarte.';
  end if;
  return new;
end $$;

create trigger perfiles_proteger before update on public.perfiles
  for each row execute function public.perfiles_proteger_dueno();

revoke execute on function public.perfiles_proteger_dueno() from public, anon, authenticated;
