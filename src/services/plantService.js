const PLANT_ID_KEY = "zIMciTaQoPoHdut1rzXW5lEGIWK8y30OyibI05e9Ltanb6HhRU";

const generateCarePlanFromAPI = (plant) => {
  const wateringText = plant.details?.best_watering?.toLowerCase() || "";
  const light = plant.details?.best_light_condition?.toLowerCase() || "";

  let wateringFrequency = 3;

  if (wateringText.includes("frecuente")) wateringFrequency = 2;
  else if (wateringText.includes("moderado")) wateringFrequency = 4;
  else if (wateringText.includes("poco")) wateringFrequency = 7;

  let fertilizingFrequency = 30;
  if (light.includes("mucha luz")) fertilizingFrequency = 20;

  let pruningFrequency = 60;
  if (light.includes("pleno sol")) pruningFrequency = 30;

  let pestFrequency = 15;
  if (wateringFrequency <= 2) pestFrequency = 10;

  return {
    watering: wateringFrequency,
    fertilizing: fertilizingFrequency,
    pruning: pruningFrequency,
    pest_control: pestFrequency,
  };
};

export const identifyPlantFromBase64 = async (base64) => {
  const base64WithPrefix = `data:image/jpeg;base64,${base64}`;

  const response = await fetch(
    "https://plant.id/api/v3/identification?details=common_names,description,best_watering,best_light_condition,best_soil_type,toxicity,propagation_methods&language=es&nb_results=3",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_KEY,
      },
      body: JSON.stringify({ images: [base64WithPrefix] }),
    },
  );

  if (!response.ok) throw new Error(`Error de API: ${response.status}`);

  const data = await response.json();
  const suggestions =
    data?.result?.classification?.suggestions?.slice(0, 3) || [];

  if (suggestions.length === 0) throw new Error("NO_MATCH");

  return suggestions.map((plant) => ({
    ...plant,
    carePlan: generateCarePlanFromAPI(plant),
  }));
};
