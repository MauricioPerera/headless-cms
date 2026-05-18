/**
 * Rate limiter simple en memoria (sin dependencias externas).
 * En produccion con multiples instancias se deberia usar Redis o similar.
 */

class RateLimiter {
  constructor(opts = {}) {
    this.windowMs = opts.windowMs || 60 * 1000;       // 1 minuto
    this.maxRequests = opts.maxRequests || 100;          // 100 req/ventana
    this.blockDuration = opts.blockDuration || 5 * 60 * 1000; // 5 min bloqueo
    this._store = new Map(); // ip -> { count, resetTime, blockedUntil }
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      let record = this._store.get(ip);

      if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + this.windowMs, blockedUntil: 0 };
      }

      // Si esta bloqueado
      if (now < record.blockedUntil) {
        const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'rate_limited',
          message: `Demasiadas peticiones. Intenta de nuevo en ${retryAfter}s.`
        });
      }

      record.count++;

      // Si supera el limite, bloquear
      if (record.count > this.maxRequests) {
        record.blockedUntil = now + this.blockDuration;
        this._store.set(ip, record);
        const retryAfter = Math.ceil(this.blockDuration / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'rate_limited',
          message: `Demasiadas peticiones. Intenta de nuevo en ${retryAfter}s.`
        });
      }

      this._store.set(ip, record);
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - record.count));
      next();
    };
  }
}

// Limites diferentes por endpoint
const globalLimiter = new RateLimiter({ windowMs: 60 * 1000, maxRequests: 100 });
const authLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10, blockDuration: 30 * 60 * 1000 });

module.exports = { RateLimiter, globalLimiter, authLimiter };
