// src/hooks/useSocialAuth.js
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { auth } from "../config/firebase";
import { OAUTH_CONFIG } from "../config/oauth";

// Requerido para cerrar la ventana del navegador web al finalizar la autenticación en apps nativas
WebBrowser.maybeCompleteAuthSession();

export function useSocialAuth() {
  const [loading, setLoading] = useState(false);

  // TEMPORAL: Para debug - ver el redirect URI que está usando tu app
  useEffect(() => {
    const getRedirectUri = async () => {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "perflora",
        preferredScheme: "https",
      });
      console.log("🔗 Redirect URI que tu app está usando:", redirectUri);
    };
    getRedirectUri();
  }, []);

  // 1. Google Auth Request
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: OAUTH_CONFIG.google.webClientId,
    androidClientId: OAUTH_CONFIG.google.androidClientId,
    iosClientId: OAUTH_CONFIG.google.iosClientId,
    scopes: ["profile", "email"],
    redirectUri: AuthSession.makeRedirectUri({
      scheme: "perflora",
    }),
  });

  // 2. Microsoft Auth Request
  const [, msResponse, promptMsAsync] = AuthSession.useAuthRequest(
    {
      clientId: OAUTH_CONFIG.microsoft.clientId,
      scopes: ["openid", "profile", "email", "User.Read"],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: "perflora",
      }),
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: {
        prompt: "select_account",
      },
    },
    {
      authorizationEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/token`,
    }
  );

  // Validadores de marcadores de posición (placeholders)
  const isGooglePlaceholder = OAUTH_CONFIG.google.webClientId.includes("YOUR_WEB_CLIENT_ID");
  const isMicrosoftPlaceholder = OAUTH_CONFIG.microsoft.clientId.includes("YOUR_MICROSOFT_CLIENT_ID");

  // Fallback de desarrollo para cuando no se han configurado los IDs de cliente reales
  const handlePlaceholderLogin = async (providerName) => {
    return new Promise((resolve) => {
      Alert.alert(
        "Configuración Requerida",
        `Las credenciales reales de ${providerName} no están configuradas en 'src/config/oauth.js'.\n\n¿Quieres usar el inicio de sesión de prueba para continuar en desarrollo?`,
        [
          {
            text: "Cancelar",
            onPress: () => resolve(false),
            style: "cancel",
          },
          {
            text: "Iniciar sesión de prueba",
            onPress: async () => {
              setLoading(true);
              const testEmail = `test_${providerName.toLowerCase()}@perflora.com`;
              const testPassword = "PerfloraTest123!";
              try {
                // Intentar iniciar sesión con la cuenta de prueba
                await signInWithEmailAndPassword(auth, testEmail, testPassword);
                resolve(true);
              } catch (error) {
                // Si el usuario no existe, lo creamos dinámicamente
                if (
                  error.code === "auth/user-not-found" || 
                  error.code === "auth/invalid-credential"
                ) {
                  try {
                    const credential = await createUserWithEmailAndPassword(
                      auth,
                      testEmail,
                      testPassword
                    );
                    await updateProfile(credential.user, {
                      displayName: `${providerName} Tester`,
                    });
                    resolve(true);
                  } catch (createError) {
                    console.error("Error al crear usuario de prueba:", createError);
                    Alert.alert(
                      "Error",
                      "No se pudo crear el usuario de prueba: " + createError.message
                    );
                    resolve(false);
                  }
                } else {
                  console.error("Error en login de prueba:", error);
                  Alert.alert(
                    "Error",
                    "No se pudo iniciar sesión de prueba: " + error.message
                  );
                  resolve(false);
                }
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    });
  };

  // 3. Efecto para escuchar la respuesta de Google (Nativo)
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { authentication } = googleResponse;
      const idToken = authentication?.idToken;
      if (idToken) {
        setLoading(true);
        const credential = GoogleAuthProvider.credential(idtoken);
        signInWithCredential(auth, credential)
          .catch((error) => {
            console.error("Error de Firebase con credencial de Google:", error);
            Alert.alert(
              "Error de Autenticación",
              "Hubo un error al iniciar sesión en Firebase con Google: " + error.message
            );
          })
          .finally(() => setLoading(false));
      }
    }
  }, [googleResponse]);

  // 4. Efecto para escuchar la respuesta de Microsoft (Nativo)
  useEffect(() => {
    if (msResponse?.type === "success") {
      const { id_token } = msResponse.params;
      if (id_token) {
        setLoading(true);
        const provider = new OAuthProvider("microsoft.com");
        const credential = provider.credential({
          idToken: id_token,
        });
        signInWithCredential(auth, credential)
          .catch((error) => {
            console.error("Error de Firebase con credencial de Microsoft:", error);
            Alert.alert(
              "Error de Autenticación",
              "Hubo un error al iniciar sesión en Firebase con Microsoft: " + error.message
            );
          })
          .finally(() => setLoading(false));
      }
    }
  }, [msResponse]);

  // 5. Función manejadora de inicio de sesión con Google
  const loginWithGoogle = async () => {
    if (Platform.OS === "web") {
      if (isGooglePlaceholder) {
        return handlePlaceholderLogin("Google");
      }
      setLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Google sign in error on Web:", error);
        Alert.alert("Error", "Error al iniciar sesión con Google en Web: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (isGooglePlaceholder) {
        return handlePlaceholderLogin("Google");
      }
      setLoading(true);
      try {
        const result = await googlePromptAsync();
        if (result?.type !== "success") {
          setLoading(false);
        }
      } catch (error) {
        console.error("Google prompt error:", error);
        Alert.alert("Error", "No se pudo iniciar la autenticación con Google.");
        setLoading(false);
      }
    }
  };

  // 6. Función manejadora de inicio de sesión con Microsoft
  const loginWithMicrosoft = async () => {
    if (Platform.OS === "web") {
      if (isMicrosoftPlaceholder) {
        return handlePlaceholderLogin("Microsoft");
      }
      setLoading(true);
      try {
        const provider = new OAuthProvider("microsoft.com");
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Microsoft sign in error on Web:", error);
        Alert.alert("Error", "Error al iniciar sesión con Microsoft en Web: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (isMicrosoftPlaceholder) {
        return handlePlaceholderLogin("Microsoft");
      }
      setLoading(true);
      try {
        const result = await promptMsAsync();
        if (result?.type !== "success") {
          setLoading(false);
        }
      } catch (error) {
        console.error("Microsoft prompt error:", error);
        Alert.alert("Error", "No se pudo iniciar la autenticación con Microsoft.");
        setLoading(false);
      }
    }
  };

  return {
    loading,
    loginWithGoogle,
    loginWithMicrosoft,
  };
}
