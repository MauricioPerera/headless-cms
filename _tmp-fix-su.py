with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    content = f.read()

locale_start = content.find('async function buildLocale(locale, siteDistDir) {')
locale_end_marker = "\n\nasync function build()"
locale_end = content.find(locale_end_marker, locale_start)

locale_block = content[locale_start:locale_end]

# Add localeSiteUrl after localeBasePath
locale_bp_marker = "const localeBasePath = locale === 'es' ? CONFIG.basePath : CONFIG.basePath + locale + '/';"
bp_idx = locale_block.find(locale_bp_marker)

if bp_idx == -1:
    print('ERROR: localeBasePath not found')
    exit(1)

# Insert localeSiteUrl after localeBasePath line
bp_end = locale_block.find('\n', bp_idx) + 1
locale_siteurl = "  const localeSiteUrl = locale === 'es' ? CONFIG.siteUrl : CONFIG.siteUrl + locale + '/';\n"

new_locale_block = locale_block[:bp_end] + locale_siteurl + locale_block[bp_end:]

# Replace CONFIG.siteUrl with localeSiteUrl in the locale block
# But not in the localeSiteUrl declaration itself
# Find the declaration end and replace after it
decl_end = new_locale_block.find(locale_siteurl) + len(locale_siteurl)
before_decl = new_locale_block[:decl_end]
after_decl = new_locale_block[decl_end:].replace('CONFIG.siteUrl', 'localeSiteUrl')
new_locale_block = before_decl + after_decl

# Reassemble
new_content = content[:locale_start] + new_locale_block + content[locale_end:]

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Added localeSiteUrl to buildLocale')
