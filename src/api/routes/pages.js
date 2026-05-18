const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createPage, updatePage, findPageById, findPageBySlug,
  listPages, countPages, removePageById
} = require('../../models/page');

router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 50, skip = 0, sort = 'createdAt:desc' } = req.query;
    const filter = {};
    if (q) filter.title = { $regex: q, $options: 'i' };
    const pages = listPages(filter, { limit, skip, sort });
    const total = countPages(filter);
    res.json({ pages, total, limit, skip });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = id.length === 24 ? findPageById(id) : findPageBySlug(id);
    if (!page) return res.status(404).json({ error: 'page not found' });
    res.json(page);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const inserted = await createPage(req.body);
    res.status(201).json(inserted);
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const result = await updatePage({ _id: req.params.id }, { $set: req.body });
    if (!result) return res.status(404).json({ error: 'page not found' });
    res.json({ updated: result });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = removePageById(req.params.id);
    if (!result) return res.status(404).json({ error: 'page not found' });
    res.json({ deleted: result });
  } catch (err) { next(err); }
});

module.exports = router;
