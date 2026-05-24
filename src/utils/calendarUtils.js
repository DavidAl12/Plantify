const getLatestCompletedDate = (plantId, taskType, completedTasks, plantCreatedAt) => {
  const plantTasks = completedTasks.filter(
    (t) => t.plantId === plantId && t.type === taskType && t.completed
  );
  if (plantTasks.length === 0) {
    return plantCreatedAt;
  }
  plantTasks.sort((a, b) => {
    if (a.date === b.date) {
      const timeA = a.completedAt?.toDate ? a.completedAt.toDate().getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const timeB = b.completedAt?.toDate ? b.completedAt.toDate().getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
      return timeB - timeA;
    }
    return b.date.localeCompare(a.date);
  });
  return plantTasks[0].date;
};

export const generateFullSchedule = (plants, completedTasks) => {
  const schedule = {};

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  plants.forEach((plant) => {
    const taskTypes = [
      {
        key: "watering",
        frequency: plant.wateringFrequencyDays || 3,
        fallbackDate: plant.lastWatered || plant.createdAt || new Date(),
      },
      {
        key: "fertilizing",
        frequency: plant.carePlan?.fertilizing?.frequencyDays || 30,
        fallbackDate: plant.carePlan?.fertilizing?.lastDate || plant.createdAt || new Date(),
      },
      {
        key: "pruning",
        frequency: plant.carePlan?.pruning?.frequencyDays || 60,
        fallbackDate: plant.carePlan?.pruning?.lastDate || plant.createdAt || new Date(),
      },
      {
        key: "pest_control",
        frequency: plant.carePlan?.pest_control?.frequencyDays || 15,
        fallbackDate: plant.carePlan?.pest_control?.lastDate || plant.createdAt || new Date(),
      },
    ];

    taskTypes.forEach((task) => {
      if (!task.frequency) return;

      const latestDate = getLatestCompletedDate(plant.id, task.key, completedTasks, task.fallbackDate);

      let start;
      if (typeof latestDate === "string") {
        const [year, month, day] = latestDate.split("-").map(Number);
        start = new Date(year, month - 1, day);
      } else {
        start = latestDate.toDate ? latestDate.toDate() : new Date(latestDate);
      }

      let i = 1;

      while (true) {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i * task.frequency);

        if (nextDate > endDate) break;

        // 🔑 Generar dateStr en tiempo LOCAL para evitar desfases
        const year = nextDate.getFullYear();
        const month = String(nextDate.getMonth() + 1).padStart(2, "0");
        const day = String(nextDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        if (!schedule[dateStr]) schedule[dateStr] = [];

        const id = `${plant.id}_${task.key}_${dateStr}`;

        const isCompleted = completedTasks.some(
          (t) => t.plantId === plant.id && t.type === task.key && t.completed && t.date >= dateStr
        );

        schedule[dateStr].push({
          id,
          plantId: plant.id,
          name: plant.name,
          image: plant.imageUrl || plant.image || null,
          type: task.key,
          completed: isCompleted,
          date: dateStr,
        });

        i++;
      }
    });
  });

  // Mantener todas las tareas completadas visibles (solo si la planta existe en el jardín)
  const activePlantIds = new Set(plants.map((p) => p.id));
  completedTasks.forEach((task) => {
    if (!task.date || !task.plantId || !activePlantIds.has(task.plantId)) return;

    if (!schedule[task.date]) schedule[task.date] = [];

    const existingIndex = schedule[task.date].findIndex((t) => t.id === task.id);
    if (existingIndex >= 0) {
      schedule[task.date][existingIndex] = {
        ...schedule[task.date][existingIndex],
        completed: !!task.completed,
      };
    } else {
      schedule[task.date].push({
        id: task.id,
        plantId: task.plantId,
        name: task.name || task.plantName || "",
        image: task.image || null,
        type: task.type,
        completed: !!task.completed,
      });
    }
  });

  return schedule;
};
