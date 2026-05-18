process.env.JWT_SECRET = process.env.JWT_SECRET || 'seed-dev-secret-do-not-use-in-production';

const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const { createUser } = require('../src/models/user');
const { createPost } = require('../src/models/post');
const { createTaxonomy } = require('../src/models/taxonomy');
const { flushAll } = require('../src/core/store');

async function seed() {
  console.log('Seeding database...');

  const admin = await createUser({
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    displayName: 'Administrator',
    role: 'admin'
  });
  console.log('Admin created:', admin.username);

  const editor = await createUser({
    username: 'editor',
    email: 'editor@example.com',
    password: 'editor123',
    displayName: 'Editor',
    role: 'editor'
  });
  console.log('Editor created:', editor.username);

  const catTech = await createTaxonomy({ name: 'Tecnologia', type: 'category', description: 'Posts sobre tecnologia' });
  const catDev = await createTaxonomy({ name: 'Desarrollo', type: 'category', description: 'Posts sobre desarrollo' });
  const tagJS = await createTaxonomy({ name: 'JavaScript', type: 'tag' });
  const tagWP = await createTaxonomy({ name: 'WordPress', type: 'tag' });
  const tagArch = await createTaxonomy({ name: 'Arquitectura', type: 'tag' });
  console.log('Taxonomies created');

  const post1 = await createPost({
    title: 'Por que evitar SQL injection es trivial sin SQL',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Usando una base de datos documental, las consultas son filtros de objetos, no strings concatenados.' },
      { type: 'callout', title: 'Ventaja clave', text: 'Sin SQL no hay SQL injection. Es una clase entera de vulnerabilidades que desaparece por diseno.' },
      { type: 'heading', text: 'Como funciona js-doc-store' },
      { type: 'paragraph', text: 'El motor de consultas evalua filtros de objetos JavaScript directamente sobre documentos JSON en memoria.' },
      { type: 'code', text: 'posts.find({ status: "published", authorId: userId })' },
      { type: 'divider' },
      { type: 'paragraph', text: 'Esto es radicalmente mas seguro que concatenar strings SQL.' }
    ]),
    excerpt: 'Las bases de datos documentales eliminan una clase entera de vulnerabilidades.',
    status: 'published',
    authorId: admin._id,
    taxonomyIds: [catTech._id, tagJS._id],
    meta: { readTime: 5 }
  });
  console.log('Post created:', post1.title);

  const post2 = await createPost({
    title: 'Relaciones entre contenidos sin JOINs',
    content: JSON.stringify([
      { type: 'paragraph', text: 'Con documentos JSON, las relaciones se resuelven por referencia y denormalizacion parcial.' },
      { type: 'heading', text: 'Comparativa rapida' },
      { type: 'table', headers: ['Modelo', 'Consulta', 'Escalabilidad'], rows: [
        ['Relacional', 'JOIN + subconsultas', 'Media'],
        ['Documental', 'Referencia + lookup', 'Alta'],
        ['Grafo', 'Traversals', 'Muy alta']
      ]},
      { type: 'callout', text: 'La denormalizacion controlada reduce JOINs sin sacrificar consistencia.' },
      { type: 'embed', src: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { type: 'paragraph', text: 'El resultado: menos complejidad, mejor rendimiento de lectura.' }
    ]),
    excerpt: 'Evitamos JOINs costosos con un modelo de datos flexible.',
    status: 'published',
    authorId: editor._id,
    taxonomyIds: [catDev._id, tagJS._id, tagWP._id, tagArch._id],
    meta: { readTime: 8 }
  });
  console.log('Post created:', post2.title);

  flushAll();
  console.log('Seed completed.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
