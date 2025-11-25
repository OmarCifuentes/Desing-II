const msal = require('@azure/msal-node');

/**
 * MICROSOFT ENTRA ID CONFIGURATION
 * Configuración de MSAL (Microsoft Authentication Library)
 */

if (
  !process.env.ENTRA_CLIENT_ID ||
  !process.env.ENTRA_TENANT_ID ||
  !process.env.ENTRA_CLIENT_SECRET
) {
  throw new Error(
    'Missing required EntraID environment variables: ENTRA_CLIENT_ID, ENTRA_TENANT_ID, ENTRA_CLIENT_SECRET'
  );
}

const msalConfig = {
  auth: {
    clientId: process.env.ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}`,
    clientSecret: process.env.ENTRA_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(_loglevel, message, _containsPii) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[MSAL]', message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Warning,
    },
  },
};

// Crear instancia de ConfidentialClient
const confidentialClient = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Configuración de OAuth2
 */
const oauthConfig = {
  redirectUri:
    process.env.ENTRA_REDIRECT_URI || 'http://localhost:8000/auth/callback',
  scopes: ['user.read'], // Permisos solicitados

  // Configuración de tokens
  tokenValidationParameters: {
    validateIssuer: true,
    validIssuers: [
      `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${process.env.ENTRA_TENANT_ID}/`,
    ],
    validateAudience: true,
    validAudiences: [
      process.env.ENTRA_CLIENT_ID,
      '00000003-0000-0000-c000-000000000000', // Microsoft Graph API
    ],
    validateLifetime: true,
    clockSkew: 300, // 5 minutos de tolerancia
  },
};

/**
 * Generar URL de autorización
 */
const getAuthCodeUrl = async () => {
  const authCodeUrlParameters = {
    scopes: oauthConfig.scopes,
    redirectUri: oauthConfig.redirectUri,
    prompt: 'select_account', // Forzar selección de cuenta
  };

  try {
    const authCodeUrl = await confidentialClient.getAuthCodeUrl(
      authCodeUrlParameters
    );
    return authCodeUrl;
  } catch (error) {
    console.error('Error generating authcode URL:', error);
    throw error;
  }
};

/**
 * Intercambiar código de autorización por tokens
 */
const acquireTokenByCode = async (code) => {
  const tokenRequest = {
    code,
    scopes: oauthConfig.scopes,
    redirectUri: oauthConfig.redirectUri,
  };

  try {
    const response = await confidentialClient.acquireTokenByCode(tokenRequest);
    return response;
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
};

/**
 * Refrescar access token
 */
const acquireTokenByRefreshToken = async (refreshToken) => {
  const tokenRequest = {
    refreshToken,
    scopes: oauthConfig.scopes,
  };

  try {
    const response =
      await confidentialClient.acquireTokenByRefreshToken(tokenRequest);
    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

module.exports = {
  confidentialClient,
  getAuthCodeUrl,
  acquireTokenByCode,
  acquireTokenByRefreshToken,
  oauthConfig,
};