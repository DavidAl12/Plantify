import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";

// Configuración de cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Nuevo en SDK 53/54
    shouldShowList: true,   // Nuevo en SDK 53/54
  }),
});

/**
 * Guarda un registro de la notificación en Firestore para mostrar en la interfaz
 */
async function saveNotificationToFirestore(notifData) {
  const user = auth.currentUser;
  if (!user) return;

  const notifId = notifData.id || Math.random().toString(36).substring(7);
  const ref = doc(db, "users", user.uid, "notifications", notifId);

  await setDoc(ref, {
    ...notifData,
    createdAt: serverTimestamp(),
    read: false,
  });
}

/**
 * Solicita permisos para notificaciones
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}

/**
 * Programa recordatorios para hoy (recurrentes) y para los próximos 7 días (anticipados)
 * @param {Object} schedule - El objeto schedule completo generado por calendarUtils
 */
export async function scheduleTaskReminders(schedule) {
  // 1. Limpiar todo lo previo para evitar duplicados
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // --- 📅 PROCESAR HOY (Recordatorios intensivos) ---
  const todayTasks = schedule[todayStr] || [];
  const pendingToday = todayTasks.filter((t) => !t.completed);

  if (pendingToday.length > 0) {
    const title = "🌱 Tareas pendientes en Perflora";
    const body = `Tienes ${pendingToday.length} tareas para hoy. ¡Tus plantas te necesitan!`;

    // Notificación inmediata
    await Notifications.scheduleNotificationAsync({
      content: { 
        title, 
        body, 
        data: { screen: "calendar" },
        channelId: "default" // 🔑 Requerido en Android
      },
      trigger: null,
    });

    // Recordatorio recurrente cada 2 horas
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ No olvides a tus plantas",
        body: "Aún tienes tareas pendientes por realizar hoy. Revisa tu jardín.",
        channelId: "default"
      },
      trigger: {
        seconds: 7200, // Trigger de intervalo (sin 'type' para evitar error)
        repeats: true,
      },
    });

    // Guardar en Firestore para la UI
    await saveNotificationToFirestore({
      id: `daily_${todayStr}`,
      title,
      body,
      type: "task",
      icon: "water",
      urgent: true
    });
  }

  // --- 📅 PROCESAR PRÓXIMOS 7 DÍAS (Recordatorios preventivos) ---
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + i);
    const futureStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;

    const futureTasks = schedule[futureStr] || [];
    const pendingFuture = futureTasks.filter((t) => !t.completed);

    if (pendingFuture.length > 0) {
      // Programar para las 9:00 AM de ese día futuro
      const triggerDate = new Date(futureDate);
      triggerDate.setHours(9, 0, 0, 0);

      const title = "📅 Tareas para mañana";
      const body = i === 1 
        ? `Mañana tienes ${pendingFuture.length} tareas programadas para tu jardín.`
        : `Tienes cuidados programados para el ${futureStr}.`;

      await Notifications.scheduleNotificationAsync({
        content: { 
          title: i === 1 ? title : `🌱 Tareas el ${futureStr}`, 
          body: body,
          channelId: "default"
        },
        trigger: triggerDate, // Date object es válido como trigger único
      });
    }
  }
}


/**
 * Programa una notificación para el día anterior a una fertilización
 */
export async function scheduleAdvanceFertilizationReminders(allTasks) {
  const fertilizationTasks = allTasks.filter(
    (t) => t.type === "fertilizing" && !t.completed
  );

  for (const task of fertilizationTasks) {
    const taskDate = new Date(task.date);
    const notificationDate = new Date(taskDate);
    notificationDate.setDate(taskDate.getDate() - 1);
    notificationDate.setHours(10, 0, 0);

    if (notificationDate > new Date()) {
      const title = "🛒 Preparación para fertilización";
      const body = `Mañana toca fertilizar a ${task.name}. Asegúrate de tener el fertilizante listo.`;

      await Notifications.scheduleNotificationAsync({
        content: { 
          title, 
          body,
          channelId: "default"
        },
        trigger: notificationDate, // Date object is valid for single triggers
      });

      await saveNotificationToFirestore({
        id: `fert_${task.id}`,
        title,
        body,
        type: "fertilizing",
        icon: "flask",
        urgent: false
      });
    }
  }
}

/**
 * Programa un tip diario de cuidado
 */
export async function scheduleDailyTip() {
  const tips = [
    "Recuerda limpiar el polvo de las hojas para que respiren mejor.",
    "El agua reposada es mejor para tus plantas que la del grifo directa.",
    "Gira tus plantas cada semana para que crezcan derechas buscando la luz.",
    "Si las puntas de las hojas están marrones, puede faltarles humedad ambiental.",
    "Fertiliza solo en las épocas de crecimiento (primavera/verano).",
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💡 Tip del día de Perflora",
      body: randomTip,
      channelId: "default"
    },
    trigger: {
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });

  await saveNotificationToFirestore({
    id: `tip_${new Date().toISOString().split('T')[0]}`,
    title: "💡 Tip del día de Perflora",
    body: randomTip,
    type: "tip",
    icon: "bulb",
    urgent: false
  });
}
