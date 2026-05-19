import sys

with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# build() starts at line 223 (index 222)
# body is lines 224-569 (indices 223-568)
# closing brace at line 570 (index 569)

body_lines = lines[223:569]  # excludes the closing brace line
body = ''.join(body_lines)

# Create generateSite function
# We need to:
# 1. Filter publishedPosts by locale
# 2. Filter localePages by locale
# 3. Replace DIST_DIR with siteDistDir
# 4. Keep allUsers, allTaxonomies as-is for navigation

generate_site = """
async function generateSite(locale, siteDistDir) {
  // Filter content by locale
  const publishedPosts = postsCol.find({ status: 'published' }).sort('publishedAt', -1).toArray()
    .filter(p => (p.locale || 'es') === locale);
  const allUsers = usersCol.find({}).toArray();
  const allTaxonomies = taxCol.find({}).toArray();
  const allPages = pagesCol.find({}).sort('createdAt', -1).toArray()
    .filter(p => (p.locale || 'es') === locale);

  const userMap = new Map(allUsers.map(u => [u._id, u]));
  const taxMap = new Map(allTaxonomies.map(t => [t._id, t]));

  const enrichedPosts = publishedPosts.map(post => {
    const author = userMap.get(post.authorId);
    const taxonomies = (post.taxonomyIds || []).map(id => taxMap.get(id)).filter(Boolean);
    const categories = taxonomies.filter(t => t.type === 'category');
    const tags = taxonomies.filter(t => t.type === 'tag');
    return {
      ...post,
      publishedDate: fmtDate(post.publishedAt || post.createdAt),
      rssDate: rssDate(post.publishedAt || post.createdAt),
      updatedAt: (post.updatedAt || post.createdAt).split('T')[0],
      content: renderContent(post.content),
      excerpt: escapeHtml(post.excerpt || ''),
      readTime: (post.meta && post.meta.readTime) ? post.meta.readTime : 5,
      featuredImage: post.featuredImage ? (typeof post.featuredImage === "string" ? { src: post.featuredImage, alt: post.title } : { src: post.featuredImage.src, alt: post.featuredImage.alt || post.title, caption: post.featuredImage.caption || "" }) : null,
      author: author ? { displayName: author.displayName || author.username, avatar: author.avatar, bio: author.bio || '' } : null,
      categories: categories.map(t => ({ ...t, basePath: CONFIG.basePath })),
      tags: tags.map(t => ({ ...t, basePath: CONFIG.basePath })),
    };
  });
"""

# The rest of the body needs DIST_DIR -> siteDistDir
# But we need to skip the first part of body that we already replaced above
# The original body starts with console.log, cleanDist check, publishedPosts, etc.
# Let's find where "const layoutTpl" appears in body - that's where generation starts

layout_idx = body.find('const layoutTpl = loadTemplate')
if layout_idx == -1:
    print('ERROR: could not find layoutTpl', file=sys.stderr)
    sys.exit(1)

# From layoutTpl onwards, replace DIST_DIR with siteDistDir
generation_rest = body[layout_idx:].replace('DIST_DIR', 'siteDistDir')

# Also need to handle that allPages in the original code should use locale-filtered pages
# In generation_rest, allPages is used in a few places. We replaced it above with the filtered version.
# The original body used 'allPages' which we defined as locale-filtered in generate_site.

full_generate = generate_site + generation_rest + "\n}\n\n"

# New build function
new_build = """async function build() {
  console.log('Building static site...');

  if (!fs.existsSync(DB_DIR) || fs.readdirSync(DB_DIR).length === 0) {
    console.error('ERROR: No se encontro la base de datos en db/');
    console.error('Ejecuta primero: npm run seed');
    console.error('Luego commitea la carpeta db/ para que el deploy la incluya.');
    process.exit(1);
  }

  cleanDist();
  copyStatic();

  // Detect available locales from published posts
  const allPublished = postsCol.find({ status: 'published' }).sort('publishedAt', -1).toArray();
  const locales = [...new Set(allPublished.map(p => p.locale || 'es'))];
  console.log('  Detected locales:', locales.join(', '));

  for (const locale of locales) {
    const siteDistDir = locale === 'es' ? DIST_DIR : path.join(DIST_DIR, locale);
    if (locale !== 'es') {
      fs.mkdirSync(siteDistDir, { recursive: true });
    }
    await generateSite(locale, siteDistDir);
    console.log(`  Built locale: ${locale}`);
  }

  console.log(`\\nDone. Output: ${DIST_DIR}`);
}

"""

# Assemble new file
new_lines = lines[:222] + [full_generate] + [new_build] + lines[570:]

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Refactored successfully')
print('generateSite() created with locale filtering')
