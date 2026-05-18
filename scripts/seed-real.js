process.env.JWT_SECRET = process.env.JWT_SECRET || 'seed-dev-secret';

const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const { createUser } = require('../src/models/user');
const { createPost } = require('../src/models/post');
const { createPage } = require('../src/models/page');
const { createTaxonomy } = require('../src/models/taxonomy');
const { flushAll } = require('../src/core/store');

async function seed() {
  console.log('Creando blog realista...');

  const mauricio = await createUser({
    username: 'mauricio',
    email: 'mauricio@example.com',
    password: 'admin123',
    displayName: 'Mauricio Perera',
    role: 'admin'
  });
  console.log('Autor:', mauricio.displayName);

  const ana = await createUser({
    username: 'ana',
    email: 'ana@example.com',
    password: 'editor123',
    displayName: 'Ana Rodriguez',
    role: 'editor'
  });
  console.log('Autor:', ana.displayName);

  const catArquitectura = await createTaxonomy({ name: 'Arquitectura de Software', type: 'category', description: 'Patrones, principios y decisiones de diseno' });
  const catFrontend = await createTaxonomy({ name: 'Frontend', type: 'category', description: 'HTML, CSS, JavaScript y frameworks' });
  const catHerramientas = await createTaxonomy({ name: 'Herramientas', type: 'category', description: 'Editores, CLI, workflows y automatizacion' });
  const catSeguridad = await createTaxonomy({ name: 'Seguridad', type: 'category', description: 'Vulnerabilidades, buenas practicas y hardening' });

  const tagJS = await createTaxonomy({ name: 'JavaScript', type: 'tag' });
  const tagReact = await createTaxonomy({ name: 'React', type: 'tag' });
  const tagCSS = await createTaxonomy({ name: 'CSS', type: 'tag' });
  const tagNode = await createTaxonomy({ name: 'Node.js', type: 'tag' });
  const tagAPI = await createTaxonomy({ name: 'API Design', type: 'tag' });
  const tagWordPress = await createTaxonomy({ name: 'WordPress', type: 'tag' });
  const tagSSG = await createTaxonomy({ name: 'SSG', type: 'tag' });
  const tagCMS = await createTaxonomy({ name: 'CMS', type: 'tag' });
  const tagGit = await createTaxonomy({ name: 'Git', type: 'tag' });
  const tagVite = await createTaxonomy({ name: 'Vite', type: 'tag' });

  console.log('Taxonomias creadas');
  // Paginas estaticas
  await createPage({
    title: 'Acerca de',
    slug: 'acerca-de',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Este blog es un experimento vivo: un CMS headless construido desde cero con Node.js, js-doc-store como base de datos documental JSON, y un generador de sitios estaticos sin dependencias pesadas.' },
      { type: 'heading', text: 'Por que abandonar WordPress' },
      { type: 'paragraph', text: 'Despues de 12 anos usando WordPress para todo, decidi construir mi propio sistema. No por rebeldia, sino por necesidad: el modelo de datos de WordPress data de 2003, y no escala bien para contenido moderno.' },
      { type: 'heading', text: 'Stack tecnico' },
      { type: 'list', items: ['Node.js + Express para la API REST', 'js-doc-store como DB documental JSON', 'Generador de sitios estaticos propio', 'GitHub Pages para hosting gratuito', 'JWT + bcrypt para autenticacion'] },
      { type: 'paragraph', text: 'Todo el codigo es open source y esta disponible en GitHub.' }
    ]),
    excerpt: 'Sobre este blog, su stack tecnico, y por que existe.',
  });
  await createPage({
    title: 'Contacto',
    slug: 'contacto',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Puedes encontrarme en las siguientes plataformas:' },
      { type: 'list', items: ['GitHub: @MauricioPerera', 'Twitter: @mauricioperera', 'Email: mauricio@example.com'] },
      { type: 'paragraph', text: 'Para consultas sobre desarrollo, arquitectura de software, o colaboraciones en proyectos open source, no dudes en escribir.' }
    ]),
    excerpt: 'Formas de contactar al autor de este blog.',
  });
  console.log('Paginas: Acerca de, Contacto');


  // Post 1
  await createPost({
    title: 'Por que deje WordPress para construir mi propio CMS',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Despues de 12 anos usando WordPress para todo, desde blogs personales hasta sitios corporativos, tome una decision que muchos considerarian extrema: construir mi propio sistema de gestion de contenido desde cero.' },
      { type: 'heading', text: 'El problema con las bases de datos relacionales' },
      { type: 'paragraph', text: 'WordPress usa MySQL con un esquema que data de 2003. La tabla wp_posts almacena todo en un campo longtext. Las taxonomias viven en tres tablas separadas. Las meta queries se convierten en JOINs recursivos que escalan mal.' },
      { type: 'callout', title: 'Dato clave', text: 'Una query de postmeta con 3 condiciones OR puede generar 6 JOINs anidados. En un sitio con 10,000 posts, eso es catastrofico.' },
      { type: 'heading', text: 'La alternativa: documentos JSON' },
      { type: 'paragraph', text: 'Con js-doc-store, cada post es un documento JSON completo. Las taxonomias son arrays de IDs. Las metadatos son propiedades nativas. No hay JOINs porque no hay tablas.' },
      { type: 'code', text: 'const posts = db.collection("posts").find({\n  status: "published",\n  taxonomyIds: { $contains: "javascript-id" }\n}).sort("publishedAt", -1);' },
      { type: 'divider' },
      { type: 'paragraph', text: 'El resultado: cero SQL injection, cero migraciones, y queries que resuelven en milisegundos sin indices complejos.' }
    ]),
    excerpt: 'De WordPress a un CMS documental: por que las bases de datos relacionales ya no son la respuesta para contenido moderno.',
    status: 'published',
    authorId: mauricio._id,
    taxonomyIds: [catArquitectura._id, catHerramientas._id, tagJS._id, tagNode._id, tagCMS._id, tagWordPress._id],
    featuredImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop',
    meta: { readTime: 8 }
  });
  console.log('Post: Por que deje WordPress...');

  // Post 2
  await createPost({
    title: 'Construyendo un generador de sitios estaticos sin dependencias',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Los SSG modernos como Astro o Eleventy son excelentes, pero muchas veces traen mas de lo que necesitas. Mi objetivo era simple: convertir una base de datos JSON en HTML estatico, sin webpack, sin bundlers, sin 200MB de node_modules.' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop', alt: 'Editor de codigo con tema oscuro' },
      { type: 'heading', text: 'El motor de templates' },
      { type: 'paragraph', text: 'En lugar de usar un motor de templates completo como Handlebars o EJS, escribi un renderizador de 10 lineas que entiende {{variables}} y bloques {{#array}}...{{/array}}.' },
      { type: 'code', text: 'function render(template, data) {\n  return template\n    .replace(/\\{\\{#(\\w+)\\}\\}([\\s\\S]*?)\\{\\{/\\1\\}\\}/g, (m,k,inner) =>\n      (data[k]||[]).map(i => render(inner, {...data,...i})).join(\"\"))\n    .replace(/\\{\\{(\\w+)\\}\\}/g, (m,k) => data[k] ?? m);\n}' },
      { type: 'paragraph', text: 'Eso es todo. 3 lineas de regex y recursividad. Genera HTML, RSS, sitemaps y JSON API desde los mismos templates.' },
      { type: 'heading', text: 'Rendimiento del build' },
      { type: 'table', headers: ['Etapa', 'Tiempo', 'Archivos generados'], rows: [
        ['Lectura DB', '5ms', '3 colecciones'],
        ['Render posts', '12ms', '2 HTML'],
        ['Render taxonomias', '8ms', '5 HTML'],
        ['RSS + Sitemap', '3ms', '7 XML'],
        ['Copia assets', '10ms', '2 archivos'],
        ['Total', '~40ms', '19 archivos']
      ]},
      { type: 'callout', text: 'El build completo de un blog con 2 posts, 4 taxonomias, RSS, sitemap y busqueda indexada toma menos de 50ms en un MacBook Air M2.' },
      { type: 'paragraph', text: 'Comparado con Astro (que tarda 3-5 segundos en el mismo hardware), la diferencia es abismal. Claro, Astro hace mucho mas (hydration, bundling, etc.), pero para un blog estatico puro, es overkill.' }
    ]),
    excerpt: 'Como construi un generador de sitios estaticos de cero que compila un blog completo en menos de 50ms, sin webpack ni dependencias pesadas.',
    status: 'published',
    authorId: mauricio._id,
    taxonomyIds: [catArquitectura._id, catFrontend._id, tagSSG._id, tagNode._id, tagJS._id, tagVite._id],
    featuredImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop',
    meta: { readTime: 12 }
  });
  console.log('Post: Construyendo un generador de sitios estaticos...');

  // Post 3
  await createPost({
    title: 'CSS moderno que no necesita JavaScript',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Durante anos asumimos que ciertas interacciones requieren JavaScript: acordeones, modales, tooltips, tabs. Pero CSS ha evolucionado masivamente desde 2020.' },
      { type: 'heading', text: 'El acordeon con details/summary' },
      { type: 'paragraph', text: 'La etiqueta details con summary resuelve el 90% de los casos de acordeon sin una sola linea de JS. Es accesible por defecto, funciona sin JavaScript deshabilitado, y tiene transiciones nativas en Chrome 131+.' },
      { type: 'code', text: '<details>\n  <summary>Titulo del panel</summary>\n  <p>Contenido colapsable...</p>\n</details>' },
      { type: 'heading', text: 'Dialog nativo' },
      { type: 'paragraph', text: 'La etiqueta dialog con el metodo showModal() maneja focus trapping, backdrop, Escape para cerrar, y aria-hidden automaticamente. Todo eso que antes requeria una libreria de 5KB ahora es nativo.' },
      { type: 'heading', text: 'Container queries' },
      { type: 'paragraph', text: 'Los media queries basados en viewport son una abstraccion incorrecta. Un componente no deberia saber el tamano de la ventana; deberia saber el tamano de su contenedor. Las container queries resuelven esto desde 2022.' },
      { type: 'code', text: '.card-container {\n  container-type: inline-size;\n}\n\n@container (min-width: 400px) {\n  .card {\n    display: grid;\n    grid-template-columns: auto 1fr;\n  }\n}' },
      { type: 'paragraph', text: 'Con :has(), anchor positioning, y scroll-driven animations en el horizonte, JavaScript para UI visual se esta volviendo opcional en lugar de obligatorio.' }
    ]),
    excerpt: 'Acordeones, modales, tabs y tooltips con puro CSS nativo: por que JavaScript ya no es necesario para la mayoria de las interacciones basicas.',
    status: 'published',
    authorId: ana._id,
    taxonomyIds: [catFrontend._id, tagCSS._id, tagReact._id],
    meta: { readTime: 6 }
  });
  console.log('Post: CSS moderno que no necesita JavaScript...');

  // Post 4 — draft
  await createPost({
    title: 'Guia completa de rate limiting en APIs Node.js',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Esta guia cubre desde un rate limiter en memoria hasta integraciones con Redis para arquitecturas distribuidas.' },
      { type: 'heading', text: 'Por que no usar express-rate-limit' },
      { type: 'paragraph', text: 'Es una excelente libreria, pero trae dependencias innecesarias para casos simples. Un limiter en 50 lineas de vanilla JS cubre el 80% de los casos.' },
      { type: 'callout', title: 'En progreso', text: 'Este post esta en borrador y se publicara la proxima semana.' }
    ]),
    excerpt: 'Desde limiters en memoria hasta Redis: como proteger tu API Node.js contra fuerza bruta y DDoS sin dependencias externas.',
    status: 'published',
    authorId: mauricio._id,
    taxonomyIds: [catSeguridad._id, tagNode._id, tagAPI._id],
    meta: { readTime: 15 }
  });
  console.log('Post: Guia completa de rate limiting [DRAFT]');

  // Post 5
  await createPost({
    title: 'Git workflows que escalan en equipos grandes',
    content: JSON.stringify([
      { type: 'paragraph', text: 'El modelo GitFlow fue disenado en 2010 para proyectos con releases cada 6 semanas. En 2026, con deploys continuos multiples veces al dia, es una carga mas que una ayuda.' },
      { type: 'heading', text: 'GitHub Flow: la alternativa minimalista' },
      { type: 'paragraph', text: 'Una sola rama main, feature branches cortas, y pull requests para code review. Sin develop, sin release branches, sin merge hell.' },
      { type: 'table', headers: ['Workflow', 'Ramas', 'Deploys/dia', 'Complejidad'], rows: [
        ['GitFlow', '5+', '1-2', 'Alta'],
        ['GitHub Flow', '2', '10+', 'Baja'],
        ['Trunk-based', '1', '50+', 'Minima']
      ]},
      { type: 'heading', text: 'Feature flags vs feature branches' },
      { type: 'paragraph', text: 'En lugar de mantener una branch abierta por semanas, mergea a main inmediatamente y oculta la funcionalidad tras una feature flag. Esto reduce el tiempo de integracion de dias a minutos.' },
      { type: 'code', text: 'if (flags.isEnabled("nuevo-checkout")) {\n  return <NuevoCheckout />;\n}\nreturn <CheckoutLegacy />;' },
      { type: 'paragraph', text: 'El codigo nunca esta desactualizado, los conflictos son raros, y el rollback es instantaneo (solo cambias la flag).' }
    ]),
    excerpt: 'Por que GitFlow esta obsoleto en 2026 y como GitHub Flow + feature flags permiten deploys continuos sin friccion.',
    status: 'published',
    authorId: ana._id,
    taxonomyIds: [catHerramientas._id, tagGit._id],
    featuredImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200&h=600&fit=crop',
    meta: { readTime: 10 }
  });
  console.log('Post: Git workflows que escalan...');


  // Post 6
  await createPost({
    title: 'Por que los JSON databases son el futuro del contenido web',
    content: JSON.stringify([
      { type: 'paragraph', text: 'La industria del software ha pasado por ciclos de centralizacion y descentralizacion. De los mainframes a los client-server, de las nubes a los edge functions. El siguiente ciclo ya esta en marcha: las bases de datos documentales embebidas.' },
      { type: 'heading', text: 'Menos infraestructura, mas contenido' },
      { type: 'paragraph', text: 'Cada vez que agregas una base de datos externa a tu stack, introduces un punto de fallo, una latencia de red, y una curva de aprendizaje. Con una DB JSON embebida, tu aplicacion es autocontenida.' },
      { type: 'callout', text: 'Un sitio estatico generado desde JSON puede desplegarse en GitHub Pages, Cloudflare Pages, Netlify, o cualquier CDN sin configurar ni un solo servidor.' },
      { type: 'paragraph', text: 'Esto no significa que SQL este muerto. Significa que para el 80% de los casos de uso de CMS, una DB documental embebida es suficiente, mas rapida, y mas simple.' }
    ]),
    excerpt: 'De las bases de datos relacionales a los documentos JSON embebidos: por que la proxima generacion de CMS no necesita SQL.',
    status: 'published',
    authorId: mauricio._id,
    taxonomyIds: [catArquitectura._id, tagJS._id, tagNode._id],
    featuredImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=600&fit=crop',
    meta: { readTime: 7 }
  });
  console.log('Post: Por que los JSON databases...');

  flushAll();
  console.log('\nBlog realista creado. 5 posts (4 publicados, 1 draft), 4 categorias, 10 tags.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});






