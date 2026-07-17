import Phaser from "phaser";

export type CharacterAppearance = {
  hairHex: string;
  skinHex: string;
  height?: number;
  shirtHex?: string;
  pantsHex?: string;
};

export const CHARACTER_FRAME_WIDTH = 32;
export const CHARACTER_FRAME_HEIGHT = 32;
export const CHARACTER_FRAME_COUNT = 12;

const OUTLINE = "#1b1c1c";
const SHOE = "#4b2d20";

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function outlinedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  fill(ctx, x, y, width, height, OUTLINE);
  if (width > 2 && height > 2) {
    fill(ctx, x + 1, y + 1, width - 2, height - 2, color);
  }
}

type FramePose = {
  bob: number;
  leftLeg: number;
  rightLeg: number;
  leftArm: number;
  rightArm: number;
  seated: boolean;
  eyes: "open" | "blink" | "strain" | "wide";
};

const FRAME_POSES: readonly FramePose[] = [
  { bob: 0, leftLeg: 0, rightLeg: 0, leftArm: 0, rightArm: 0, seated: false, eyes: "open" },
  { bob: -1, leftLeg: 0, rightLeg: 0, leftArm: 0, rightArm: 0, seated: false, eyes: "open" },
  { bob: 0, leftLeg: 0, rightLeg: 0, leftArm: 0, rightArm: 0, seated: false, eyes: "blink" },
  { bob: -1, leftLeg: 0, rightLeg: 0, leftArm: 0, rightArm: 0, seated: false, eyes: "open" },
  { bob: 0, leftLeg: -2, rightLeg: 2, leftArm: 2, rightArm: -2, seated: false, eyes: "open" },
  { bob: -1, leftLeg: -1, rightLeg: 1, leftArm: 1, rightArm: -1, seated: false, eyes: "open" },
  { bob: 0, leftLeg: 2, rightLeg: -2, leftArm: -2, rightArm: 2, seated: false, eyes: "open" },
  { bob: -1, leftLeg: 1, rightLeg: -1, leftArm: -1, rightArm: 1, seated: false, eyes: "open" },
  { bob: 2, leftLeg: 0, rightLeg: 0, leftArm: 0, rightArm: 0, seated: true, eyes: "open" },
  { bob: 1, leftLeg: 1, rightLeg: -1, leftArm: -1, rightArm: 1, seated: true, eyes: "blink" },
  { bob: 3, leftLeg: 0, rightLeg: 0, leftArm: 1, rightArm: -1, seated: true, eyes: "strain" },
  { bob: -2, leftLeg: -1, rightLeg: 1, leftArm: -2, rightArm: 2, seated: false, eyes: "wide" }
] as const;

