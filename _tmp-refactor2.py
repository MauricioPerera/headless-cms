import re, sys

with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find build body
build_start = content.find('async function build() {')
build_body_start = build_start + len('async function build() {')

brace_count = 0
build_body_end = None
for i in range(build_body_start, len(content)):
    if content[i] == '{':
        brace_count += 1
    elif content[i] == '}':
        if brace_count == 0:
            build_body_end = i
            break
        brace_count -= 1

if build_body_end is None:
    print('ERROR: could not find end of build()', file=sys.stderr)
    sys.exit(1)

before_build = content[:build_start]
build_body = content[build_body_start:build_body_end]
after_build = content[build_body_end:]

setup_marker = "const publishedPosts = postsCol.find({ status: 'published' }).sort('publishedAt', -1).toArray();"
setup_idx = build_body.find(setup_marker)

if setup_idx == -1:
    print('ERROR: could not find setup marker', file=sys.stderr)
    sys.exit(1)

setup_part = build_body[:setup_idx]
generation_part = build_body[setup_idx:]

# In generation_part, we need to replace references to DIST_DIR with siteDistDir
# and ensure enrichedPosts only contains locale posts
# publishedPosts is already filtered by locale in our new setup

# Replace DIST_DIR with siteDistDir in generation_part
# But be careful: DIST_DIR is also used in the outer scope. In generation_part,
# all references should use siteDistDir.
generation_modified = generation_part.replace('DIST_DIR', 'siteDistDir')

# Also replace the initial const declarations that we moved to generateSite setup
# generation_part starts with "const publishedPosts = ..." which we need to remove
# because we defined it in generateSite setup
# Actually, generation_part starts with the const publishedPosts line itself
# Let's remove that first line since we're redefining it in generateSite
first_newline = generation_part.find('\n')
if first_newline != -1:
    generation_modified = generation_modified[first_newline+1:]

# Build generateSite function
new_generate_site = """
async function generateSite(locale, siteDistDir) {
  // Filter content by locale (default 'es')
  const publishedPosts = postsCol.find({ status: 'published' }).sort('publishedAt', -1).toArray()
    .filter(p => (p.locale || 'es') === locale);
  const localePages = pagesCol.find({}).sort('createdAt', -1).toArray()
    .filter(p => (p.locale || 'es') === locale);
""" + generation_modified + """
}
"""

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
    await generateSite(locale, siteDistDir);
  }

  console.log(`\\nDone. Output: ${DIST_DIR}`);
}
"""

new_content = before_build + new_generate_site + new_build + after_build

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Refactored successfully')
print('generateSite() created with locale filtering')
print('build() now iterates over detected locales')
