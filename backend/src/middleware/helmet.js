/**
 * 安全头部中间件
 * 使用 helmet 风格的安全配置
 */

const securityHeaders = (options = {}) => {
  return (req, res, next) => {
    // Content Security Policy
    if (options.contentSecurityPolicy !== false) {
      const cspPolicy = options.contentSecurityPolicy || {
        'default-src': ['\'self\''],
        'script-src': ['\'self\'', '\'unsafe-inline\'', 'https://cdnjs.cloudflare.com'],
        'style-src': ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        'font-src': ['\'self\'', 'https://fonts.gstatic.com'],
        'img-src': ['\'self\'', 'data:', 'https:'],
        'connect-src': ['\'self\''],
        'frame-ancestors': ['\'none\'']
      };

      const cspString = Object.entries(cspPolicy)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');

      res.setHeader('Content-Security-Policy', cspString);
    }

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict-Transport-Security (HTTPS only)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Cache Control for sensitive pages
    if (req.path.includes('/admin') || req.path.includes('/api')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  };
};

module.exports = { securityHeaders };