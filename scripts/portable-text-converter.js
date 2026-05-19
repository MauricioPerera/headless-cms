/**
 * Sanity Portable Text → Headless CMS blocks converter
 */

function portableTextToBlocks(portableText) {
  if (!Array.isArray(portableText)) return [];

  const blocks = [];
  let currentList = null; // { type: 'list', items: [], ordered: bool }

  function flushList() {
    if (currentList && currentList.items.length > 0) {
      blocks.push(currentList);
    }
    currentList = null;
  }

  for (const node of portableText) {
    if (!node || !node._type) continue;

    // List items: Sanity uses block nodes with a `listItem` property
    if (node._type === 'block' && node.listItem) {
      const ordered = node.listItem === 'number';
      const text = extractText(node);
      if (!text.trim()) continue;

      if (!currentList || currentList.ordered !== ordered) {
        flushList();
        currentList = { type: 'list', items: [], ordered };
      }
      currentList.items.push(text);
      continue;
    }

    // Non-list node: flush any open list first
    flushList();

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
        const src = node.asset?.url || node.src || '';
        if (src) blocks.push({ type: 'image', src, alt: node.alt || '' });
        break;
      }
      case 'code': {
        const text = node.code || '';
        if (text) blocks.push({ type: 'code', text });
        break;
      }
      default: {
        // Unknown type → try to extract text as paragraph fallback
        const text = extractText(node);
        if (text.trim()) blocks.push({ type: 'paragraph', text });
      }
    }
  }

  // Flush any trailing list
  flushList();

  return blocks;
}

function extractText(blockNode) {
  if (!blockNode.children) return '';
  return blockNode.children
    .map(child => (child._type === 'span' || child.text) ? (child.text || '') : '')
    .join('');
}

module.exports = { portableTextToBlocks };
