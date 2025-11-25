const {
  getAuthCodeUrl,
  acquireTokenByCode,
  acquireTokenByRefreshToken,
} = require('../config/entra.config');

/**
 *AUTHCONTROLLER
 *Maneja el flujo de autenticación OAuth2 con Microsoft Entra ID
 */

/**
 *Iniciar flujo de autenticación
 *Redirige a Microsoft para login
 */
const login = async (req, res) => {
  try {
    const authUrl = await getAuthCodeUrl();

    // Redirigir a Microsoft Entra ID
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      details: error.message,
    });
  }
};

/**
 *Callback de autenticación
 *Microsoft redirige aquí después del login exitoso
 */
const callback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        error: 'Missing authorization code',
        details: 'No se recibió código de autorización',
      });
    }

    // Intercambiar código por tokens
    const tokenResponse = await acquireTokenByCode(code);

    // Extraer información del usuario
    const userInfo = {
      oid: tokenResponse.account.homeAccountId,
      email: tokenResponse.account.username,
      name: tokenResponse.account.name,
      tenantId: tokenResponse.account.tenantId,
    };

    // En producción, guardar refresh token en Redis/DB de forma segura
    // Por ahora, retornar tokens (o redirigir a frontend con tokens)

    res.json({
      message: 'Autenticación exitosa',
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresOn: tokenResponse.expiresOn,
      user: userInfo,
    });
  } catch (error) {
    console.error('Error en callback:', error);
    res.status(500).json({
      error: 'Error al procesar autenticación',
      details: error.message,
    });
  }
};

/**
 * Renovar access token usando refresh token
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing refresh token',
        details: 'Se requiere refresh token',
      });
    }

    const tokenResponse = await acquireTokenByRefreshToken(refreshToken);

    res.json({
      message: 'Token renovado exitosamente',
      accessToken: tokenResponse.accessToken,
      expiresOn: tokenResponse.expiresOn,
    });
  } catch (error) {
    console.error('Error al renovar token:', error);
    res.status(401).json({
      error: 'Error al renovar token',
      details: error.message,
    });
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  try {
    // Construir URL de logout de Entra ID
    const logoutUrl = `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/oauth2/v2.0/logout`;

    res.json({
      message: 'Logout iniciado',
      logoutUrl,
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión',
      details: error.message,
    });
  }
};

/**
 * Verificar que el token es válido (usado por otros servicios)
 */
const verify = async (req, res) => {
  // Este endpoint usa el middleware validateEntraToken
  // Si llega aquí, el token es válido
  res.json({
    valid: true,
    message: 'Token válido',
    user: req.user,
  });
};

module.exports = {
  login,
  callback,
  refresh,
  logout,
  verify,
};
