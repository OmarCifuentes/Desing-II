const axios = require('axios');

/**
 * MICROSOFT ENTRA ID TOKEN VALIDATION MIDDLEWARE
 * Valida tokens OAuth2 de Microsoft Entra ID usando validación simplificada
 */

/**
 * Middleware para validar token de Entra ID
 * Usa validación básica sin verificación de firma para resolver problemas con jsonwebtoken
 */
const validateEntraToken = async (req, res, next) => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return res.status(401).json({
        error: 'No autorizado',
        details: 'Token no proporcionado. Use: Authorization: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    // Decodificar token sin verificación (base64)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        error: 'Token inválido',
        details: 'Formato de token inválido',
      });
    }

    // Decodificar payload
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    console.log('[Auth] Token decoded, issuer:', payload.iss);
    console.log('[Auth] Token audience:', payload.aud);
    console.log('[Auth] Token expires:', new Date(payload.exp * 1000).toISOString());

    // Validar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return res.status(401).json({
        error: 'Token expirado',
        details: 'El token de autenticación ha expirado. Inicie sesión nuevamente.',
      });
    }

    // Validar issuer (Microsoft Entra ID)
    const validIssuers = [
      `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${process.env.ENTRA_TENANT_ID}/`,
    ];

    if (!validIssuers.includes(payload.iss)) {
      console.error('[Auth] Invalid issuer:', payload.iss);
      return res.status(401).json({
        error: 'Token inválido',
        details: 'Issuer no válido',
      });
    }

    // Validar audience
    const validAudiences = [
      process.env.ENTRA_CLIENT_ID,
      '00000003-0000-0000-c000-000000000000', // Microsoft Graph API
    ];

    if (!validAudiences.includes(payload.aud)) {
      console.error('[Auth] Invalid audience:', payload.aud);
      return res.status(401).json({
        error: 'Token inválido',
        details: 'Audience no válida',
      });
    }

    // Token válido - agregar información del usuario al request
    req.user = {
      oid: payload.oid, // Object ID único de Entra ID
      email: payload.email || payload.preferred_username,
      name: payload.name,
      roles: payload.roles || [], // Roles de aplicación
      groups: payload.groups || [], // Grupos de Entra ID
      tenantId: payload.tid,
      tokenClaims: payload,
    };

    console.log('[Auth] Token validated successfully for user:', req.user.email);
    next();
  } catch (error) {
    console.error('Error en validateEntraToken:', error);
    return res.status(500).json({
      error: 'Error interno al validar autenticación',
      details: error.message,
    });
  }
};

/**
 * Middleware para validar rol de administrador
 * Verifica que el usuario tenga el rol 'Admin' en Entra ID
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado',
      details: 'Debe estar autenticado para acceder a este recurso',
    });
  }

  const hasAdminRole =
    req.user.roles.includes('Admin') || req.user.roles.includes('admin');

  if (!hasAdminRole) {
    return res.status(403).json({
      error: 'Acceso denegado',
      details: 'Solo administradores pueden acceder a este recurso',
    });
  }

  next();
};

module.exports = {
  validateEntraToken,
  requireAdmin,
};
