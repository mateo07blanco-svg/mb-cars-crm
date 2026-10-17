# CRM MB Cars

CRM liviano para MB Cars: contactos, etapas, próximo paso, historial y panel del dueño.
Hecho con Next.js 16 y Supabase.

## Pantallas

| Ruta | Para qué |
| --- | --- |
| `/hoy` | Lista del día de cada vendedor: vencidos, para hoy, enfriados y sin próximo paso. |
| `/tablero` | Tablero por etapas con arrastrar y soltar. Al soltar en «Perdido» pide el motivo. |
| `/contactos` | Buscador de todos los contactos. |
| `/contactos/[id]` | Ficha: datos, etapa, próximo paso e historial. |
| `/contactos/nuevo` | Carga manual. |
| `/importar` | Importación CSV con vista previa, errores y duplicados antes de guardar. |
| `/panel` | Solo dueño: entraron, ganados, motivos de pérdida, origen y resumen por vendedor. |
| `/equipo` | Solo dueño: habilitar o pausar usuarios. |
| `/formulario` | Formulario público de consultas. |
| `/api/formulario` | Lo mismo, para conectar el formulario del sitio web (POST, ver abajo). |

## Reglas (viven en la base de datos)

- Cada vendedor ve y edita solo lo suyo; el dueño ve todo y puede reasignar.
- Nada se borra: no hay permiso de borrado y un disparador lo bloquea igual. El historial no se edita.
- «Perdido» exige motivo (y detalle si es «Otro»).
- Enfriamiento: un contacto en «Contactado» o «Propuesta» sin próximo paso vigente y con más de
  7 días sin actividad aparece en rojo en Hoy, en el tablero, en la ficha y con un contador en el menú.
  El número se cambia en la función `dias_enfriamiento()`.
- Cada interacción, alta, cambio de etapa y reasignación queda en el historial.
- El formulario web reparte en ronda entre los vendedores activos y, si la persona ya existía,
  suma la consulta a su ficha en vez de duplicarla.
- Una cuenta nueva queda pausada hasta que el dueño la habilita en «Equipo».

## Base de datos

Las migraciones están en `supabase/migrations/` y los datos de prueba en `supabase/seed.sql`
(60 contactos de autos repartidos entre 3 vendedores; requiere que los usuarios existan).

## Conectar el formulario del sitio web

Opción simple: linkear o embeber la página `/formulario`.

Opción formulario propio: hacer un POST a `/api/formulario` con los campos
`nombre`, `telefono`, `email`, `interes`, `mensaje` (y opcionalmente `volver` con la URL
de la página de gracias):

```html
<form action="https://TU-APP.vercel.app/api/formulario" method="post">
  <input name="nombre" required>
  <input name="telefono">
  <input name="email" type="email">
  <input name="interes">
  <textarea name="mensaje"></textarea>
  <input type="hidden" name="volver" value="https://mbcars.com.ar/gracias">
  <button>Enviar</button>
</form>
```

## Desarrollo

```bash
npm install
npm run dev
```

La URL y la clave publicable del proyecto de Supabase están en `src/lib/supabase/config.ts`
(no son secretas). Para usar otro proyecto, definí `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
