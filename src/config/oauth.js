// src/config/oauth.js

/**
 * CONFIGURACIÓN DE OAUTH PARA GOOGLE Y MICROSOFT
 *
 * Reemplaza los siguientes valores con las credenciales de tu proyecto.
 * - Google: Consola de Google Cloud (https://console.cloud.google.com) o Firebase Console.
 * - Microsoft: Portal de Azure (https://portal.azure.com) -> Azure Active Directory / Entra ID -> Registro de aplicaciones.
 */
export const OAUTH_CONFIG = {
  google: {
    // ID de cliente Web (Necesario para Web y Expo Go)
    webClientId:
      "932186460404-rr42jai814crrtsnri5dksh6tkmuuo33.apps.googleusercontent.com",

    // IDs de cliente nativos (Necesarios para builds de desarrollo / producción de Android/iOS)
    androidClientId:
      "932186460404-qrsbihhkqlkjgjfcedbtqne131qrif9t.apps.googleusercontent.com",
    iosClientId: "932186460404-og2pgebqs39qgbdkdks08g46po360eo9.apps.googleusercontent.com",
  },
  microsoft: {
    // ID de aplicación (cliente) en Azure
    clientId: "089ab28c-8545-40d5-84b2-fafa63c5a2b2",

    // ID del inquilino (Tenant ID). Usa "common" para permitir cualquier cuenta personal/institucional,
    // o el ID de tu directorio específico.
    tenantId: "common",
  },
};
