import tipsJson from "../../dataset_tips_plantas.json";

const CATEGORY_STYLES = {
  "Ubicación e Iluminación": { icon: "sunny", color: "#FF9800" },
  "Riego y Humedad": { icon: "water", color: "#2196F3" },
  "Sustrato y Macetas": { icon: "nutrition", color: "#4CAF50" },
  "Mantenimiento y Limpieza": { icon: "leaf", color: "#8BC34A" },
  "Identificación de Problemas": { icon: "warning", color: "#F44336" },
  "Fertilización y Nutrientes": { icon: "leaf-outline", color: "#795548" },
  "Plagas y Prevención": { icon: "bug", color: "#607D8B" },
  "Propagación y Crecimiento": { icon: "sync", color: "#00BCD4" },
  "Cuidados Estacionales": { icon: "calendar", color: "#FF5722" },
  default: { icon: "bulb", color: "#9C27B0" },
};

export const ALL_TIPS = tipsJson.map((item) => {
  const categoryStyle = CATEGORY_STYLES[item.Categoría] || CATEGORY_STYLES.default;
  return {
    id: item.ID,
    title: item.Título,
    text: item.Consejo,
    category: item.Categoría,
    icon: categoryStyle.icon,
    color: categoryStyle.color,
  };
});
