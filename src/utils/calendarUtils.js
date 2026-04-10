export const generateFullSchedule = (plants, completedTasks) => {
  const schedule = {};

  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  plants.forEach((plant) => {
    const taskTypes = [
      {
        key: "watering",
        frequency: plant.wateringFrequencyDays || 3,
        lastDate: plant.lastWatered || plant.createdAt,
      },
      {
        key: "fertilizing",
        frequency: plant.carePlan?.fertilizing?.frequencyDays || 30,
        lastDate: plant.carePlan?.fertilizing?.lastDate || plant.createdAt,
      },
      {
        key: "pruning",
        frequency: plant.carePlan?.pruning?.frequencyDays || 60,
        lastDate: plant.carePlan?.pruning?.lastDate || plant.createdAt,
      },
      {
        key: "pest_control",
        frequency: plant.carePlan?.pest_control?.frequencyDays || 15,
        lastDate: plant.carePlan?.pest_control?.lastDate || plant.createdAt,
      },
    ];

    taskTypes.forEach((task) => {
      if (!task.frequency || !task.lastDate) return;

      let current = task.lastDate.toDate
        ? task.lastDate.toDate()
        : new Date(task.lastDate);

      if (current < now) current = new Date(now);

      while (current <= endDate) {
        current = new Date(current.getTime() + task.frequency * 86400000);

        const dateStr = current.toISOString().split("T")[0];

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
      }
    });
  });

  return schedule;
};
