# Diagnósticos de Nivelación — Programa de Formación de Líderes (Escorial)

App para los diagnósticos de entrada del Programa de Formación de Líderes. Al entrar se elige el módulo (**Trabajo Estándar** o **5S**) y la app guía al facilitador por los 3 momentos de ese módulo, asignando un nivel según la lógica de la guía correspondiente.

## Módulos incluidos

| Módulo | Momentos | Niveles | Tabla en Supabase |
|---|---|---|---|
| **Trabajo Estándar** (Módulo 2) | Reconocimiento · Lectura · Transmisión | N1 · N2 | `diagnosticos` |
| **5S** (Módulo 3) | Hacer · Controlar · Liderar | N1 · N2 · N3 | `diagnosticos_5s` |

Los dos módulos comparten el mismo motor de la app (`app.js`): la definición de cada uno (preguntas, opciones, lógica de corte, niveles y tabla) vive en el objeto `MODULES` al principio del archivo. Para agregar un tercer módulo en el futuro (por ejemplo, otro pilar del programa), se agrega una entrada nueva ahí con la misma estructura — no hace falta tocar el resto del código.

## Estructura

```
index.html      → estructura y contenedor de la app
styles.css      → estilos (paleta, tipografías, layout) de ambos módulos
app.js          → lógica de la app (selector de módulo, flujo, cálculo de nivel, guardado)
assets/logo.png → logo de Escorial
```

## Cómo alojarlo (hosting)

Es un sitio estático — no requiere backend ni build. Alcanza con subir los 4 archivos/carpetas manteniendo la misma estructura relativa. Opciones simples:

- **Netlify / Vercel (arrastrar y soltar)**: subís la carpeta completa tal cual y listo.
- **GitHub Pages**: subís los archivos a un repo y activás Pages sobre la rama principal.
- **Servidor propio (Escorial)**: copiás la carpeta a la raíz del sitio o a una subcarpeta (ej. `/diagnostico/`) en cualquier servidor que sirva archivos estáticos (Apache, Nginx, IIS).

No hace falta configurar dominio, SSL especial ni variables de entorno — es HTML/CSS/JS puro.

## Datos y almacenamiento — Supabase

La app guarda y lee los diagnósticos en dos tablas de Supabase (una por módulo), así quedan compartidos entre Diego y Marcos sin importar desde qué máquina o navegador entren.

### 1. Crear las tablas

En tu proyecto de Supabase, andá a **SQL Editor** y corré esto.

**Tabla del módulo Trabajo Estándar** (si ya la creaste antes, salteá este bloque):

```sql
create table if not exists diagnosticos (
  id text primary key,
  nombre text not null,
  sector text,
  rol text,
  fecha date,
  hte text,
  facilitador text,
  m1_reconoce boolean,
  m1_obs text,
  m2_identifica boolean,
  m2_obs text,
  m3_opcion text,
  m3_obs text,
  nivel_sugerido text,
  nivel_final text,
  created_at timestamptz default now()
);

alter table diagnosticos enable row level security;

create policy "permitir lectura y escritura al anon"
  on diagnosticos
  for all
  to anon
  using (true)
  with check (true);
```

**Tabla del módulo 5S** (nueva — hace falta crearla para que funcione el diagnóstico de 5S):

```sql
create table if not exists diagnosticos_5s (
  id text primary key,
  nombre text not null,
  sector text,
  rol text,
  fecha date,
  facilitador text,
  m1_reconoce boolean,
  m1_obs text,
  m2_audita boolean,
  m2_obs text,
  m3_opcion text,
  m3_obs text,
  nivel_sugerido text,
  nivel_final text,
  created_at timestamptz default now()
);

alter table diagnosticos_5s enable row level security;

create policy "permitir lectura y escritura al anon"
  on diagnosticos_5s
  for all
  to anon
  using (true)
  with check (true);
```

⚠️ **Nota de seguridad:** esa política deja las tablas abiertas a lectura/escritura/borrado para cualquiera que tenga la URL y la anon key del proyecto (ambas quedan visibles en el código fuente de la app — es normal en Supabase, la protección real la da la política de RLS, no el secreto de la key). Para una herramienta interna de dos facilitadores esto suele ser un riesgo aceptable, pero si más adelante querés restringirlo (por ejemplo a usuarios logueados con Supabase Auth), avisame y ajustamos la política.

### 2. Cargar las credenciales en la app

En **Project Settings → API** vas a encontrar:
- **Project URL**
- **anon public key**

Abrí `app.js`, buscá estas dos líneas cerca del principio y reemplazalas por tus valores (son las mismas para los dos módulos, porque comparten el mismo proyecto de Supabase):

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY';
```

### 3. Desplegar

Con esos dos valores cargados y las dos tablas creadas, subís los 4 archivos/carpetas (ver sección "Cómo alojarlo" arriba) y ya queda funcionando — cada guardado o borrado pega directo contra la tabla del módulo correspondiente en tu base de Supabase.

Si en algún momento la app tira el error "No se pudo conectar con Supabase" en el dashboard de un módulo, lo más probable es: URL/key mal copiadas, la tabla de ese módulo no existe, o falta la política de RLS del paso 1.

## Facilitadores

Los nombres están hardcodeados en `app.js` (`FACILITADORES`) y son los mismos para los dos módulos. Para agregar o cambiar facilitadores, editá ese array.

## Agregar un módulo nuevo

1. En `app.js`, agregá una entrada nueva al objeto `MODULES` con: `table` (nombre de tabla en Supabase), `eyebrow`, textos de dashboard/detalle, `niveles` (lista ordenada de códigos N1/N2/N3/…), `extraField` (opcional), `momentoLabels`, y la definición de `m1`, `m2` y `m3` (preguntas, opciones de corte o de tabla de decisión, y `dudaAlert`).
2. Creá la tabla correspondiente en Supabase (mismo patrón que las de arriba: columnas para cada campo booleano/opción del módulo, más `nivel_sugerido`, `nivel_final` y `created_at`).
3. Si el módulo usa un nivel nuevo (por ejemplo N4), agregá en `styles.css` las variantes `.dte-badge.n4`, `.dte-ficha.n4`, `.dte-stamp.n4`, `.dte-choice-tag.n4`, `.dte-toggle-btn.active.n4` y `.dte-stat-n4` con la paleta que corresponda.

No hace falta tocar el resto de `app.js`: el selector de módulo, el dashboard, el flujo de 3 momentos y la ficha de detalle son genéricos y leen todo desde `MODULES`.
