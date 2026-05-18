const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { createWebhook, listWebhooks, removeWebhookById } = require('../../models/webhook');

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const webhooks = listWebhooks();
    res.json({ webhooks, total: webhooks.length });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const wh = createWebhook(req.body);
    res.status(201).json(wh);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    removeWebhookById(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
