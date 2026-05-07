export const getWikipediaImage = async (plantName) => {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(plantName)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source || data?.originalimage?.source || null;
  } catch {
    return null;
  }
};

export const getWikipediaSummary = async (plantName) => {
  try {
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(plantName)}`
    );
    if (!res.ok) {
      // Fallback a inglés si no hay en español
      const resEn = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(plantName)}`
      );
      if (!resEn.ok) return null;
      const dataEn = await resEn.json();
      return dataEn.extract || null;
    }
    const data = await res.json();
    return data.extract || null;
  } catch {
    return null;
  }
};