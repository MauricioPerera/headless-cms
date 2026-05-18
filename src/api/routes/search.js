const express = require('express');
const router = express.Router();
const { getOrBuildIndex, search } = require('../../core/search');

router.get('/', (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    const idx = getOrBuildIndex();
    const result = search(idx, q, parseInt(limit, 10));
    res.json({ results: result.results, total: result.total, query: q || '' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;