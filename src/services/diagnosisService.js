/**
 * Servicio de diagnóstico de plantas basado en descripción de síntomas
 * Usa Google Gemini API para análisis inteligente de problemas de plantas
 */

const GEMINI_API_KEY = "AIzaSyBOZT5KVPpUXVIQGpVtbemrtBcA4lQsFNs";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Base de conocimientos sobre enfermedades comunes de plantas
 */
const PLANT_DISEASE_KNOWLEDGE = {
  "hojas amarillas": {
    name: "Deficiencia de Nitrógeno o Riego Excesivo",
    description:
      "Las hojas amarillas pueden indicar falta de nutrientes o exceso de agua en el suelo.",
    solution:
      "Revisa el drenaje de la maceta. Si el suelo está mojado, reduce el riego. Si es seco, fertiliza con abono rico en nitrógeno.",
    confidence: 85,
  },
  "manchas marrones": {
    name: "Hongos o Mancha Bacteriana",
    description:
      "Las manchas marrones suelen ser causadas por hongos que prosperan en ambientes húmedos.",
    solution:
      "Mejora la circulación de aire, reduce la humedad alrededor de la planta. Aplica un fungicida si es necesario.",
    confidence: 80,
  },
  "hojas pálidas": {
    name: "Falta de Luz",
    description: "Las hojas pálidas indican que la planta no recibe suficiente luz solar.",
    solution:
      "Traslada la planta a un lugar más luminoso, cerca de una ventana con luz indirecta.",
    confidence: 75,
  },
  "hojas se caen": {
    name: "Estrés por Cambios de Temperatura o Riego Inadecuado",
    description:
      "La caída prematura de hojas puede ser causada por cambios bruscos de temperatura, corrientes de aire o riego inconsistente.",
    solution:
      "Mantén la planta en un lugar sin corrientes de aire. Mantén el riego consistente (ni muy seco ni muy mojado).",
    confidence: 80,
  },
  plagas: {
    name: "Infestación de Plagas",
    description:
      "La presencia de insectos pequeños indica plagas como ácaros, cochinillas o pulgones.",
    solution:
      "Aísla la planta. Limpia las hojas con agua y jabón neutro. Si persiste, usa un insecticida específico.",
    confidence: 90,
  },
  "hojas enrolladas": {
    name: "Ácaros o Pulgones",
    description: "Las hojas enrolladas suelen indicar presencia de ácaros que succionan los nutrientes.",
    solution:
      "Aumenta la humedad alrededor de la planta. Rocía con agua cada mañana. Usa acaricida si es necesario.",
    confidence: 80,
  },
  "tallo blando": {
    name: "Pudrición de Raíz",
    description:
      "Un tallo suave o frágil indica que las raíces están podridas por exceso de agua.",
    solution:
      "Extrae la planta de la maceta, corta las raíces podridas con una navaja limpia. Replanta en tierra nueva y seca.",
    confidence: 88,
  },
  "crecimiento lento": {
    name: "Deficiencia de Nutrientes o Luz Insuficiente",
    description: "El crecimiento estancado indica problemas nutricionales o ambientales.",
    solution:
      "Fertiliza regularmente según la especie. Asegura que reciba luz adecuada. Comprueba el tamaño de la maceta.",
    confidence: 75,
  },
  "hojas pegajosas": {
    name: "Presencia de Cochinillas o Insectos Succionadores",
    description: "La sustancia pegajosa (melaza) es excretada por plagas que se alimentan de la planta.",
    solution:
      "Limpia con alcohol al 70% en un algodón. Aísla la planta y trata con insecticida si es grave.",
    confidence: 85,
  },
  "wilting o marchitez": {
    name: "Deshidratación",
    description: "La planta se ve marchita y flácida, sin turgencia en las hojas.",
    solution:
      "Riega abundantemente. Asegúrate de que el agua llegue a todas las raíces. Aumenta la humedad ambiental.",
    confidence: 90,
  },
};

/**
 * Intenta diagnosticar usando Gemini API (REST)
 */
const diagnoseWithGemini = async (description, plantName) => {
  const prompt = `Eres un experto en cuidado de plantas. Un usuario describe síntomas de su planta "${plantName}" de la siguiente manera:

"${description}"

Por favor, proporciona un diagnóstico en formato JSON con la siguiente estructura exacta:
{
  "diagnoses": [
    {
      "name": "Nombre del problema",
      "description": "Descripción detallada del problema",
      "solution": "Solución paso a paso",
      "confidence": 85
    }
  ]
}

Incluye máximo 3 diagnósticos posibles. Sé específico y práctico en las soluciones. Responde SOLO con JSON valido, sin explicaciones adicionales.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extrae JSON de la respuesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.diagnoses || [];
    }

    return [];
  } catch (error) {
    console.error("Error con Gemini API:", error.message);
    return null;
  }
};

/**
 * Diagnóstico local basado en patrones de palabras clave
 */
const diagnoseLocally = (description) => {
  const lowerDesc = description.toLowerCase();
  const foundDiagnoses = [];

  // Busca palabras clave en la descripción
  for (const [keyword, diagnosis] of Object.entries(PLANT_DISEASE_KNOWLEDGE)) {
    if (lowerDesc.includes(keyword)) {
      foundDiagnoses.push(diagnosis);
    }
  }

  // Si encontró diagnósticos por palabras clave, devuelve los 3 principales
  if (foundDiagnoses.length > 0) {
    return foundDiagnoses.slice(0, 3);
  }

  // Si no encontró nada, devuelve diagnósticos genéricos basados en longitud
  if (description.includes("seco") || description.includes("marchito")) {
    return [
      PLANT_DISEASE_KNOWLEDGE["wilting o marchitez"],
    ];
  }

  return [];
};

/**
 * Función principal de diagnóstico
 */
export const diagnoseFromDescription = async (description, plantName) => {
  if (!description || description.trim().length === 0) {
    throw new Error("La descripción no puede estar vacía");
  }

  // PASO 1: Diagnóstico local (siempre funciona)
  let diagnoses = diagnoseLocally(description);

  // PASO 2: Si hay diagnósticos locales y clave Gemini, intenta mejorar con IA
  if (diagnoses.length > 0 && GEMINI_API_KEY) {
    try {
      const geminiDiagnoses = await diagnoseWithGemini(description, plantName);
      if (geminiDiagnoses && geminiDiagnoses.length > 0) {
        console.log("✨ Diagnóstico mejorado con Gemini API");
        diagnoses = geminiDiagnoses;
      }
    } catch (error) {
      console.log("Usando diagnóstico local (Gemini no disponible)");
      // Mantiene el diagnóstico local
    }
  }

  if (!diagnoses || diagnoses.length === 0) {
    // Si aún no hay diagnósticos, proporciona consejos generales
    diagnoses = [
      {
        name: "Revisión General de Cuidados",
        description:
          "No se pudieron identificar problemas específicos con la información proporcionada.",
        solution:
          "Revisa los puntos básicos: 1) Luz adecuada para la especie 2) Riego consistente 3) Drenaje de la maceta 4) Temperatura estable 5) Humedad ambiental. Si los síntomas persisten, consulta con un especialista.",
        confidence: 60,
      },
    ];
  }

  return diagnoses;
};
