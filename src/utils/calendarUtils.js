export const generateFullSchedule = (plants, completedTasks) => {
  const schedule = {};

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  plants.forEach((plant) => {
    const taskTypes = [
      {
        key: "watering",
        frequency: plant.wateringFrequencyDays || 3,
        baseDate: plant.lastWatered || plant.createdAt,
      },
      {
        key: "fertilizing",
        frequency: plant.carePlan?.fertilizing?.frequencyDays || 30,
        baseDate: plant.carePlan?.fertilizing?.lastDate || plant.createdAt,
      },
      {
        key: "pruning",
        frequency: plant.carePlan?.pruning?.frequencyDays || 60,
        baseDate: plant.carePlan?.pruning?.lastDate || plant.createdAt,
      },
      {
        key: "pest_control",
        frequency: plant.carePlan?.pest_control?.frequencyDays || 15,
        baseDate: plant.carePlan?.pest_control?.lastDate || plant.createdAt,
      },
    ];

    taskTypes.forEach((task) => {
      if (!task.frequency || !task.baseDate) return;

      // 🔑 Fecha base FIJA (NO se modifica nunca)
      const start = task.baseDate.toDate
        ? task.baseDate.toDate()
        : new Date(task.baseDate);

      // 🔑 Generar fechas usando múltiplos (NO acumulativo)
      let i = 1;

      while (true) {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i * task.frequency);

        if (nextDate > endDate) break;

        const dateStr = nextDate.toISOString().split("T")[0];

        if (!schedule[dateStr]) schedule[dateStr] = [];

        const id = `${plant.id}_${task.key}_${dateStr}`;

        const isCompleted = completedTasks.some(
          (t) => t.id === id && t.completed,
        );

        schedule[dateStr].push({
          id,
          plantId: plant.id,
          name: plant.name,
          image: plant.imageUrl || plant.image || null,
          type: task.key,
          completed: isCompleted,
        });

        i++;
      }
    });
  });

  return schedule;
};
