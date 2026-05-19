import sys

with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find build function boundaries
start_line = None
for i, line in enumerate(lines):
    if 'async function build()' in line:
        start_line = i
        break

if start_line is None:
    print('ERROR: build() not found', file=sys.stderr)
    sys.exit(1)

# Find matching closing brace
brace_depth = 1  # We start inside the build() function
end_line = None
for i in range(start_line + 1, len(lines)):
    for char in lines[i]:
        if char == '{':
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
            if brace_depth == 0:
                end_line = i
                break
    if end_line is not None:
        break

print('build() from line', start_line + 1, 'to', end_line + 1)
print('Total lines:', len(lines))
