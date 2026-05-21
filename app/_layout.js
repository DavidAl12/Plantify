import { Stack } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NotificationUtils from "../src/utils/notificationUtils";

export default function RootLayout() {
  useEffect(() => {
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

    checkUpdates();

    // Registrar para push (solicita permisos si hace falta)
    NotificationUtils.registerForPushNotificationsAsync();
    // Programar próximas notificaciones (se actualizará más tarde desde perfil o cuando sea necesario)
    NotificationUtils.scheduleNextNotifications().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
