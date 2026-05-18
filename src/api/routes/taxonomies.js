const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createTaxonomy, updateTaxonomy, findTaxonomyById, findTaxonomyBySlug,
  listTaxonomies, countTaxonomies, removeTaxonomyById
} = require('../../models/taxonomy');

router.get('/', async (req, res, next) => {
  try {
    const { type, q, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (q) filter.$or = [
      { name: { $regex: q } },
      { slug: { $regex: q } }
    ];
    const taxonomies = listTaxonomies(filter, { limit: parseInt(limit), skip: parseInt(skip) });
    const total = countTaxonomies(filter);
    res.json({ taxonomies, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (err) { next(err); }
});

router.get('/:idOrSlug', async (req, res, next) => {
  try {
    let taxonomy = findTaxonomyById(req.params.idOrSlug);
    if (!taxonomy) taxonomy = findTaxonomyBySlug(req.params.idOrSlug);
    if (!taxonomy) return res.status(404).json({ error: 'not_found' });
    res.json(taxonomy);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const taxonomy = await createTaxonomy(req.body);
    res.status(201).json(taxonomy);
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    await updateTaxonomy({ _id: req.params.id }, { $set: req.body });
    const taxonomy = findTaxonomyById(req.params.id);
    if (!taxonomy) return res.status(404).json({ error: 'not_found' });
    res.json(taxonomy);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    removeTaxonomyById(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
