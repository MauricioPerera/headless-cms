---
version: alpha
name: Headless CMS
 description: "Tema editorial minimalista para un CMS documental. Prioriza la legibilidad del contenido largo con una jerarquia tipografica clara, cards con elevacion sutil y un sistema de color que alterna entre un fondo calido claro y un fondo profundo oscuro."
colors:
  bg: "#fafafa"
  surface: "#ffffff"
  text: "#1a1a2e"
  muted: "#6b7280"
  accent: "#2563eb"
  accent-hover: "#1d4ed8"
  accent-soft: "rgba(37, 99, 235, 0.08)"
  border: "#e5e7eb"
  callout-bg: "#eff6ff"
  callout-border: "#bfdbfe"
  callout-text: "#1e40af"
  table-header: "#f8fafc"
  table-row: "#ffffff"
  table-alt: "#f1f5f9"
  category: "#059669"
  category-soft: "rgba(5, 150, 105, 0.08)"
  dark-bg: "#0f0f1a"
  dark-surface: "#181825"
  dark-text: "#e8e8ef"
  dark-muted: "#9ca3af"
  dark-accent: "#60a5fa"
  dark-accent-soft: "rgba(96, 165, 250, 0.12)"
  dark-border: "#27273a"
  dark-table-header: "#1a1a2e"
  dark-table-row: "#131320"
  dark-table-alt: "#1a1a2e"
typography:
  h1-hero:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  h1-post:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 4vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h2-section:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  h3-subsection:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, monospace"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2rem"
  xl: "3rem"
components:
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    borderRadius: "{rounded.lg}"
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)"
    boxShadowHover: "0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)"
    padding: "0"
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  tag:
    borderRadius: "{rounded.full}"
    padding: "0.3rem 0.7rem"
    fontSize: "{typography.caption.fontSize}"
    fontWeight: 500
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  button:
    borderRadius: "{rounded.md}"
    border: "1.5px solid {colors.border}"
    padding: "0.5rem 1rem"
    fontSize: "0.85rem"
    fontWeight: 500
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
    hoverBorderColor: "{colors.accent}"
    hoverBackground: "{colors.accent-soft}"
    hoverColor: "{colors.accent}"
---

## Overview

El tema del Headless CMS busca un equilibrio entre **funcionalidad editorial** y **elegancia minimalista**. La interfaz debe sentirse como una publicacion digital premium: limpia, jerarquica y enfocada en el contenido.

La filosofia de diseno se basa en tres pilares:

1. **Contenido primero**: el texto es el heroe. La tipografia, el espaciado y los colores estan calibrados para maximizar la legibilidad de posts largos.
2. **Cards con vida**: los posts no son simples listados; son tarjetas fisicas que responden al cursor con elevacion y sombra.
3. **Tema dual coherente**: tanto el modo claro como el oscuro comparten la misma jerarquia visual, solo que invertida. No hay "version pobre" del modo oscuro.

## Colors

La paleta se inspira en los colores de una editorial moderna: fondo calido (no blanco puro), texto profundo (no negro puro), y un azul versatil como acento unico.

### Modo claro

