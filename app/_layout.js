import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerForPushNotificationsAsync, scheduleDailyTip } from "../src/utils/notificationUtils";

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
    scheduleDailyTip();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
