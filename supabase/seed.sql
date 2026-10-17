-- Datos de prueba: 60 contactos de autos repartidos en etapas y entre los 3 vendedores.
-- Requiere que ya existan los usuarios (ver README). Se puede correr una sola vez.

do $$
declare
  v_vendedores uuid[];
  v_nombres text[] := array[
    'Lucía Fernández','Martín Gómez','Sofía Rodríguez','Juan Pablo López','Valentina Díaz','Diego Martínez',
    'Camila Pérez','Nicolás Sánchez','Florencia Romero','Federico Álvarez','Agustina Torres','Matías Ruiz',
    'Carolina Ramírez','Santiago Flores','Julieta Acosta','Tomás Benítez','Micaela Medina','Facundo Herrera',
    'Paula Suárez','Gonzalo Aguirre','Romina Pereyra','Lucas Giménez','Natalia Molina','Ezequiel Castro',
    'Daniela Ortiz','Hernán Silva','Belén Núñez','Pablo Luna','Mariana Cabrera','Leandro Ríos',
    'Victoria Ferreyra','Emiliano Godoy','Antonella Morales','Sebastián Domínguez','Rocío Vega','Maximiliano Correa',
    'Milagros Ojeda','Ignacio Vera','Jimena Ponce','Ramiro Quiroga','Luciana Sosa','Bruno Navarro',
    'Gabriela Ledesma','Alejandro Villalba','Brenda Paz','Cristian Figueroa','Pilar Arias','Joaquín Peralta',
    'Abril Juárez','Franco Rojas','Melina Ibarra','Rodrigo Campos','Lorena Vázquez','Germán Bustos',
    'Ailén Carrizo','Marcos Ramos','Silvina Moreno','Iván Mansilla','Celeste Toledo','Damián Lucero'];
  v_autos text[] := array[
    'Toyota Hilux 0km','Fiat Cronos 0km','Volkswagen Amarok usada','Peugeot 208 0km','Chevrolet Onix usado',
    'Ford Ranger 0km','Renault Sandero usado','Toyota Corolla Cross 0km','Volkswagen Gol Trend usado',
    'Toyota Etios usado','Jeep Renegade 0km','Fiat Toro usada','Volkswagen Taos 0km','Ford EcoSport usada',
    'Peugeot 2008 0km','Chevrolet Cruze usado'];
  v_motivos public.motivo_perdida[] := array['precio','financiacion_rechazada','compro_en_otra','no_responde',
    'sin_unidad','desistio','precio','compro_en_otra','otro','no_responde']::public.motivo_perdida[];
  i int;
  v_id uuid;
  v_vendedor uuid;
  v_etapa public.etapa;
  v_origen public.origen;
  v_creado timestamptz;
  v_auto text;
  v_monto numeric;
  v_moneda public.moneda;
  v_prox text;
  v_prox_fecha date;
  v_ultima timestamptz;
  v_cerrado timestamptz;
  v_motivo public.motivo_perdida;
  v_caso int;
  v_tel text;
