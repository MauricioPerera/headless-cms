function errorHandler(err, req, res, next) {
  console.error(err);

  // Errores de validacion del modelo
  if (err.message && err.message.startsWith('invalid')) {
    return res.status(400).json({ error: 'validation_error', message: err.message });
  }

  // Unique constraint
  if (err.message && err.message.includes('Unique constraint violated')) {
    return res.status(409).json({ error: 'duplicate', message: err.message });
  }

  // Hook error
  if (err.hookEvent) {
    return res.status(400).json({ error: 'hook_error', message: err.message, hook: err.hookEvent });
  }

  res.status(500).json({ error: 'internal', message: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