export function drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  appearance: CharacterAppearance,
  originX = 0,
  originY = 0
) {
  const pose = FRAME_POSES[frame] ?? FRAME_POSES[0];
  const shirt = appearance.shirtHex ?? "#8b4513";
  const pants = appearance.pantsHex ?? "#355f48";
  const heightOffset = (appearance.height ?? 1.7) > 1.9 ? -1 : (appearance.height ?? 1.7) < 1.5 ? 1 : 0;
  const headY = originY + 3 + pose.bob + heightOffset;
  const torsoY = originY + 12 + pose.bob;
  const hipY = originY + 21 + pose.bob;

  if (pose.seated) {
    // Perfil derecho para los frames de trabajo y baño. Phaser refleja el
    // sprite cuando el puesto mira a la izquierda.
    outlinedRect(ctx, originX + 11, headY, 10, 9, appearance.skinHex);
    fill(ctx, originX + 11, headY, 10, 3, appearance.hairHex);
    fill(ctx, originX + 11, headY + 2, 2, 5, appearance.hairHex);
    fill(ctx, originX + 20, headY + 5, 2, 2, appearance.skinHex);
    fill(ctx, originX + 18, headY + 4, 1, pose.eyes === "wide" ? 2 : 1, OUTLINE);
    fill(ctx, originX + 19, headY + 7, 2, 1, OUTLINE);

    outlinedRect(ctx, originX + 12, torsoY, 8, 10, shirt);
    outlinedRect(ctx, originX + 18, torsoY + 2, 3, 7, appearance.skinHex);
    outlinedRect(ctx, originX + 20 + pose.rightArm, torsoY + 7, 6, 3, appearance.skinHex);
    outlinedRect(ctx, originX + 11, hipY, 8, 5, pants);
    outlinedRect(ctx, originX + 16 + pose.leftLeg, hipY + 3, 8, 3, pants);
    outlinedRect(ctx, originX + 19, hipY + 6, 7, 2, SHOE);
    return;
  }

  outlinedRect(ctx, originX + 10, headY, 12, 9, appearance.skinHex);
  fill(ctx, originX + 10, headY, 12, 3, appearance.hairHex);
  fill(ctx, originX + 10, headY + 2, 2, 4, appearance.hairHex);
  fill(ctx, originX + 20, headY + 2, 2, 2, appearance.hairHex);

  if (pose.eyes === "blink" || pose.eyes === "strain") {
    fill(ctx, originX + 13, headY + 4, 2, 1, OUTLINE);
    fill(ctx, originX + 18, headY + 4, 2, 1, OUTLINE);
  } else {
    const eyeHeight = pose.eyes === "wide" ? 2 : 1;
    fill(ctx, originX + 14, headY + 4, 1, eyeHeight, OUTLINE);
    fill(ctx, originX + 18, headY + 4, 1, eyeHeight, OUTLINE);
  }
  fill(ctx, originX + 15, headY + 7, pose.eyes === "strain" ? 3 : 2, 1, OUTLINE);

  outlinedRect(ctx, originX + 11, torsoY, 10, 10, shirt);
  outlinedRect(ctx, originX + 8 + pose.leftArm, torsoY + 1, 3, 8, appearance.skinHex);
  outlinedRect(ctx, originX + 21 + pose.rightArm, torsoY + 1, 3, 8, appearance.skinHex);

  outlinedRect(ctx, originX + 11 + pose.leftLeg, hipY, 4, 8 - heightOffset, pants);
  outlinedRect(ctx, originX + 17 + pose.rightLeg, hipY, 4, 8 - heightOffset, pants);
  outlinedRect(ctx, originX + 10 + pose.leftLeg, originY + 29, 5, 2, SHOE);
  outlinedRect(ctx, originX + 17 + pose.rightLeg, originY + 29, 5, 2, SHOE);
}

export function createCharacterCanvas(appearance: CharacterAppearance, frame = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = CHARACTER_FRAME_WIDTH;
  canvas.height = CHARACTER_FRAME_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el canvas del avatar.");
  }
  ctx.imageSmoothingEnabled = false;
  drawCharacterFrame(ctx, frame, appearance);
  return canvas;
}

export function ensureCharacterSpriteSheet(scene: Phaser.Scene, key: string, appearance: CharacterAppearance) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const canvas = document.createElement("canvas");
  canvas.width = CHARACTER_FRAME_WIDTH * CHARACTER_FRAME_COUNT;
  canvas.height = CHARACTER_FRAME_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el sprite sheet del personaje.");
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let frame = 0; frame < CHARACTER_FRAME_COUNT; frame += 1) {
    drawCharacterFrame(ctx, frame, appearance, frame * CHARACTER_FRAME_WIDTH);
  }

  const texture = scene.textures.addCanvas(key, canvas);
  if (!texture) {
    throw new Error("No se pudo registrar el sprite sheet del personaje.");
  }
  for (let frame = 0; frame < CHARACTER_FRAME_COUNT; frame += 1) {
    texture.add(
      frame,
      0,
      frame * CHARACTER_FRAME_WIDTH,
      0,
      CHARACTER_FRAME_WIDTH,
      CHARACTER_FRAME_HEIGHT
    );
  }

  const animationKeys = {
    idle: `${key}-idle`,
    walk: `${key}-walk`,
    work: `${key}-work`,
    reaction: `${key}-reaction`
  };

  for (const animationKey of Object.values(animationKeys)) {
    if (scene.anims.exists(animationKey)) scene.anims.remove(animationKey);
  }

  scene.anims.create({
    key: animationKeys.idle,
    frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
    frameRate: 4,
    repeat: -1
  });
  scene.anims.create({
    key: animationKeys.walk,
    frames: scene.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
    frameRate: 8,
    repeat: -1
  });
  scene.anims.create({
    key: animationKeys.work,
    frames: scene.anims.generateFrameNumbers(key, { start: 8, end: 9 }),
    frameRate: 3,
    repeat: -1
  });
  scene.anims.create({
    key: animationKeys.reaction,
    frames: [{ key, frame: 11 }, { key, frame: 0 }],
    frameRate: 10,
    repeat: 0
  });

  return { textureKey: key, ...animationKeys };
}
