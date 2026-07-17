// @ts-nocheck

const MINUTES_BETWEEN_POOPS = 0;
const DARKEN_STEP = 28;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;

  const numeric = Number.parseInt(expanded, 16);

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((part) => clamp(part, 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

export function evolveSkinColor(currentColor: string) {
  const { r, g, b } = hexToRgb(currentColor);
  const isAlmostBlack = r < 26 && g < 26 && b < 26;

  if (isAlmostBlack) {
    return "#f7f3ea";
  }

  return rgbToHex(r - DARKEN_STEP, g - DARKEN_STEP, b - DARKEN_STEP);
}

export function skinColorAtPoopCount(baseColor: string, totalPoops: number) {
  let color = baseColor;
  for (let index = 0; index < totalPoops; index += 1) color = evolveSkinColor(color);
  return color;
}

export function assertPoopCooldown(usuario: { ultimaCaca: string | Date | null }) {
  if (!usuario.ultimaCaca) {
    return;
  }

  const lastPoopAt = usuario.ultimaCaca instanceof Date ? usuario.ultimaCaca : new Date(usuario.ultimaCaca);
  const elapsedMinutes = (Date.now() - lastPoopAt.getTime()) / 1000 / 60;

  if (elapsedMinutes < MINUTES_BETWEEN_POOPS) {
    throw new Error("Todavia no puedes volver al bano.");
  }
}

export function computeEvolution(usuario: {
  totalCacas: number;
  tamano: number;
  fuerza: number;
  colorActual: string;
}) {
  const nextTotalCacas = usuario.totalCacas + 1;

  return {
    totalCacas: nextTotalCacas,
    tamano: Number((usuario.tamano + 0.12).toFixed(2)),
    fuerza: usuario.fuerza + 2,
    colorActual: evolveSkinColor(usuario.colorActual)
  };
}

export function medalForPosition(position: number) {
  if (position === 1) return "oro";
  if (position === 2) return "plata";
  if (position === 3) return "bronce";
  return null;
}
