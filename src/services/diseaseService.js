const PLANT_ID_KEY = "zIMciTaQoPoHdut1rzXW5lEGIWK8y30OyibI05e9Ltanb6HhRU";

export const diagnosePlantHealthFromBase64 = async (base64) => {
  if (!base64) throw new Error("No se proporcionó imagen para el diagnóstico");

  const base64WithPrefix = `data:image/jpeg;base64,${base64}`;
  const requestBody = JSON.stringify({
    images: [base64WithPrefix],
    modifiers: ["health_all"],
    language: "es",
    disease_details: ["common_names", "description", "treatment"],
  });

  const healthResponse = await fetch("https://plant.id/api/v3/health_assessment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PLANT_ID_KEY,
    },
    body: requestBody,
  });

  let data;

  if (healthResponse.ok) {
    data = await healthResponse.json();
  } else {
    const fallbackResponse = await fetch("https://plant.id/api/v3/disease", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_KEY,
      },
      body: requestBody,
    });

    if (!fallbackResponse.ok) {
      const errorText = await fallbackResponse.text().catch(() => "");
      throw new Error(`Error de API: ${fallbackResponse.status} ${errorText}`);
    }

    data = await fallbackResponse.json();
  }

  const diseases =
    data?.result?.health_assessment?.diseases || data?.result?.diseases || [];

  if (!Array.isArray(diseases) || diseases.length === 0) {
    throw new Error("NO_ISSUE");
  }

  return diseases.map((d) => ({
    name: d?.name || "Problema desconocido",
    commonNames: d?.common_names || [],
    probability: d?.probability || 0,
    description:
      d?.description ||
      d?.common_names?.join(", ") ||
      "No hay descripción disponible.",
    treatment:
      d?.treatment ||
      (Array.isArray(d?.suggestion) ? d.suggestion.join(", ") : ""),
  }));
};
