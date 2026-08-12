# Diagnóstico de Nivelación — Trabajo Estándar (Escorial)

App para el diagnóstico de entrada del Módulo 2 del Programa de Formación de Líderes. Guía al facilitador por los 3 momentos (Reconocimiento, Lectura, Transmisión) y asigna nivel N1/N2 según la lógica de la guía.

## Estructura

```
index.html      → estructura y contenedor de la app
styles.css      → estilos (paleta, tipografías, layout)
app.js          → lógica de la app (flujo, cálculo de nivel, guardado)
assets/logo.png → logo de Escorial
```

## Cómo alojarlo (hosting)

Es un sitio estático — no requiere backend ni build. Alcanza con subir los 4 archivos/carpetas manteniendo la misma estructura relativa. Opciones simples:

- **Netlify / Vercel (arrastrar y soltar)**: subís la carpeta completa tal cual y listo.
- **GitHub Pages**: subís los archivos a un repo y activás Pages sobre la rama principal.
- **Servidor propio (Escorial)**: copiás la carpeta a la raíz del sitio o a una subcarpeta (ej. `/diagnostico/`) en cualquier servidor que sirva archivos estáticos (Apache, Nginx, IIS).

No hace falta configurar dominio, SSL especial ni variables de entorno — es HTML/CSS/JS puro.

## Datos y almacenamiento — Supabase

La app guarda y lee los diagnósticos en una tabla de Supabase, así quedan compartidos entre Diego y Marcos sin importar desde qué máquina o navegador entren.

### 1. Crear la tabla

En tu proyecto de Supabase, andá a **SQL Editor** y corré esto:

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

⚠️ **Nota de seguridad:** esa política deja la tabla abierta a lectura/escritura/borrado para cualquiera que tenga la URL y la anon key del proyecto (ambas quedan visibles en el código fuente de la app — es normal en Supabase, la protección real la da la política de RLS, no el secreto de la key). Para una herramienta interna de dos facilitadores esto suele ser un riesgo aceptable, pero si más adelante querés restringirlo (por ejemplo a usuarios logueados con Supabase Auth), avisame y ajustamos la política.

### 2. Cargar las credenciales en la app

En **Project Settings → API** vas a encontrar:
- **Project URL**
- **anon public key**

Abrí `app.js`, buscá estas dos líneas cerca del principio y reemplazalas por tus valores:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY';
```

### 3. Desplegar

Con esos dos valores cargados, subís los 4 archivos/carpetas (ver sección "Cómo alojarlo" arriba) y ya queda funcionando — cada guardado o borrado pega directo contra tu base de Supabase.

Si en algún momento la app tira el error "No se pudo conectar con Supabase" en el dashboard, lo más probable es: URL/key mal copiadas, la tabla no existe, o falta la política de RLS del paso 1.

## Facilitadores

Los nombres están hardcodeados en `app.js` (`FACILITADORES`). Para agregar o cambiar facilitadores, editá ese array.
