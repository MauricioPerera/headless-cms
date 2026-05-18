# Content Blocks Reference

The `content` field of posts and pages is a JSON array of blocks.

## Supported block types

### paragraph
```json
{ "type": "paragraph", "text": "Plain text paragraph." }
```

### heading (H2)
```json
{ "type": "heading", "text": "Section Title" }
```

### heading3 (H3)
```json
{ "type": "heading3", "text": "Subsection" }
```

### image
```json
{ "type": "image", "src": "https://...", "alt": "Description" }
```

### code
```json
{ "type": "code", "text": "const x = 1;" }
```

### quote
```json
{ "type": "quote", "text": "Important quote." }
```

### list
```json
{ "type": "list", "items": ["A", "B", "C"], "ordered": false }
```

### callout
```json
{ "type": "callout", "title": "Note", "text": "Useful info." }
```

### divider
```json
{ "type": "divider" }
```

### table
```json
{
  "type": "table",
  "headers": ["Column A", "Column B"],
  "rows": [["1", "2"], ["3", "4"]]
}
```

### embed
```json
{ "type": "embed", "src": "https://youtube.com/watch?v=..." }
```

Only `http:` and `https:` URLs are allowed. Others are silently dropped.

## Full example

```json
[
  { "type": "paragraph", "text": "Intro text." },
  { "type": "heading", "text": "Main Section" },
  { "type": "image", "src": "https://picsum.photos/800/400", "alt": "Random photo" },
  { "type": "code", "text": "console.log('hello');" },
  { "type": "callout", "title": "Tip", "text": "Use code blocks for syntax." },
  { "type": "divider" },
  { "type": "paragraph", "text": "Conclusion." }
]
```
