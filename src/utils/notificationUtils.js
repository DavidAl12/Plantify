import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";
import { generateFullSchedule } from "../utils/calendarUtils";

// Configuración básica (necesaria para que la app no explote si algo llama a Notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_KEY = "notificationFrequencyHours"; // 'off' | null(default 5) | number

async function saveNotificationToFirestoreToken(token) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { expoPushToken: token }, { merge: true });
  } catch (e) {
    console.log("Error guardando token en Firestore:", e);
  }
}

export async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData?.data;
    if (token) await saveNotificationToFirestoreToken(token);

    // Android channels
    if (Platform.OS === "android") {
      // Canal principal para notificaciones de tareas
      await Notifications.setNotificationChannelAsync("tasks", {
        name: "Tareas de plantas",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#345d25",
      });

      // Canal para recordatorios periódicos
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Recordatorios",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
        lightColor: "#345d25",
      });
    }

    return token || null;
  } catch (e) {
    console.log("registerForPushNotificationsAsync error:", e);
    return null;
  }
}

export async function getSavedFrequency() {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === null) return null; // default 5
    if (v === "off") return "off";
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  } catch (e) {
    return null;
  }
}

export async function setSavedFrequency(value) {
  try {
    if (value === null) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch (e) {
    console.log("Error guardando frecuencia:", e);
  }
}

async function fetchUserPlantsAndCompletedTasks() {
  const user = auth.currentUser;
  if (!user) return { plants: [], completedTasks: [] };

  try {
    const plantsSnap = await getDocs(collection(db, "users", user.uid, "plants"));
    const plants = plantsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const tasksSnap = await getDocs(collection(db, "users", user.uid, "tasks"));
    const completedTasks = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return { plants, completedTasks };
  } catch (e) {
    console.log("Error fetching user data for notifications:", e);
    return { plants: [], completedTasks: [] };
  }
}

export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log("Error cancelling notifications:", e);
  }
}

function scheduleAtLocalTime(date, hour = 9, minute = 0) {
  const triggerDate = new Date(date);
  triggerDate.setHours(hour, minute, 0, 0);
  return { type: "date", date: triggerDate, channelId: "default" };
}

function isFutureTrigger(trigger) {
  return trigger?.date instanceof Date && trigger.date.getTime() > Date.now();
}

export async function scheduleNextNotifications(days = 7) {
  try {
    // cancel previous to avoid duplicates
    await cancelAllScheduledNotifications();

    const { plants, completedTasks } = await fetchUserPlantsAndCompletedTasks();
    const schedule = generateFullSchedule(plants, completedTasks || []);

    const now = new Date();

    // Schedule daily summaries and advance (tomorrow) summaries for next `days`
    for (let i = 0; i < days; i++) {
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateStr = target.toISOString().slice(0, 10);

      // Daily summary for target day (at 09:00 local)
      const todaysTasks = schedule[dateStr] || [];
      const dailyTrigger = scheduleAtLocalTime(target, 9, 0);
      if (todaysTasks.length > 0 && isFutureTrigger(dailyTrigger)) {
        const content = {
          title: "🌱 Tareas de hoy",
          body: `Tienes ${todaysTasks.length} ${todaysTasks.length === 1 ? "actividad" : "actividades"} pendiente${todaysTasks.length === 1 ? "" : "s"}.`,
          data: { type: "daily_summary", date: dateStr },
          badge: todaysTasks.length,
          sound: "default",
          android: {
            channelId: "tasks",
            color: "#345d25",
          },
        };
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: dailyTrigger,
        });
      }

      // Advance notification: for tasks in (target + 1), deliver at 19:00 on the current day
      const next = new Date(target.getFullYear(), target.getMonth(), target.getDate() + 1);
      const nextStr = next.toISOString().slice(0, 10);
      const tomorrowsTasks = schedule[nextStr] || [];
      const advanceTrigger = scheduleAtLocalTime(target, 19, 0);
      if (tomorrowsTasks.length > 0 && isFutureTrigger(advanceTrigger)) {
        const content = {
          title: "🌿 Actividades para mañana",
          body: `Tienes ${tomorrowsTasks.length} ${tomorrowsTasks.length === 1 ? "actividad" : "actividades"} programada${tomorrowsTasks.length === 1 ? "" : "s"}.`,
          data: { type: "advance_summary", date: nextStr },
          badge: 1,
          sound: "default",
          android: {
            channelId: "tasks",
            color: "#345d25",
          },
        };
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: advanceTrigger,
        });
      }
    }

    // Schedule periodic reminders based on saved frequency (default 5 hrs)
    const freq = await getSavedFrequency();
    if (freq === "off") return;
    const hours = freq === null ? 5 : Number(freq);
    if (Number.isFinite(hours) && hours > 0) {
      // schedule a repeating notification every `hours` starting now+hours
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Recordatorio de Perflora",
          body: "Revisa tus actividades de plantas.",
          data: { type: "periodic_summary" },
          badge: 1,
          sound: "default",
          android: {
            channelId: "reminders",
            color: "#345d25",
          },
        },
        trigger: { type: "timeInterval", seconds: hours * 3600, repeats: true },
      });
    }
  } catch (e) {
    console.log("Error scheduling notifications:", e);
  }
}

