const PLANT_ID_KEY = "zIMciTaQoPoHdut1rzXW5lEGIWK8y30OyibI05e9Ltanb6HhRU";

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
    }
  );

  if (!response.ok) throw new Error(`Error de API: ${response.status}`);

  const data = await response.json();
  const suggestions = data?.result?.classification?.suggestions?.slice(0, 3) || [];

  if (suggestions.length === 0) throw new Error("NO_MATCH");

  return suggestions;
};