with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find buildLocale block
locale_start = content.find('async function buildLocale(locale, siteDistDir) {')
locale_end_marker = "\n\nasync function build()"
locale_end = content.find(locale_end_marker, locale_start)

locale_block = content[locale_start:locale_end]

# Add isEs and isEn to every render(layoutTpl, { ... })
# We insert after the opening brace
marker = 'render(layoutTpl, {'
new_marker = 'render(layoutTpl, {\n      isEs: locale === \'es\',\n      isEn: locale === \'en\',' 

locale_block = locale_block.replace(marker, new_marker)

# Reassemble
new_content = content[:locale_start] + locale_block + content[locale_end:]

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Added isEs/isEn to all layout renders in buildLocale')
