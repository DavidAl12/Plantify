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

      const start = task.baseDate.toDate
        ? task.baseDate.toDate()
        : new Date(task.baseDate);

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
