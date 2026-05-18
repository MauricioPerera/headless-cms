const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createPost, updatePost, findPostById, findPostBySlug,
  listPosts, countPosts, removePostById
} = require('../../models/post');

// Escapa caracteres especiales de regex para evitar ReDoS
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res, next) => {
  try {
    const { status, authorId, taxonomyId, q, limit = 20, skip = 0, sort = 'createdAt:desc', withAuthor, withTaxonomies } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (authorId) filter.authorId = authorId;
    if (taxonomyId) filter.taxonomyIds = { $contains: taxonomyId };
    if (req.query.locale) filter.locale = req.query.locale;
    if (q) {
      const safe = escapeRegex(q);
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { content: { $regex: safe, $options: 'i' } }
      ];
    }
    const opts = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      sort,
      withAuthor: withAuthor === '1' || withAuthor === 'true',
      withTaxonomies: withTaxonomies === '1' || withTaxonomies === 'true'
    };
    const posts = listPosts(filter, opts);
    const total = countPosts(filter);
    res.json({ posts, total, limit: opts.limit, skip: opts.skip });
  } catch (err) { next(err); }
});

router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const { withAuthor, withTaxonomies } = req.query;
    const opts = {
      withAuthor: withAuthor === '1' || withAuthor === 'true',
      withTaxonomies: withTaxonomies === '1' || withTaxonomies === 'true'
    };
    let post = findPostById(idOrSlug, opts);
    if (!post) post = findPostBySlug(idOrSlug, opts);
    if (!post) return res.status(404).json({ error: 'not_found' });
    res.json(post);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const doc = { ...req.body, authorId: req.user._id };
    const post = await createPost(doc);
    res.status(201).json(post);
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'not_found' });
    if (post.authorId !== req.user._id && req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    await updatePost({ _id: req.params.id }, { $set: req.body });
    const updated = findPostById(req.params.id);
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'not_found' });
    if (post.authorId !== req.user._id && req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    removePostById(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
