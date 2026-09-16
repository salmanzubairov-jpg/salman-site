export function headers({ hashes = [], reportOnly = false } = {}) {
  const policy = [
    "default-src 'none'",
    "script-src 'self' " + hashes.map((h) => `'sha256-${h}'`).join(' '),
    "script-src-attr 'none'", "style-src 'self'", "style-src-attr 'none'",
    "img-src 'self'", "font-src 'self'", "connect-src 'none'", "manifest-src 'self'",
    "base-uri 'none'", "object-src 'none'", "frame-ancestors 'none'", "frame-src 'none'",
    "form-action 'none'", "worker-src 'none'"
  ].join('; ');
  return {
    [reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy']: policy,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Strict-Transport-Security': 'max-age=31536000',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}
