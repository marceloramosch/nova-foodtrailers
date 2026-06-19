# Configurar el CRM en la nube (Supabase) — Guía rápida

Esto hace que tus **clientes, cotizaciones y precios** se guarden en internet
(no en el navegador), para que **nunca se borren** y los veas desde cualquier
dispositivo. Mientras no lo configures, el cotizador sigue funcionando local.

Tiempo estimado: **~5 minutos**. Solo lo haces una vez.

---

## Paso 1 — Crear el proyecto (gratis)

1. Entra a **https://supabase.com** y crea una cuenta (puedes usar tu Google).
2. Click en **New project**.
3. Nombre: `nova-crm` · Pon una **Database Password** (guárdala) · Región: la más
   cercana (ej. *East US*). Click **Create new project** y espera ~1 min.

## Paso 2 — Crear la tabla

1. En el menú izquierdo abre **SQL Editor** → **New query**.
2. Pega esto y dale **Run**:

```sql
create table if not exists nova_store (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

alter table nova_store enable row level security;

create policy "leer autenticados"   on nova_store for select to authenticated using (true);
create policy "insertar autenticados" on nova_store for insert to authenticated with check (true);
create policy "actualizar autenticados" on nova_store for update to authenticated using (true) with check (true);
```

## Paso 3 — Crear tu usuario (para iniciar sesión)

1. Menú izquierdo → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Pon tu **correo** y una **contraseña**. Marca/activa **Auto Confirm User**.
3. Repite para cada vendedor que quieras que tenga acceso.

## Paso 4 — Copiar tus llaves

1. Menú izquierdo → **Project Settings** (engrane) → **API**.
2. Copia dos cosas:
   - **Project URL** (ej. `https://abcdxyz.supabase.co`)
   - **anon public** key (una cadena larga)

## Paso 5 — Pegarlas en el sitio

Abre el archivo **`supabase-config.js`** y reemplaza los valores de ejemplo:

```js
window.NOVA_SUPABASE = {
  url: "https://abcdxyz.supabase.co",   // tu Project URL
  anonKey: "eyJhbGciOi..."              // tu anon public key
};
```

Guarda y sube los cambios (o mándame las dos llaves y yo lo dejo listo).

---

## Listo ✅

La próxima vez que abras **novafoodtrailers.com/cotizador.html**:
- Te pedirá **correo y contraseña** (los del Paso 3).
- Verás una insignia **☁️ Nube** abajo a la derecha.
- Todo lo que guardes queda en la nube y se comparte con los demás usuarios.
- Si ya tenías datos locales en ese navegador, se **suben automáticamente** la
  primera vez.

> **Nota:** las llaves `URL` y `anon public` son públicas por diseño; tus datos
> están protegidos por el inicio de sesión y las políticas de seguridad (RLS)
> que creaste en el Paso 2. Para ver cambios hechos por otra persona, recarga la
> página.
