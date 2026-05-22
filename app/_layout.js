import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NotificationUtils from "../src/utils/notificationUtils";

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise((resolve) => setTimeout(resolve, 4500));
      } catch (error) {
        console.log("SplashScreen error:", error);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
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
    NotificationUtils.registerForPushNotificationsAsync();
    // Programar próximas notificaciones (se actualizará más tarde desde perfil o cuando sea necesario)
    NotificationUtils.scheduleNextNotifications().catch(() => {});
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
