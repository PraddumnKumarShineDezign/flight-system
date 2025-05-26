const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configuration options
const rateLimiter = new RateLimiterMemory({
    points: 20,          // Max 20 requests
    duration: 10,        // Per 10 seconds
    blockDuration: 30,   // Block for 30 seconds if exceeded
  });

/**
 * Rate Limiter Middleware
 * Limits incoming requests based on IP address.
 */
  const rateLimiterMiddleware = (req, res, next) => {
    rateLimiter.consume(req.ip)
      .then(() => {
        // Request allowed
        next();
      })
      .catch((rateLimiterRes) => {
        // Request limit exceeded
        const retrySecs = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 1;
  
        console.warn(`Rate limit exceeded for IP: ${req.ip}. Retry after ${retrySecs}s`);
  
        res.set('Retry-After', retrySecs.toString());
        res.status(429).send({message: 'Too many requests. Please try again later.',retryAfter: retrySecs,
          remainingPoints: rateLimiterRes.remainingPoints
        });
      });
  };

module.exports = rateLimiterMiddleware;
