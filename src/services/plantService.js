import { getWikipediaSummary } from "./wikipediaService";

const PLANT_ID_KEY = "zIMciTaQoPoHdut1rzXW5lEGIWK8y30OyibI05e9Ltanb6HhRU";

/**
 * Extrae una frecuencia numérica (en días) de un bloque de texto.
 * Busca patrones como "cada 3 días", "una vez por semana", "mensualmente".
 */
const extractFrequency = (text, type = "watering") => {
  if (!text) return null;
  const t = text.toLowerCase();

  // 1. Patrones específicos de tiempo
  if (t.includes("diariamente") || t.includes("cada día") || t.includes("todos los días")) return 1;
  if (t.includes("dos veces por semana") || t.includes("cada 3 días")) return 3;
  if (t.includes("semanalmente") || t.includes("cada semana") || t.includes("una vez por semana")) return 7;
  if (t.includes("quincenalmente") || t.includes("cada 15 días") || t.includes("dos veces al mes")) return 15;
  if (t.includes("mensualmente") || t.includes("cada mes") || t.includes("una vez al mes")) return 30;
  if (t.includes("bimestralmente") || t.includes("cada dos meses")) return 60;
  if (t.includes("trimestralmente") || t.includes("cada tres meses")) return 90;
  if (t.includes("anualmente") || t.includes("cada año")) return 365;

  // 2. Búsqueda por números: "cada [X] días"
  const dayMatch = t.match(/cada\s+(\d+)\s+días/);
  if (dayMatch) return parseInt(dayMatch[1]);

  const weekMatch = t.match(/cada\s+(\d+)\s+semanas/);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;

  const monthMatch = t.match(/cada\s+(\d+)\s+meses/);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;

  // 3. Fallbacks basados en palabras clave descriptivas (si no hay números)
  if (type === "watering") {
    if (t.includes("frecuente") || t.includes("húmedo") || t.includes("humedad constante")) return 2;
    if (t.includes("moderado") || t.includes("regular") || t.includes("intermedio")) return 4;
    if (t.includes("poco") || t.includes("seco") || t.includes("esporádico") || t.includes("dejar secar")) return 8;
    if (t.includes("cactus") || t.includes("suculenta") || t.includes("desierto")) return 12;
  }

  if (type === "fertilizing") {
    if (t.includes("primavera") || t.includes("crecimiento")) return 15;
    if (t.includes("invierno") || t.includes("reposo")) return 60;
  }

  return null;
};

/**
 * Genera un plan de cuidado basado en Plant.id y Wikipedia.
 */
const generateCarePlanFromAPI = async (plant) => {
  const details = plant.details || {};
  const plantName = plant.name || "";
  
  // Fuentes de texto
  const wateringText = details.best_watering || "";
  const description = details.description?.value || "";
  const wikiSummary = await getWikipediaSummary(plantName) || "";
  
  const fullText = `${wateringText} ${description} ${wikiSummary}`.toLowerCase();

  // --- CÁLCULO DE RIEGO ---
  let watering = extractFrequency(wateringText, "watering") || 
                 extractFrequency(fullText, "watering");
  
  if (!watering) {
    // Perfiles botánicos por defecto si falla la extracción
    if (fullText.includes("cactus") || fullText.includes("suculenta") || fullText.includes("aloë")) {
      watering = 12;
    } else if (fullText.includes("helecho") || fullText.includes("tropical") || fullText.includes("selva")) {
      watering = 2;
    } else if (fullText.includes("interior") || fullText.includes("sombra")) {
      watering = 6;
    } else {
      watering = 4; // Valor medio estándar
    }
  }

  // --- CÁLCULO DE FERTILIZACIÓN ---
  let fertilizing = extractFrequency(fullText, "fertilizing") || 30;
  // Ajuste: las plantas con flores suelen necesitar más
  if (fullText.includes("flor") || fullText.includes("orquídea")) {
    fertilizing = Math.min(fertilizing, 15);
  }

  // --- CÁLCULO DE PODA ---
  let pruning = 60; // Base
  if (fullText.includes("árbol") || fullText.includes("arbusto") || fullText.includes("rápido crecimiento")) {
    pruning = 45;
  } else if (fullText.includes("lento crecimiento") || fullText.includes("cactus")) {
    pruning = 120;
  }

  return {
    watering: watering,
    fertilizing: fertilizing,
    pruning: pruning,
    pest_control: 21, // Un valor más estándar para preventivo
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

  // Procesar cada sugerencia con la nueva lógica asíncrona
  return await Promise.all(
    suggestions.map(async (plant) => ({
      ...plant,
      carePlan: await generateCarePlanFromAPI(plant),
    }))
  );
};

