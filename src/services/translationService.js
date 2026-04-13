// Cache en memoria
const cache = {};

// 🔹 Función principal de traducción
export const traducirTexto = async (texto) => {
  if (!texto) return "";

  // ✅ Evitar repetir traducciones
  if (cache[texto]) {
    return cache[texto];
  }

  // 🔹 1. Intentar con LibreTranslate
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: texto,
        source: "en",
        target: "es",
        format: "text",
      }),
    });

    const data = await res.json();

    if (data?.translatedText) {
      cache[texto] = data.translatedText;
      return data.translatedText;
    }
  } catch (error) {
    console.log("LibreTranslate falló:", error);
  }

  // 🔹 2. Fallback con Google Translate (no oficial)
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(
        texto
      )}`
    );

    const data = await res.json();

    const traducido = data?.[0]?.map((t) => t[0]).join("") || texto;

    cache[texto] = traducido;
    return traducido;
  } catch (error) {
    console.log("Google fallback falló:", error);
  }

  // 🔹 3. Si todo falla, devolver original
  return texto;
};

// 🔹 Traducción de detalles de planta
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