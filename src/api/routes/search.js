const express = require('express');
const router = express.Router();
const { buildIndexFromStore, search } = require('../../core/search');

let indexData = null;
function getIndex() {
  if (!indexData) indexData = buildIndexFromStore();
  return indexData;
}

// Expose a way to invalidate the cache (e.g., after post mutations)
function invalidateSearchIndex() {
  indexData = null;
}

router.get('/', (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    const idx = getIndex();
    const result = search(idx, q, parseInt(limit, 10));
    res.json({ results: result.results, total: result.total, query: q || '' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.invalidateSearchIndex = invalidateSearchIndex;