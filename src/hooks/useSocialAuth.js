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
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { auth } from "../config/firebase";
import { OAUTH_CONFIG } from "../config/oauth";

WebBrowser.maybeCompleteAuthSession();

const googleRedirectUri = AuthSession.makeRedirectUri({
  native: "com.arley_col.Perflora:/oauthredirect",
});

export function useSocialAuth() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Google redirect URI:", googleRedirectUri);
  }, []);

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: OAUTH_CONFIG.google.webClientId,
    androidClientId: OAUTH_CONFIG.google.androidClientId,
    iosClientId: OAUTH_CONFIG.google.iosClientId,
    scopes: ["profile", "email"],
    redirectUri: googleRedirectUri,
  });

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

  const isGooglePlaceholder = OAUTH_CONFIG.google.webClientId.includes("YOUR_WEB_CLIENT_ID");
  const isMicrosoftPlaceholder = OAUTH_CONFIG.microsoft.clientId.includes("YOUR_MICROSOFT_CLIENT_ID");

  const handlePlaceholderLogin = async (providerName) => {
    return new Promise((resolve) => {
      Alert.alert(
        "Configuracion requerida",
        `Las credenciales reales de ${providerName} no estan configuradas en 'src/config/oauth.js'.\n\nQuieres usar el inicio de sesion de prueba para continuar en desarrollo?`,
        [
          {
            text: "Cancelar",
            onPress: () => resolve(false),
            style: "cancel",
          },
          {
            text: "Iniciar sesion de prueba",
            onPress: async () => {
              setLoading(true);
              const testEmail = `test_${providerName.toLowerCase()}@perflora.com`;
              const testPassword = "PerfloraTest123!";
              try {
                await signInWithEmailAndPassword(auth, testEmail, testPassword);
                resolve(true);
              } catch (error) {
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
                    "No se pudo iniciar sesion de prueba: " + error.message
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

  useEffect(() => {
    if (googleResponse?.type !== "success") {
      return;
    }

    const idToken = googleResponse.authentication?.idToken || googleResponse.params?.id_token;

    if (!idToken) {
      setLoading(false);
      Alert.alert("Error", "Google no devolvio un token valido para Firebase.");
      return;
    }

    setLoading(true);
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential)
      .catch((error) => {
        console.error("Error de Firebase con credencial de Google:", error);
        Alert.alert(
          "Error de autenticacion",
          "Hubo un error al iniciar sesion en Firebase con Google: " + error.message
        );
      })
      .finally(() => setLoading(false));
  }, [googleResponse]);

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
              "Error de autenticacion",
              "Hubo un error al iniciar sesion en Firebase con Microsoft: " + error.message
            );
          })
          .finally(() => setLoading(false));
      }
    }
  }, [msResponse]);

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
        Alert.alert("Error", "Error al iniciar sesion con Google en Web: " + error.message);
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
        Alert.alert("Error", "No se pudo iniciar la autenticacion con Google.");
        setLoading(false);
      }
    }
  };

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
        Alert.alert("Error", "Error al iniciar sesion con Microsoft en Web: " + error.message);
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
        Alert.alert("Error", "No se pudo iniciar la autenticacion con Microsoft.");
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
