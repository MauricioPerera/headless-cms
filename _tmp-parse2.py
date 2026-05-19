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

print('build_start:', build_start, file=sys.stderr)
print('build_body_end:', build_body_end, file=sys.stderr)

if build_body_end is None:
    print('ERROR: could not find end of build()', file=sys.stderr)
    sys.exit(1)

before_build = content[:build_start]
build_body = content[build_body_start:build_body_end]
after_build = content[build_body_end:]

setup_marker = "const publishedPosts = postsCol.find({ status: 'published' }).sort('publishedAt', -1).toArray();"
setup_idx = build_body.find(setup_marker)

print('setup_idx:', setup_idx, file=sys.stderr)

if setup_idx == -1:
    print('ERROR: could not find setup marker', file=sys.stderr)
    sys.exit(1)

setup_part = build_body[:setup_idx]
generation_part = build_body[setup_idx:]

print('setup_part length:', len(setup_part), file=sys.stderr)
print('generation_part length:', len(generation_part), file=sys.stderr)
print('OK', file=sys.stderr)