begin
  if exists (select 1 from contactos) then
    raise notice 'Ya hay contactos cargados; no se cargan datos de prueba.';
    return;
  end if;

  select array_agg(id order by nombre) into v_vendedores from perfiles where rol = 'vendedor' and activo;
  if coalesce(array_length(v_vendedores, 1), 0) = 0 then
    raise exception 'Primero creá y activá a los vendedores';
  end if;

  perform setseed(0.42);

  for i in 1..60 loop
    v_vendedor := v_vendedores[(i % array_length(v_vendedores, 1)) + 1];
    v_etapa := case when i <= 12 then 'nuevo' when i <= 27 then 'contactado' when i <= 40 then 'propuesta'
                    when i <= 50 then 'ganado' else 'perdido' end;
    v_origen := case (i * 7) % 10 when 0 then 'csv' when 1 then 'csv' when 2 then 'manual' when 3 then 'manual'
                     when 4 then 'manual' else 'formulario' end;
    v_auto := v_autos[1 + (i * 5) % array_length(v_autos, 1)];
    if v_auto like '%usad%' then
      v_moneda := case when i % 2 = 0 then 'ARS' else 'USD' end;
      v_monto := case when v_moneda = 'ARS' then round((12 + random() * 20)::numeric) * 1000000
                      else round((9 + random() * 15)::numeric) * 1000 end;
    else
      v_moneda := 'USD';
      v_monto := round((20 + random() * 40)::numeric) * 1000;
    end if;
    v_tel := '+54 9 11 ' || (4000 + (i * 137) % 5000)::text || '-' || lpad(((i * 7919) % 10000)::text, 4, '0');
    v_caso := i % 5;
    v_prox := null; v_prox_fecha := null; v_cerrado := null; v_motivo := null;

    if v_etapa = 'nuevo' then
      v_creado := now() - make_interval(hours => 2 + (random() * 96)::int);
      v_ultima := v_creado;
      v_prox := 'Primer contacto: llamar y presentar la unidad';
      v_prox_fecha := case when v_caso in (0, 1) then hoy() - 1 when v_caso = 2 then hoy() + 1 else hoy() end;
    else
      v_creado := now() - make_interval(days => 10 + (random() * 80)::int);
      if v_etapa in ('contactado', 'propuesta') then
        case v_caso
          when 0 then -- enfriado: más de 7 días sin actividad y sin próximo paso
            v_ultima := now() - make_interval(days => 8 + (random() * 12)::int);
          when 1 then -- vencido
            v_ultima := now() - make_interval(days => 3 + (random() * 3)::int);
            v_prox_fecha := hoy() - (1 + (random() * 3)::int);
          when 2 then -- para hoy
            v_ultima := now() - make_interval(days => 1 + (random() * 4)::int);
            v_prox_fecha := hoy();
          else -- al día
            v_ultima := now() - make_interval(days => (random() * 4)::int);
            v_prox_fecha := hoy() + (1 + (random() * 6)::int);
        end case;
        if v_prox_fecha is not null then
          v_prox := case when v_etapa = 'contactado'
            then (array['Coordinar test drive','Mandar cotización por WhatsApp','Llamar para ver si vio las fotos','Invitar al salón'])[1 + i % 4]
            else (array['Seguir la propuesta de financiación','Confirmar valor de su usado','Llamar para cerrar','Enviar propuesta actualizada'])[1 + i % 4] end;
        end if;
      else
        v_cerrado := now() - make_interval(days => 1 + (random() * 8)::int);
        if v_cerrado < v_creado then v_cerrado := v_creado + interval '1 day'; end if;
        v_ultima := v_cerrado;
        if v_etapa = 'perdido' then v_motivo := v_motivos[1 + (i - 51) % 10]; end if;
      end if;
    end if;

    insert into contactos (nombre, telefono, email, origen, interes, etapa, motivo_perdida, motivo_detalle,
      monto, moneda, vendedor_id, proximo_paso, proximo_paso_fecha, ultima_actividad, etapa_desde, cerrado_en, creado_en)
    values (v_nombres[i], v_tel,
      lower(translate(split_part(v_nombres[i], ' ', 1) || '.' || split_part(v_nombres[i], ' ', array_length(string_to_array(v_nombres[i], ' '), 1)),
        'áéíóúÁÉÍÓÚñÑ ', 'aeiouAEIOUnN')) || '@mail.com',
      v_origen, v_auto, v_etapa, v_motivo,
      case when v_motivo = 'otro' then 'Se mudó al interior' end,
      v_monto, v_moneda, v_vendedor, v_prox, v_prox_fecha, v_creado,
      coalesce(v_cerrado, v_ultima), v_cerrado, v_creado)
    returning id into v_id;

    -- Historial: la consulta inicial y las gestiones hasta la etapa actual.
    if v_origen = 'formulario' then
      insert into interacciones (contacto_id, autor_id, tipo, nota, fecha)
      values (v_id, v_vendedor, 'formulario', 'Mensaje del formulario: Hola, quería saber precio y disponibilidad del ' || v_auto || '.', v_creado);
    end if;

    if v_etapa <> 'nuevo' then
      insert into interacciones (contacto_id, autor_id, tipo, nota, fecha) values
        (v_id, v_vendedor, 'llamada', 'Primer llamado. Le interesa el ' || v_auto || '. Tiene un usado para entregar.', v_creado + interval '1 day'),
        (v_id, v_vendedor, 'sistema', 'Etapa: Nuevo → Contactado', v_creado + interval '1 day');
    end if;
    if v_etapa in ('propuesta', 'ganado', 'perdido') then
      insert into interacciones (contacto_id, autor_id, tipo, nota, fecha) values
        (v_id, v_vendedor, 'visita', 'Vino al salón e hizo test drive.', v_creado + (v_ultima - v_creado) / 2),
        (v_id, v_vendedor, 'mail', 'Se envió propuesta con financiación en 36 cuotas.', v_creado + (v_ultima - v_creado) / 2 + interval '1 hour'),
        (v_id, v_vendedor, 'sistema', 'Etapa: Contactado → Propuesta', v_creado + (v_ultima - v_creado) / 2 + interval '1 hour');
    end if;
    if v_etapa in ('contactado', 'propuesta') then
      insert into interacciones (contacto_id, autor_id, tipo, nota, fecha)
      values (v_id, v_vendedor, 'whatsapp', 'Le mandé fotos y quedó en responder.', v_ultima);
    elsif v_etapa = 'ganado' then
      insert into interacciones (contacto_id, autor_id, tipo, nota, fecha) values
        (v_id, v_vendedor, 'visita', 'Firmó la reserva y dejó la seña.', v_cerrado),
        (v_id, v_vendedor, 'sistema', 'Etapa: Propuesta → Ganado', v_cerrado);
    elsif v_etapa = 'perdido' then
      insert into interacciones (contacto_id, autor_id, tipo, nota, fecha) values
        (v_id, v_vendedor, 'llamada', 'Avisó que no sigue adelante.', v_cerrado),
        (v_id, v_vendedor, 'sistema', 'Etapa: Propuesta → Perdido. Motivo: ' || etiqueta_motivo(v_motivo), v_cerrado);
    end if;
  end loop;

  raise notice 'Cargados 60 contactos de prueba.';
end $$;
