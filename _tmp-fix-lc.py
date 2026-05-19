with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace isEs/isEn with langClassEs/langClassEn in buildLocale
locale_start = content.find('async function buildLocale(locale, siteDistDir) {')
locale_end_marker = "\n\nasync function build()"
locale_end = content.find(locale_end_marker, locale_start)

locale_block = content[locale_start:locale_end]
locale_block = locale_block.replace(
    "isEs: locale === 'es',\n      isEn: locale === 'en',",
    "langClassEs: locale === 'es' ? 'active' : '',\n      langClassEn: locale === 'en' ? 'active' : '',"
)

new_content = content[:locale_start] + locale_block + content[locale_end:]

with open('scripts/build-static.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Replaced isEs/isEn with langClassEs/langClassEn')
