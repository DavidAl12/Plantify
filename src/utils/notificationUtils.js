import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";
import { generateFullSchedule } from "../utils/calendarUtils";

// Configuración básica (necesaria para que la app no explote si algo llama a Notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
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

    // Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
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
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Recordatorio de actividades",
            body: `Hoy tienes ${todaysTasks.length} actividades.`,
            data: { type: "daily_summary", date: dateStr },
          },
          trigger: dailyTrigger,
        });
      }

      // Advance notification: for tasks in (target + 1), deliver at 19:00 on the current day
      const next = new Date(target.getFullYear(), target.getMonth(), target.getDate() + 1);
      const nextStr = next.toISOString().slice(0, 10);
      const tomorrowsTasks = schedule[nextStr] || [];
      const advanceTrigger = scheduleAtLocalTime(target, 19, 0);
      if (tomorrowsTasks.length > 0 && isFutureTrigger(advanceTrigger)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Actividades para mañana",
            body: `Mañana tienes ${tomorrowsTasks.length} actividades.`,
            data: { type: "advance_summary", date: nextStr },
          },
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
          title: "Recordatorio",
          body: "Revisa tus actividades en Perflora.",
          data: { type: "periodic_summary" },
        },
        trigger: { type: "timeInterval", seconds: hours * 3600, repeats: true, channelId: "default" },
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
        title: "Notificación de prueba",
        body: "Esta es una notificación de prueba de Plantify.",
        data: { type: "test_notification" },
      },
      trigger: { type: "timeInterval", seconds: 1, repeats: false, channelId: "default" },
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recordatorio de planta - hoy",
          body: `Hoy tienes ${todayTasks.length} actividades de plantas.`,
          data: { type: "daily_summary_test", date: todayStr },
        },
        trigger: { type: "timeInterval", seconds: 5, repeats: false, channelId: "default" },
      });
    }

    if (tomorrowTasks.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recordatorio de planta - mañana",
          body: `Mañana tienes ${tomorrowTasks.length} actividades de plantas.`,
          data: { type: "advance_summary_test", date: tomorrowStr },
        },
        trigger: { type: "timeInterval", seconds: 7, repeats: false, channelId: "default" },
      });
    }

    if (todayTasks.length === 0 && tomorrowTasks.length === 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Plantify: prueba de alertas",
          body: "No hay tareas de plantas para hoy ni mañana. Añade una planta para crear recordatorios.",
          data: { type: "plant_task_test" },
        },
        trigger: { type: "timeInterval", seconds: 5, repeats: false, channelId: "default" },
      });
    }

    return { today: todayTasks.length, tomorrow: tomorrowTasks.length };
  } catch (e) {
    console.log("Error sending plant task test notification:", e);
    throw e;
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
};
