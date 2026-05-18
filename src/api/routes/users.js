const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { findUserById, listUsers, countUsers, updateUser } = require('../../models/user');

router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user._id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

router.get('/', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const { role, q, limit = 20, skip = 0 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) filter.$or = [
      { username: { $regex: q } },
      { displayName: { $regex: q } },
      { email: { $regex: q } }
    ];
    const users = listUsers(filter, { limit: parseInt(limit), skip: parseInt(skip) });
    const total = countUsers(filter);
    res.json({
      users: users.map(u => { const { passwordHash, ...safe } = u; return safe; }),
      total, limit: parseInt(limit), skip: parseInt(skip)
    });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user._id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    await updateUser({ _id: req.params.id }, { $set: req.body });
    const user = findUserById(req.params.id);
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
});

module.exports = router;