- **Background (#fafafa):** Gris muy calido. Mas suave que el blanco puro para reducir fatiga visual en lecturas largas.
- **Surface (#ffffff):** Blanco puro para las cards y superficies elevadas. Crea contraste sutil contra el fondo.
- **Text (#1a1a2e):** Azul-negro profundo. Mas suave que el negro puro, con suficiente contraste para WCAG AAA.
- **Muted (#6b7280):** Gris medio para metadatos, captions, y elementos secundarios.
- **Accent (#2563eb):** Azul royal. Unico color de interaccion: links, botones, tags, hover states.
- **Border (#e5e7eb):** Gris claro para divisores y bordes de cards. Suficientemente visible sin competir con el contenido.
- **Callout (#eff6ff / #bfdbfe / #1e40af):** Azul muy suave para bloques de atencion. El borde izquierdo acentuado guia la mirada.
- **Category (#059669):** Verde esmeralda para categorias. Distingue taxonomias de tipo "category" de los tags genericos.

### Modo oscuro

- **Background (#0f0f1a):** Azul-negro profundo. Evita el "gris lavado" que hacen muchos temas oscuros.
- **Surface (#181825):** Un tono mas claro que el fondo para crear profundidad. Las cards "flotan" sobre el fondo.
- **Text (#e8e8ef):** Blanco suavizado. Brillante suficiente para leer sin causar halo en pantallas OLED.
- **Accent (#60a5fa):** Azul cielo brillante. Mantiene la identidad del acento pero adaptado para fondos oscuros.
- **Border (#27273a):** Gris azulado. Visible sin romper la oscuridad del tema.

## Typography

El sistema tipografico usa la pila de fuentes del sistema operativo (system font stack). Esto garantiza:
- Carga instantanea (sin fuentes externas)
- Coherencia con el OS del usuario
- Pesos claros: 400 para body, 700/800 para headings

### Jerarquia

- **H1 Hero (clamp 2rem-3rem, weight 800):** Titulo del blog en la homepage. Grande, audaz, con gradiente de texto.
- **H1 Post (clamp 1.6rem-2.2rem, weight 800):** Titulo individual de post. Dominante pero no exagerado.
- **H2 Section (1.35rem, weight 700):** Subtitulos dentro del contenido del post. Separacion clara del body.
- **H3 Subsection (1.15rem, weight 700):** Sub-subtitulos. Ligeramente mas grandes que el body pero con peso extra.
- **Body (1rem, weight 400, line-height 1.65):** Parrafos del post. Espaciado generoso para lectura prolongada.
- **Caption (0.8rem, weight 500):** Metadatos, tags, breadcrumbs. Ligeramente mas grueso que el body-sm para legibilidad.
- **Mono (0.88rem):** Bloques de codigo y read-time. Fuente monoespaciada del sistema.

## Layout

### Contenedor
- Max-width: 760px para contenido legible (la regla de 66-75 caracteres por linea).
- Padding lateral: 1.25rem en mobile, adaptativo en desktop.

### Grid de posts
- **Mobile (< 600px):** 1 columna, cards apiladas verticalmente.
- **Tablet+ (>= 768px):** 2 columnas con la primera card destacada ocupando ambas columnas.
- **Card destacada:** Layout horizontal (imagen 45% + body 55%) para el post mas reciente.

### Header
- Sticky en top: 0 con z-index 50.
- Glassmorphism: `backdrop-filter: blur(12px)` con fondo semitransparente (85% opacidad).
- Altura compacta: ~60px para no robar espacio al contenido.

## Elevation & Depth

El sistema de sombras tiene 4 niveles:

1. **Shadow SM (0 1px 2px rgba(0,0,0,0.04)):** Tarjetas en reposo.
2. **Shadow MD (0 4px 6px rgba(0,0,0,0.06)):** Imagenes inline, embeds, tablas.
3. **Shadow LG (0 10px 15px rgba(0,0,0,0.07)):** Resultados de busqueda flotantes.
4. **Shadow Card Hover (0 4px 12px + 0 8px 24px):** Elevacion de cards al hover. Mas difusa para suavidad.

En modo oscuro, las sombras son mas pronunciadas para compensar la falta de contraste natural.

## Shapes

- **Cards:** 16px de border-radius. Redondeado pero no "burbujeante". Mantiene seriedad editorial.
- **Tags:** 999px (pildora completa). Amigable y moderno.
- **Botones:** 10px. Intermedio entre cards y tags.
- **Avatares:** 50% (circulo perfecto). Standard para fotos de perfil.
- **Tablas:** 10px en el contenedor con `overflow: hidden`. Da la impresion de una sola superficie.

## Components

### Post Card (index)
- Background: `{colors.surface}`
- Border: `1px solid {colors.border}`
- Border-radius: `{rounded.lg}` (16px)
- Padding interno: 0 (la imagen toca los bordes superiores)
- Body padding: 1.25rem 1.5rem 1.5rem
- Hover: `translateY(-3px)` + sombra mas pronunciada + borde cambia a `{colors.accent}`
- Imagen: 220px de alto, `object-fit: cover`, zoom sutil `scale(1.04)` en hover

### Featured Image (post individual)
- Ocupa todo el ancho de la card contenedora
- Altura fija: 420px
- Sin border-radius en la parte superior (se funde con la card)
- Figcaption centrada debajo

### Author Card
- Layout horizontal: avatar (72px circular) + info
- Background: `{colors.accent-soft}`
- Border-top: `1px solid {colors.border}` para separar del contenido
- Avatar con borde blanco de 3px y sombra suave

### Tags
- Forma de pildora (`{rounded.full}`)
- Padding: 0.3rem 0.7rem
- Font: `{typography.caption}`
- Background inicial: `{colors.accent-soft}`
- Hover: fondo cambia a `{colors.accent}`, texto a blanco, `translateY(-1px)`
- Categorias: verde (`{colors.category}`) en lugar de azul

### Pagination
- Botones con borde, fondo `{colors.surface}`, texto `{colors.text}`
- Hover: borde acentuado, fondo acentuado suave, texto acentuado
- Separador central: "Pagina X de Y" en `{colors.muted}`

### Search Results
- Dropdown flotante anclado al input
- Width: 320px, max-height: 400px, scrollable
- Background: `{colors.surface}`, borde `{colors.border}`, shadow `{shadow.lg}`
- Items con hover: fondo `{colors.bg}`

## Do's and Don'ts

### Do
- Mantener el espaciado generoso. El contenido editorial necesita "respirar".
- Usar el acento azul con moderacion. Es el unico color de interaccion; no competir con el.
- Respetar la jerarquia tipografica. Los headings deben reducirse gradualmente, no saltar.
- Proveer feedback visual en todos los elementos interactivos (hover, focus, active).
- Mantener el glassmorphism del header incluso en modo oscuro.

### Don't
- No usar bordes redondeados mayores a 16px en elementos principales. Pierde la seriedad editorial.
- No introducir colores adicionales fuera de la paleta definida. El sistema es monacromatico + acento.
- No reducir el line-height del body por debajo de 1.6. La legibilidad es prioridad.
- No usar sombras puras negras (`rgba(0,0,0,1)`). Las sombras deben tener transparencia y suavidad.
- No hacer el modo oscuro simplemente "invertir colores". Las superficies deben tener profundidad real.
