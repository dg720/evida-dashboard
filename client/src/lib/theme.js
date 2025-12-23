export function deriveTheme(stressIndex) {
  if (stressIndex === null || stressIndex === undefined) {
    return {
      accent: "#f97316",
      accentSoft: "rgba(249, 115, 22, 0.12)",
      accentDeep: "#b45309",
    };
  }

  if (stressIndex < 40) {
    return {
      accent: "#14b8a6",
      accentSoft: "rgba(20, 184, 166, 0.15)",
      accentDeep: "#0f766e",
    };
  }

  if (stressIndex < 65) {
    return {
      accent: "#f59e0b",
      accentSoft: "rgba(245, 158, 11, 0.16)",
      accentDeep: "#b45309",
    };
  }

  return {
    accent: "#ef4444",
    accentSoft: "rgba(239, 68, 68, 0.16)",
    accentDeep: "#b91c1c",
  };
}
