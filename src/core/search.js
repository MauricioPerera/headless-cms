const STOP_WORDS = new Set([
  'el','la','de','que','y','en','un','ser','se','no','haber','por','con','su','para','como',
  'estar','tener','lo','le','todo','pero','mas','hacer','o','poder','decir','este','ir','otro',
  'ese','si','me','ya','ver','porque','dar','cuando','el','muy','sin','vez','mucho','saber',
  'que','sobre','mi','alguno','mismo','yo','tambien','hasta','a','e','i','u'
]);

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text) {
  if (!text) return [];
  const normalized = removeAccents(text).toLowerCase();
  return normalized
    .split(/[^a-z0-9ñ]+/g)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function extractTextFromBlocks(content) {
  let text = '';
  try {
    const blocks = typeof content === 'string' ? JSON.parse(content) : content;
    if (!Array.isArray(blocks)) return String(content);
    for (const block of blocks) {
      if (!block) continue;
      if (block.text) text += ' ' + block.text;
      if (block.alt) text += ' ' + block.alt;
      if (Array.isArray(block.headers)) text += ' ' + block.headers.join(' ');
      if (Array.isArray(block.rows)) {
        for (const row of block.rows) {
          if (Array.isArray(row)) text += ' ' + row.join(' ');
        }
      }
    }
  } catch {
    text += ' ' + String(content);
  }
  return text;
}

function getPostText(post) {
  const parts = [post.title || '', post.excerpt || ''];
  if (post.content) parts.push(extractTextFromBlocks(post.content));
  return parts.join(' ');
}

function buildIndex(posts) {
  const index = {}; // term -> { docId, tf }
  const docTexts = {}; // docId -> token array
  const docs = []; // all docs

  for (const post of posts) {
    if (post.status && post.status !== 'published') continue;
    const docId = post._id;
    const text = getPostText(post);
    const tokens = tokenize(text);
    docTexts[docId] = tokens;
    docs.push({ _id: docId, slug: post.slug, title: post.title, excerpt: post.excerpt });

    const tf = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }
    for (const [term, count] of Object.entries(tf)) {
      if (!index[term]) index[term] = [];
      index[term].push({ docId, tf: count });
    }
  }

  const N = docs.length;
  const idf = {};
  for (const [term, postings] of Object.entries(index)) {
    const df = postings.length;
    idf[term] = Math.log((N + 1) / (df + 1)) + 1; // smoothed idf
  }

  const magnitudes = {};
  for (const doc of docs) {
    const tokens = docTexts[doc._id];
    let sum = 0;
    const tfLocal = {};
    for (const t of tokens) tfLocal[t] = (tfLocal[t] || 0) + 1;
    for (const [term, count] of Object.entries(tfLocal)) {
      const tfidf = (1 + Math.log(count)) * (idf[term] || 0);
      sum += tfidf * tfidf;
    }
    magnitudes[doc._id] = Math.sqrt(sum) || 1;
  }

  return { index, idf, magnitudes, docs };
}

function search(indexData, query, limit = 10) {
  const { index, idf, magnitudes, docs } = indexData;
  if (!query || !query.trim()) return { results: [], total: 0 };

  const qTokens = tokenize(query);
  if (!qTokens.length) return { results: [], total: 0 };

  const qTf = {};
  for (const t of qTokens) qTf[t] = (qTf[t] || 0) + 1;

  const scores = {};
  for (const [term, qCount] of Object.entries(qTf)) {
    const postings = index[term];
    if (!postings) continue;
    const qTfidf = (1 + Math.log(qCount)) * (idf[term] || 0);
    for (const { docId, tf } of postings) {
      const docTfidf = (1 + Math.log(tf)) * (idf[term] || 0);
      scores[docId] = (scores[docId] || 0) + qTfidf * docTfidf;
    }
  }

  const qMag = Math.sqrt(
    Object.entries(qTf).reduce((sum, [term, count]) => {
      const v = (1 + Math.log(count)) * (idf[term] || 0);
      return sum + v * v;
    }, 0)
  ) || 1;

  const ranked = [];
  for (const doc of docs) {
    const score = scores[doc._id];
    if (!score) continue;
    const normalized = score / (qMag * magnitudes[doc._id]);
    ranked.push({ ...doc, score: normalized });
  }

  ranked.sort((a, b) => b.score - a.score);
  const results = ranked.slice(0, limit);
  return { results, total: ranked.length };
}

function buildIndexFromStore() {
  const { listPosts } = require('../models/post');
  const posts = listPosts({ status: 'published' }, { limit: 10000 });
  return buildIndex(posts);
}

module.exports = {
  tokenize,
  buildIndex,
  search,
  buildIndexFromStore,
};