import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { auth } from "../config/firebase";
import { OAUTH_CONFIG } from "../config/oauth";

if (Platform.OS !== "web") {
  GoogleSignin.configure({
    webClientId: OAUTH_CONFIG.google.webClientId,
    scopes: ["profile", "email"],
  });
}

export function useSocialAuth() {
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);

    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        return;
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
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
      Alert.alert(
        "Error",
        "No se pudo iniciar sesion con Google: " + (error.message || "intentalo de nuevo")
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loginWithGoogle,
  };
}
