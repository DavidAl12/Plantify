import * as Notifications from "expo-notifications";

// Configuración básica (necesaria para que la app no explote si algo llama a Notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Placeholder para guardar notificaciones
 */
async function saveNotificationToFirestore(notifData) {
  // Función desactivada
  console.log("Notificación (desactivada):", notifData.title);
}

/**
 * Solicita permisos para notificaciones (desactivado)
 */
export async function registerForPushNotificationsAsync() {
  return null;
}

/**
 * Programa recordatorios para hoy (desactivado)
 */
export async function scheduleTaskReminders(schedule) {
  // Función desactivada
}

/**
 * Programa una notificación para el día anterior a una fertilización (desactivado)
 */
export async function scheduleAdvanceFertilizationReminders(allTasks) {
  // Función desactivada
}

/**
 * Programa un tip diario de cuidado (desactivado)
 */
export async function scheduleDailyTip() {
  // Función desactivada
}
