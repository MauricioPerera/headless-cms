const express = require('express');
const router = express.Router();
const { comparePassword, signToken } = require('../../core/auth');
const { findUserByUsername, findUserByEmail, createUser } = require('../../models/user');

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const user = await createUser({ username, email, password, displayName });
    const { passwordHash, ...safe } = user;
    res.status(201).json({ user: safe });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'missing_credentials' });
    }
    const user = await findUserByUsername(username) || await findUserByEmail(username);
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = signToken({ _id: user._id, username: user.username, role: user.role });
    const { passwordHash, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) { next(err); }
});

module.exports = router;
