import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "../src/config/firebase";
import { AlertProvider } from "../src/context/AlertContext";
import { formatLocalDate } from "../src/utils/dateUtils";
import * as NotificationUtils from "../src/utils/notificationUtils";

const SPLASH_DURATION_MS = 4500;

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, SPLASH_DURATION_MS));
      } catch (error) {
        console.log("SplashScreen error:", error);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    const checkUpdates = async () => {
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (error) {
          console.log("Expo Updates error:", error);
        }
      }
    };

    prepareApp();
    checkUpdates();

    // Registrar para push (solicita permisos si hace falta)
    NotificationUtils.registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          console.log("Push notifications enabled. Token:", token.substring(0, 20) + "...");
        } else {
          console.warn("Push notifications not available or permission denied");
        }
      })
      .catch((error) => console.log("Error registering for push notifications:", error));

    // Listener para usuario autenticado - programar notificaciones
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Usuario autenticado: programar notificaciones
        try {
          await NotificationUtils.scheduleNextNotifications();
          console.log("Notifications scheduled successfully");
        } catch (error) {
          console.error("Error scheduling notifications:", error);
        }
      } else {
        // Usuario desautenticado: cancelar notificaciones
        try {
          await NotificationUtils.cancelAllScheduledNotifications();
          console.log("Notifications cancelled (user logged out)");
        } catch (error) {
          console.error("Error cancelling notifications:", error);
        }
      }
    });

    // Listener para notificaciones recibidas - guardar en historial
    const notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const { title, body, data } = notification.content;
        // Solo guardar si no es periódica
        if (data?.type !== "periodic_summary") {
          const date = data?.date || formatLocalDate(new Date());
          await NotificationUtils.saveNotificationToHistory(title, body, date, data);
        }
      }
    );

    return () => {
      notificationListener.remove();
      unsubscribeAuth();
    };
  }, []);

  if (!appReady) {
    return (
      <ImageBackground
        source={require("../assets/images/splash.png")}
        style={styles.splash}
        resizeMode="cover"
      >
        <StatusBar style="dark" translucent backgroundColor="transparent" />
      </ImageBackground>
    );
  }

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AlertProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#F8F6EF",
  },
});

