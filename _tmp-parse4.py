with open('scripts/build-static.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# build() starts at line 223 (index 222)
start_idx = 222

# Count braces from line 224 onwards
brace_depth = 1  # We're already inside build() because of the { on line 223
end_idx = None
for i in range(start_idx + 1, len(lines)):
    for char in lines[i]:
        if char == '{':
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
            if brace_depth == 0:
                end_idx = i
                break
    if end_idx is not None:
        break

print('build() spans lines', start_idx + 1, 'to', end_idx + 1)
print('First line:', lines[start_idx].strip())
print('Last line:', lines[end_idx].strip())
print('Next line:', lines[end_idx + 1].strip() if end_idx + 1 < len(lines) else 'EOF')