export async function sendTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌱 Perflora - Prueba",
        body: "Esta es una notificación de prueba de Perflora.",
        data: { type: "test_notification" },
        badge: 1,
        sound: "default",
        android: {
          channelId: "tasks",
          color: "#345d25",
        },
      },
      trigger: { type: "timeInterval", seconds: 1, repeats: false },
    });
  } catch (e) {
    console.log("Error sending test notification:", e);
  }
}

export async function sendPlantTaskTestNotification() {
  try {
    const { plants, completedTasks } = await fetchUserPlantsAndCompletedTasks();
    const schedule = generateFullSchedule(plants, completedTasks || []);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const todayTasks = schedule[todayStr] || [];
    const tomorrowTasks = schedule[tomorrowStr] || [];

    if (todayTasks.length > 0) {
      const content = {
        title: "🌱 Tareas de hoy",
        body: `Tienes ${todayTasks.length} ${todayTasks.length === 1 ? "actividad" : "actividades"} pendiente${todayTasks.length === 1 ? "" : "s"}.`,
        data: { type: "daily_summary_test", date: todayStr },
        badge: todayTasks.length,
        sound: "default",
        android: {
          channelId: "tasks",
          color: "#345d25",
        },
      };
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: "timeInterval", seconds: 5, repeats: false },
      });
    }

    if (tomorrowTasks.length > 0) {
      const content = {
        title: "🌿 Tareas para mañana",
        body: `Tienes ${tomorrowTasks.length} ${tomorrowTasks.length === 1 ? "actividad" : "actividades"} programada${tomorrowTasks.length === 1 ? "" : "s"}.`,
        data: { type: "advance_summary_test", date: tomorrowStr },
        badge: 1,
        sound: "default",
        android: {
          channelId: "tasks",
          color: "#345d25",
        },
      };
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: "timeInterval", seconds: 2, repeats: false },
      });
    }

    if (todayTasks.length === 0 && tomorrowTasks.length === 0) {
      const content = {
        title: "🌱 Perflora",
        body: "No hay tareas para hoy ni mañana. Añade una planta para crear recordatorios.",
        data: { type: "plant_task_test" },
        badge: 0,
        sound: "default",
        android: {
          channelId: "tasks",
          color: "#345d25",
        },
      };
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: "timeInterval", seconds: 1, repeats: false },
      });
    }

    return { today: todayTasks.length, tomorrow: tomorrowTasks.length };
  } catch (e) {
    console.log("Error sending plant task test notification:", e);
    throw e;
  }
}

// Historial de notificaciones
const NOTIFICATION_HISTORY_KEY = "notificationHistory";

export async function saveNotificationToHistory(title, body, date, data = {}) {
  try {
    const history = await getNotificationHistory();
    
    // Agregar nueva notificación
    const newNotif = {
      id: Date.now().toString(),
      title,
      body,
      date: date || new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
      data,
      viewed: false,
    };
    
    history.push(newNotif);
    
    // Guardar en AsyncStorage
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.log("Error guardando notificación al historial:", e);
  }
}

export async function getNotificationHistory() {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.log("Error leyendo historial de notificaciones:", e);
    return [];
  }
}

export async function markNotificationsAsViewed() {
  try {
    const history = await getNotificationHistory();
    const updatedHistory = history.map((notif) => ({
      ...notif,
      viewed: true,
    }));
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.log("Error marcando notificaciones como vistas:", e);
  }
}

export async function hasUnviewedNotifications() {
  try {
    const history = await getNotificationHistory();
    return history.some((notif) => !notif.viewed);
  } catch (e) {
    return false;
  }
}

export default {
  registerForPushNotificationsAsync,
  scheduleNextNotifications,
  cancelAllScheduledNotifications,
  getSavedFrequency,
  setSavedFrequency,
  sendTestNotification,
  sendPlantTaskTestNotification,
  saveNotificationToHistory,
  getNotificationHistory,
  markNotificationsAsViewed,
  hasUnviewedNotifications,
};
