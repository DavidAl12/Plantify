import { getDaysSince } from "./dateUtils";

export const ACTIVITY_STATUS = {
  green: "#4CAF50",
  yellow: "#FFC107",
  red: "#F44336",
  gray: "gray",
};

export const getLatestActivityDate = (plantId, type, completedTasks, fallbackDate) => {
  const plantTasks = completedTasks.filter(
    (task) => task.plantId === plantId && task.type === type && task.completed,
  );

  if (plantTasks.length === 0) return fallbackDate;

  plantTasks.sort((a, b) => {
    if (a.date === b.date) {
      const timeA = a.completedAt?.toDate
        ? a.completedAt.toDate().getTime()
        : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const timeB = b.completedAt?.toDate
        ? b.completedAt.toDate().getTime()
        : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
      return timeB - timeA;
    }

    return b.date.localeCompare(a.date);
  });

  return plantTasks[0].date;
};

export const getActivityStatus = (lastDate, frequency) => {
  if (!lastDate || !frequency) return ACTIVITY_STATUS.gray;

  const days = getDaysSince(lastDate);
  const warningThreshold = Math.floor(frequency * 0.75);

  if (days <= warningThreshold) return ACTIVITY_STATUS.green;
  if (days < frequency) return ACTIVITY_STATUS.yellow;
  return ACTIVITY_STATUS.red;
};

export const getPlantActivitySummary = (plant, completedTasks) => {
  const wateringDate = getLatestActivityDate(
    plant.id,
    "watering",
    completedTasks,
    plant.lastWatered || plant.createdAt,
  );
  const fertilizingDate = getLatestActivityDate(
    plant.id,
    "fertilizing",
    completedTasks,
    plant.carePlan?.fertilizing?.lastDate || plant.createdAt,
  );
  const pruningDate = getLatestActivityDate(
    plant.id,
    "pruning",
    completedTasks,
    plant.carePlan?.pruning?.lastDate || plant.createdAt,
  );
  const pestDate = getLatestActivityDate(
    plant.id,
    "pest_control",
    completedTasks,
    plant.carePlan?.pest_control?.lastDate || plant.createdAt,
  );

  return {
    watering: {
      days: getDaysSince(wateringDate),
      status: getActivityStatus(wateringDate, plant.wateringFrequencyDays),
    },
    fertilizing: {
      days: getDaysSince(fertilizingDate),
      status: getActivityStatus(fertilizingDate, plant.carePlan?.fertilizing?.frequencyDays),
    },
    pruning: {
      days: getDaysSince(pruningDate),
      status: getActivityStatus(pruningDate, plant.carePlan?.pruning?.frequencyDays),
    },
    pest_control: {
      days: getDaysSince(pestDate),
      status: getActivityStatus(pestDate, plant.carePlan?.pest_control?.frequencyDays),
    },
  };
};

export const getPlantStatus = (plant, completedTasks) => {
  const activities = getPlantActivitySummary(plant, completedTasks);
  const redActivities = Object.entries(activities).filter(
    ([, activity]) => activity.status === ACTIVITY_STATUS.red,
  );
  const yellowActivities = Object.values(activities).filter(
    (activity) => activity.status === ACTIVITY_STATUS.yellow,
  );

  const wateringIsRed = activities.watering.status === ACTIVITY_STATUS.red;
  const nonWateringCritical = ["fertilizing", "pruning", "pest_control"].some(
    (key) => activities[key].status === ACTIVITY_STATUS.red && activities[key].days > 20,
  );

  if (wateringIsRed || redActivities.length >= 3 || nonWateringCritical) {
    return { status: "Descuidada", color: "#ffebee", textColor: "#c62828" };
  }

  if (redActivities.length > 0 || yellowActivities.length > 0) {
    return { status: "Atención", color: "#fff3e0", textColor: "#f57c00" };
  }

  return { status: "Sana", color: "#e8f5e9", textColor: "#2e7d32" };
};
