with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find buildLocale and add localeBasePath logic
# We need to:
# 1. Add 'const localeBasePath = locale === \"es\" ? CONFIG.basePath : CONFIG.basePath + locale + \"/\";'
#    at the beginning of buildLocale
# 2. Replace CONFIG.basePath with localeBasePath inside buildLocale

# Find buildLocale start
locale_start = content.find('async function buildLocale(locale, siteDistDir) {')
if locale_start == -1:
    print('ERROR: buildLocale not found')
    exit(1)

# Find buildLocale end - it's the next occurrence of "}\n\nasync function build()"
locale_end_marker = "\n\nasync function build()"
locale_end = content.find(locale_end_marker, locale_start)
if locale_end == -1:
    print('ERROR: buildLocale end not found')
    exit(1)

locale_block = content[locale_start:locale_end]

# Add localeBasePath after the function declaration
locale_body_start = locale_block.find('{') + 1
locale_basepath = "\n  const localeBasePath = locale === 'es' ? CONFIG.basePath : CONFIG.basePath + locale + '/';\n"

# Replace CONFIG.basePath with localeBasePath in the locale block
# But we need to be careful not to replace it in the localeBasePath declaration itself
# So we replace after the declaration
body_after_decl = locale_block[locale_body_start:]
body_replaced = body_after_decl.replace('CONFIG.basePath', 'localeBasePath')

# Reconstruct locale_block
new_locale_block = locale_block[:locale_body_start] + locale_basepath + body_replaced

# Reassemble
new_content = content[:locale_start] + new_locale_block + content[locale_end:]

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Modified buildLocale to use localeBasePath')
