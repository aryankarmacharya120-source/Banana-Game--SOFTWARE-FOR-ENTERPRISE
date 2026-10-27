export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}
