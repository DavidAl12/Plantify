import { serverTimestamp } from "firebase/firestore";

const TEST_DATE_OVERRIDE = "2026-04-12"; // Ej: "2026-05-25". Usa null para la fecha real.

export const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatLocalDate = (date = getAppNow()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAppNow = () => {
  if (!TEST_DATE_OVERRIDE) return new Date();

  const date = parseLocalDate(TEST_DATE_OVERRIDE);
  date.setHours(12, 0, 0, 0);
  return date;
};

export const getAppTodayString = () => formatLocalDate(getAppNow());

export const getFirestoreNow = () => {
  return TEST_DATE_OVERRIDE ? getAppNow() : serverTimestamp();
};

export const getDaysSince = (dateVal) => {
  if (!dateVal) return null;

  let dateObj;
  if (typeof dateVal === "string") {
    dateObj = parseLocalDate(dateVal);
  } else {
    dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  }

  const today = getAppNow();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  return diffDays >= 0 ? diffDays : 0;
};
