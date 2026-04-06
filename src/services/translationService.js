export const traducirTexto = async (texto) => {
  if (!texto) return "";
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`
    );
    const data = await res.json();
    return data?.responseData?.translatedText || texto;
  } catch {
    return texto;
  }
};

export const traducirDetalles = async (details) => {
  if (!details) return details;

  const [watering, light, soil, toxicity] = await Promise.all([
    traducirTexto(details.best_watering || ""),
    traducirTexto(details.best_light_condition || ""),
    traducirTexto(details.best_soil_type || ""),
    traducirTexto(details.toxicity || ""),
  ]);

  return {
    ...details,
    best_watering: watering,
    best_light_condition: light,
    best_soil_type: soil,
    toxicity,
  };
};