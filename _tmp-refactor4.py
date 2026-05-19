import sys

with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find build function start
build_start = content.find('async function build() {')
if build_start == -1:
    print('ERROR: build() not found', file=sys.stderr)
    sys.exit(1)

# Find the matching closing brace using brace depth
brace_depth = 1  # The opening brace of build()
build_body_start = build_start + len('async function build() {')
build_end = None
for i in range(build_body_start, len(content)):
    if content[i] == '{':
        brace_depth += 1
    elif content[i] == '}':
        brace_depth -= 1
        if brace_depth == 0:
            build_end = i
            break

if build_end is None:
    print('ERROR: could not find end of build()', file=sys.stderr)
    sys.exit(1)

print('build() found at positions', build_start, 'to', build_end)
print('Length:', build_end - build_start)

# Extract the full build block including declaration and closing brace
build_block = content[build_start:build_end+1]

# Create buildLocale by modifying build_block
locale_block = build_block.replace(
    'async function build() {',
    'async function buildLocale(locale, siteDistDir) {',
    1  # Only replace first occurrence
)

# Replace DIST_DIR with siteDistDir in the locale block
# But we need to be careful not to replace it in the outer scope references
# In build_block, all DIST_DIR references are local to the function
locale_block = locale_block.replace('DIST_DIR', 'siteDistDir')

# Add locale filtering at the beginning of the function body
# The function body starts after "async function buildLocale(locale, siteDistDir) {"
locale_body_start = locale_block.find('{') + 1

locale_filter = """
  // Filter content by locale (default 'es')
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

# The original build_block has the same code for loading posts/users/taxonomies/pages
# We need to find where the original "const publishedPosts" is and remove everything from there
# until "const layoutTpl"

original_body = locale_block[locale_body_start:]
layout_marker = "const layoutTpl = loadTemplate('layout.html');"
layout_idx = original_body.find(layout_marker)

if layout_idx == -1:
    print('ERROR: layoutTpl not found', file=sys.stderr)
    sys.exit(1)

# Keep only from layoutTpl onwards in the body
new_body = locale_filter + "\n  " + original_body[layout_idx:]

# Reconstruct locale_block
locale_block = locale_block[:locale_body_start] + new_body

# Create new build function
new_build = """
async function build() {
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
    await buildLocale(locale, siteDistDir);
    console.log('  Built locale:', locale);
  }

  console.log(`\\nDone. Output: ${DIST_DIR}`);
}
"""

# Assemble: everything before build, then buildLocale, then new build, then everything after build
before_build = content[:build_start]
after_build = content[build_end+1:]

new_content = before_build + locale_block + "\n\n" + new_build + after_build

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Success! buildLocale() and build() created.')
