import { createCharacterCanvas } from "../game/pixelSpriteSheet";
import type { LeaderboardEntry } from "./api";

export type RankingSocialEntry = LeaderboardEntry & {
  hairHex: string;
};

export type ScoreCardData = {
  ranking: RankingSocialEntry[];
};

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))), "image/png");
  });
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export async function createScoreCard(data: ScoreCardData) {
  const leader = data.ranking[0];
  if (!leader) throw new Error("No hay ranking disponible para compartir.");

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la tarjeta social.");

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#b5ecc9";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#8fdbad";
  for (let y = 0; y < 1080; y += 44) {
    for (let x = (y / 44) % 2 === 0 ? 0 : 22; x < 1080; x += 44) ctx.fillRect(x, y, 4, 4);
  }

  ctx.fillStyle = "#fbf9f8";
  ctx.fillRect(42, 42, 996, 996);
  ctx.strokeStyle = "#1b1c1c";
  ctx.lineWidth = 16;
  ctx.strokeRect(42, 42, 996, 996);

  ctx.fillStyle = "#6c2f00";
  ctx.fillRect(72, 72, 936, 132);
  ctx.fillStyle = "#ffc29f";
  ctx.font = "900 68px 'Space Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("RANKING DE CACAS", 540, 157);
  ctx.fillStyle = "#fbf9f8";
  ctx.font = "700 22px 'Space Mono', monospace";
  ctx.fillText("CAGANOMETRO · PARTE OFICIAL DEL TRONO", 540, 188);

  ctx.fillStyle = "#ffdf59";
  ctx.fillRect(72, 224, 936, 278);
  ctx.strokeStyle = "#1b1c1c";
  ctx.lineWidth = 8;
  ctx.strokeRect(72, 224, 936, 278);

  ctx.fillStyle = "#6c2f00";
  ctx.font = "900 28px 'Space Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("#1 · QUIEN MAS CAGA", 406, 278);

  const avatar = createCharacterCanvas({
    hairHex: leader.hairHex,
    skinHex: leader.colorActual,
    height: 1.7
  });
  ctx.fillStyle = "#fbf9f8";
  ctx.fillRect(104, 252, 246, 222);
  ctx.strokeStyle = "#1b1c1c";
  ctx.lineWidth = 8;
  ctx.strokeRect(104, 252, 246, 222);
  ctx.drawImage(avatar, 115, 241, 224, 224);

  ctx.fillStyle = "#1b1c1c";
  ctx.font = "900 48px 'Space Mono', monospace";
  ctx.fillText(truncate(leader.nombre.toUpperCase(), 17), 406, 349);
  ctx.fillStyle = "#6c2f00";
  ctx.font = "700 26px 'Space Mono', monospace";
  ctx.fillText(`@${truncate(leader.nickname, 22)}`, 406, 390);
  ctx.fillStyle = "#1b1c1c";
  ctx.font = "900 32px 'Space Mono', monospace";
  ctx.fillText(`${leader.totalCacas} CACAS`, 406, 444);
  ctx.font = "700 24px 'Space Mono', monospace";
  ctx.fillText(`FUERZA ${leader.fuerza}`, 720, 444);

  ctx.fillStyle = "#1b1c1c";
  ctx.font = "900 27px 'Space Mono', monospace";
  ctx.fillText("TABLA GENERAL", 76, 546);
  ctx.font = "700 17px 'Space Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("CACAS  ·  FUERZA", 1000, 546);

  data.ranking.slice(0, 10).forEach((entry, index) => {
    const y = 568 + index * 43;
    ctx.fillStyle = index === 0 ? "#fff2a6" : index % 2 === 0 ? "#e8f3ef" : "#f4efea";
    ctx.fillRect(72, y, 936, 36);
    ctx.fillStyle = "#1b1c1c";
    ctx.textAlign = "left";
    ctx.font = "900 20px 'Space Mono', monospace";
    ctx.fillText(`#${entry.posicion}`, 88, y + 25);
    ctx.font = "700 20px 'Space Mono', monospace";
    ctx.fillText(truncate(entry.nombre.toUpperCase(), 20), 166, y + 25);
    ctx.fillStyle = "#6c2f00";
    ctx.font = "700 16px 'Space Mono', monospace";
    ctx.fillText(`@${truncate(entry.nickname, 16)}`, 526, y + 24);
    ctx.fillStyle = "#1b1c1c";
    ctx.textAlign = "right";
    ctx.font = "900 19px 'Space Mono', monospace";
    ctx.fillText(`${entry.totalCacas}  ·  ${entry.fuerza}`, 988, y + 25);
  });

  ctx.fillStyle = "#2f5c44";
  ctx.font = "700 18px 'Space Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("Las cifras cambian despues de cada gloriosa visita al bano.", 540, 1020);

  return canvasToBlob(canvas);
}

function scoreFileName(data: ScoreCardData) {
  const leader = data.ranking[0];
  const nickname = (leader?.nickname ?? "ranking").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `caganometro-ranking-${nickname}-${leader?.totalCacas ?? 0}.png`;
}

export function downloadScoreCardBlob(blob: Blob, data: ScoreCardData) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = scoreFileName(data);
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareScoreCardBlob(blob: Blob, data: ScoreCardData) {
  const leader = data.ranking[0];
  const file = new File([blob], scoreFileName(data), { type: "image/png" });
  const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  if (!navigator.share || !canShareFile) {
    downloadScoreCardBlob(blob, data);
    return "downloaded" as const;
  }

  try {
    await navigator.share({
      title: "Ranking de cacas de Caganometro",
      text: leader ? `${leader.nombre} lidera con ${leader.totalCacas} cacas.` : "Ranking de cacas de Caganometro.",
      files: [file]
    });
    return "shared" as const;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    throw error;
  }
}
