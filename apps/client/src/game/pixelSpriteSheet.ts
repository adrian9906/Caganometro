// @ts-nocheck
import Phaser from "phaser";

type SpriteOptions = {
  hairHex: string;
  skinHex: string;
};

const FRAME_WIDTH = 24;
const FRAME_HEIGHT = 28;
const FRAME_COUNT = 8;

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

function drawHumanFrame(ctx: CanvasRenderingContext2D, frame: number, options: SpriteOptions) {
  const ox = frame * FRAME_WIDTH;
  const outlineColor = "#2f2f2f";
  const shirt = "#8b4513";
  const pants = "#355f48";
  const shoe = "#5e2a0a";

  const walkFrames = [
    { legL: -2, legR: 2, armL: 2, armR: -2, bodyBob: 0, lean: 0 },
    { legL: -1, legR: 1, armL: 1, armR: -1, bodyBob: -1, lean: 0 },
    { legL: 2, legR: -2, armL: -2, armR: 2, bodyBob: 0, lean: 0 },
    { legL: 1, legR: -1, armL: -1, armR: 1, bodyBob: -1, lean: 0 }
  ];

  const sitFrames = [
    { bodyBob: 2, seat: true, headDrop: 1, legL: 0, legR: 0, armL: 0, armR: 0 },
    { bodyBob: 3, seat: true, headDrop: 2, legL: 1, legR: -1, armL: 0, armR: 0 }
  ];

  const baseY = 25;
  const idleBob = frame === 1 ? -1 : 0;
  const data =
    frame >= 6
      ? sitFrames[frame - 6]
      : frame >= 2
        ? walkFrames[frame - 2]
        : { legL: 0, legR: 0, armL: 0, armR: 0, bodyBob: idleBob, lean: 0 };

  const headTop = 3 + (data.headDrop ?? 0) + data.bodyBob;
  const torsoTop = 11 + data.bodyBob;
  const hipsY = 18 + data.bodyBob;
  const shoeY = baseY;

  fill(ctx, ox + 7, headTop, 10, 8, options.skinHex);
  outline(ctx, ox + 7, headTop, 10, 8, outlineColor);
  fill(ctx, ox + 7, headTop, 10, 3, options.hairHex);
  fill(ctx, ox + 7, headTop + 2, 2, 3, options.hairHex);

  fill(ctx, ox + 10, headTop + 3, 1, 1, outlineColor);
  fill(ctx, ox + 13, headTop + 3, 1, 1, outlineColor);
  fill(ctx, ox + 11, headTop + 5, 2, 1, outlineColor);

  fill(ctx, ox + 8, torsoTop, 8, 8, shirt);
  outline(ctx, ox + 8, torsoTop, 8, 8, outlineColor);

  fill(ctx, ox + 6 + data.armL, torsoTop + 1, 2, 7, options.skinHex);
  outline(ctx, ox + 6 + data.armL, torsoTop + 1, 2, 7, outlineColor);
  fill(ctx, ox + 16 + data.armR, torsoTop + 1, 2, 7, options.skinHex);
  outline(ctx, ox + 16 + data.armR, torsoTop + 1, 2, 7, outlineColor);

  if (data.seat) {
    fill(ctx, ox + 8, hipsY, 4, 3, pants);
    outline(ctx, ox + 8, hipsY, 4, 3, outlineColor);
    fill(ctx, ox + 12, hipsY, 4, 3, pants);
    outline(ctx, ox + 12, hipsY, 4, 3, outlineColor);

    fill(ctx, ox + 10, hipsY + 3, 6, 3, pants);
    outline(ctx, ox + 10, hipsY + 3, 6, 3, outlineColor);
    fill(ctx, ox + 10, hipsY + 6, 6, 2, shoe);
    outline(ctx, ox + 10, hipsY + 6, 6, 2, outlineColor);
  } else {
    fill(ctx, ox + 8 + data.legL, hipsY, 3, 7, pants);
    outline(ctx, ox + 8 + data.legL, hipsY, 3, 7, outlineColor);
    fill(ctx, ox + 13 + data.legR, hipsY, 3, 7, pants);
    outline(ctx, ox + 13 + data.legR, hipsY, 3, 7, outlineColor);

    fill(ctx, ox + 7 + data.legL, shoeY, 4, 2, shoe);
    outline(ctx, ox + 7 + data.legL, shoeY, 4, 2, outlineColor);
    fill(ctx, ox + 12 + data.legR, shoeY, 4, 2, shoe);
    outline(ctx, ox + 12 + data.legR, shoeY, 4, 2, outlineColor);
  }
}

export function ensureCharacterSpriteSheet(scene: Phaser.Scene, key: string, options: SpriteOptions) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const canvas = document.createElement("canvas");
  canvas.width = FRAME_WIDTH * FRAME_COUNT;
  canvas.height = FRAME_HEIGHT;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo crear el canvas del personaje.");
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    drawHumanFrame(ctx, frame, options);
  }

  scene.textures.addSpriteSheet(key, canvas, {
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT
  });

  const idleKey = `${key}-idle`;
  const walkKey = `${key}-walk`;
  const sitKey = `${key}-sit`;

  if (scene.anims.exists(idleKey)) scene.anims.remove(idleKey);
  if (scene.anims.exists(walkKey)) scene.anims.remove(walkKey);
  if (scene.anims.exists(sitKey)) scene.anims.remove(sitKey);

  scene.anims.create({
    key: idleKey,
    frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 1 }),
    frameRate: 2,
    repeat: -1
  });

  scene.anims.create({
    key: walkKey,
    frames: scene.anims.generateFrameNumbers(key, { start: 2, end: 5 }),
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: sitKey,
    frames: scene.anims.generateFrameNumbers(key, { start: 6, end: 7 }),
    frameRate: 3,
    repeat: -1
  });

  return {
    textureKey: key,
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    idleKey,
    walkKey,
    sitKey
  };
}
