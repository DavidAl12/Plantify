import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { auth } from "../config/firebase";
import { OAUTH_CONFIG } from "../config/oauth";

WebBrowser.maybeCompleteAuthSession();

const microsoftDiscovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/token`,
};

let googleSigninModule;

async function getGoogleSignin() {
  if (Platform.OS === "web") {
    return null;
  }

  if (!googleSigninModule) {
    const module = await import("@react-native-google-signin/google-signin");
    googleSigninModule = module.GoogleSignin;
    googleSigninModule.configure({
      webClientId: OAUTH_CONFIG.google.webClientId,
      scopes: ["profile", "email"],
    });
  }

  return googleSigninModule;
}

export function useSocialAuth() {
  const [loading, setLoading] = useState(false);
  const microsoftRedirectUri = AuthSession.makeRedirectUri({
    scheme: "perflora",
    isTripleSlashed: true,
  });
  const microsoftNonce = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    []
  );

  const [, microsoftResponse, promptMicrosoftAsync] = AuthSession.useAuthRequest(
    {
      clientId: OAUTH_CONFIG.microsoft.clientId,
      scopes: ["openid", "profile", "email", "User.Read"],
      redirectUri: microsoftRedirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: {
        nonce: microsoftNonce,
        prompt: "select_account",
        response_mode: "fragment",
      },
    },
    microsoftDiscovery
  );

  useEffect(() => {
    console.log("Microsoft redirect URI:", microsoftRedirectUri);
  }, [microsoftRedirectUri]);

  useEffect(() => {
    if (microsoftResponse?.type !== "success") {
      return;
    }

    const idToken = microsoftResponse.params?.id_token;
    if (!idToken) {
      setLoading(false);
      Alert.alert("Error", "Microsoft no devolvio un token valido para Firebase.");
      return;
    }

    setLoading(true);
    const provider = new OAuthProvider("microsoft.com");
    const credential = provider.credential({ idToken, rawNonce: microsoftNonce });

    signInWithCredential(auth, credential)
      .catch((error) => {
        console.error("Microsoft sign in credential error:", error);
        Alert.alert(
          "Error",
          "No se pudo iniciar sesion con Microsoft: " + (error.message || "intentalo de nuevo")
        );
      })
      .finally(() => setLoading(false));
  }, [microsoftNonce, microsoftResponse]);

  const loginWithGoogle = async () => {
    setLoading(true);

    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        return;
      }

      const GoogleSignin = await getGoogleSignin();

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const result = await GoogleSignin.signIn();

      if (result.type !== "success") {
        return;
      }

      const { idToken } = result.data;
      if (!idToken) {
        throw new Error("Google no devolvio un idToken para Firebase.");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error("Google sign in error:", error);
      const message =
        error.message?.includes("RNGoogleSignin")
          ? "Google Sign-In requiere un build nativo o dev client. En Expo Go usa correo y contrasena por ahora."
          : "No se pudo iniciar sesion con Google: " + (error.message || "intentalo de nuevo");

      Alert.alert(
        "Error",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    setLoading(true);

    try {
      if (Platform.OS === "web") {
        const provider = new OAuthProvider("microsoft.com");
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        return;
      }

      const result = await promptMicrosoftAsync();
      if (result?.type !== "success") {
        setLoading(false);
      }
    } catch (error) {
      console.error("Microsoft sign in error:", error);
      Alert.alert(
        "Error",
        "No se pudo iniciar sesion con Microsoft: " + (error.message || "intentalo de nuevo")
      );
      setLoading(false);
    }
  };

  return {
    loading,
    loginWithGoogle,
    loginWithMicrosoft,
  };
}
