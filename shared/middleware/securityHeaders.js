const helmet = require('helmet');

/**
 * SECURITY HEADERS MIDDLEWARE
 * Configura headers de seguridad HTTP usando Helmet
 */

const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  //Cross-OriginResourceSharing
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  //DNSPrefetchControl
  dnsPrefetchControl: { allow: false },

  //Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: true,
  },

  //FrameGuard
  frameguard: { action: 'deny' },

  //HidePoweredBy
  hidePoweredBy: true,

  //HTTPStrictTransportSecurity
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  //IENoOpen
  ieNoOpen: true,

  //NoSniff
  noSniff: true,

  //PermittedCross-DomainPolicies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  //ReferrerPolicy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  //XSSFilter
  xssFilter: true,
});

module.exports = securityHeaders;
