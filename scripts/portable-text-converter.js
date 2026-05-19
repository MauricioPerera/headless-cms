/**
 * Sanity Portable Text → Headless CMS blocks converter
 */

function portableTextToBlocks(portableText) {
  if (!Array.isArray(portableText)) return [];
  const blocks = [];

  for (const node of portableText) {
    if (!node || !node._type) continue;

    switch (node._type) {
      case 'block': {
        const text = extractText(node);
        if (!text.trim()) continue;
        const style = node.style || 'normal';
        if (style === 'h1' || style === 'h2') {
          blocks.push({ type: 'heading', text });
        } else if (style === 'h3' || style === 'h4') {
          blocks.push({ type: 'heading3', text });
        } else if (style === 'blockquote') {
          blocks.push({ type: 'quote', text });
        } else {
          blocks.push({ type: 'paragraph', text });
        }
        break;
      }
      case 'image': {
        blocks.push({
          type: 'image',
          src: node.asset?.url || node.src || '',
          alt: node.alt || '',
        });
        break;
      }
      case 'code': {
        blocks.push({
          type: 'code',
          text: node.code || '',
        });
        break;
      }
      default: {
        // Unknown type → paragraph as fallback
        const text = extractText(node);
        if (text.trim()) blocks.push({ type: 'paragraph', text });
      }
    }
  }

  return blocks;
}

function extractText(blockNode) {
  if (!blockNode.children) return '';
  return blockNode.children.map(child => {
    if (child._type === 'span') {
      let text = child.text || '';
      const marks = child.marks || [];
      if (marks.includes('strong') || marks.includes('em')) {
        // Our system doesn't support inline marks; flatten to plain text
        return text;
      }
      return text;
    }
    if (child.text) return child.text;
    return '';
  }).join('');
}

module.exports = { portableTextToBlocks };
