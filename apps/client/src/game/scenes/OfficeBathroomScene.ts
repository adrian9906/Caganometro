import Phaser from "phaser";
import {
  ANIMATION_TIMING,
  BATHROOM_DOOR_X,
  GAME_COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  OFFICE_AISLE_Y,
  OFFICE_BATHROOM_X,
  OFFICE_SEATS,
  TOILET_SEAT_Y,
  TOILET_X,
  getVisualScale
} from "../constants";
import { GameEventBus } from "../GameEventBus";
import { playFartSound } from "../fartSound";
import { ensureCharacterSpriteSheet } from "../pixelSpriteSheet";
import type { SceneCharacter } from "../types";

type AnimationMeta = ReturnType<typeof ensureCharacterSpriteSheet>;

type CharacterView = {
  character: SceneCharacter;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  meta: AnimationMeta;
  seatIndex: number;
  homeX: number;
  homeY: number;
};

type PendingRoster = {
  roster: SceneCharacter[];
  activeCharacterId: number | null;
};

const SHIRT_PALETTE = ["#8b4513", "#235b75", "#8b3654", "#6d5a25", "#4c5f35", "#704a80"];
const PANTS_PALETTE = ["#355f48", "#344c68", "#593d32"];
const PIXEL_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  Ñ: ["01010", "00100", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"]
};

export class OfficeBathroomScene extends Phaser.Scene {
  private readonly gameBus: GameEventBus;
  private characterViews = new Map<number, CharacterView>();
  private roster: SceneCharacter[] = [];
  private activeCharacterId: number | null = null;
  private pendingRoster: PendingRoster | null = null;
  private chairs: Phaser.GameObjects.Rectangle[] = [];
  private door?: Phaser.GameObjects.Rectangle;
  private poopText?: Phaser.GameObjects.Text;
  private isReady = false;
  private isAnimating = false;

  constructor(gameBus: GameEventBus) {
    super("office-bathroom");
    this.gameBus = gameBus;
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME_COLORS.wall);
    this.drawBackground();
    this.drawOfficeFurniture();
    this.drawBathroom();
    this.poopText = this.add
      .text(276, 76, "PRRRT!", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#6c2f00",
        stroke: "#ffc29f",
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(900)
      .setAlpha(0);
    this.isReady = true;
    this.rebuildRoster();
    this.gameBus.emit("scene:ready", undefined);
  }

  updateRoster(roster: SceneCharacter[], activeCharacterId: number | null) {
    if (this.isAnimating) {
      this.pendingRoster = { roster, activeCharacterId };
      return;
    }
    this.roster = roster;
    this.activeCharacterId = activeCharacterId;
    if (this.isReady) this.rebuildRoster();
  }

  playPoopAnimation(characterId: number) {
    const view = this.characterViews.get(characterId);
    if (!this.isReady || this.isAnimating || !view || view.character.source !== "owned") return false;
    this.isAnimating = true;
    void this.runPoopSequence(view);
    return true;
  }

  private async runPoopSequence(view: CharacterView) {
    const chair = this.chairs[view.seatIndex];
    const seat = OFFICE_SEATS[view.seatIndex];
    const chairPush = seat.facing === "right" ? -5 : 5;
    view.container.setDepth(600);
    this.playAnimation(view, "idle");

    try {
      await Promise.all([
        this.tweenTo(chair, { x: chair.x + chairPush, duration: ANIMATION_TIMING.chairPush, ease: "Quad.easeOut" }),
        this.tweenTo(view.container, {
          scaleX: view.container.scaleX,
          scaleY: view.container.scaleY,
          y: view.homeY - 2,
          duration: ANIMATION_TIMING.stand,
          ease: "Back.easeOut"
        })
      ]);

      this.playAnimation(view, "walk");
      await this.walkTo(view, view.homeX, OFFICE_AISLE_Y, ANIMATION_TIMING.walkVertical);
      await this.walkTo(view, BATHROOM_DOOR_X - 8, OFFICE_AISLE_Y, ANIMATION_TIMING.walkOffice);
      await this.tweenTo(this.door, { alpha: 0.22, duration: 120, ease: "Linear" });
      await this.walkTo(view, TOILET_X - 8, TOILET_SEAT_Y, ANIMATION_TIMING.enterBathroom);

      view.sprite.stop();
      view.sprite.setFrame(8).setFlipX(false);
      await this.tweenTo(view.container, {
        x: TOILET_X - 4,
        y: TOILET_SEAT_Y + 2,
        duration: ANIMATION_TIMING.sit,
        ease: "Quad.easeOut"
      });
      view.sprite.setFrame(10);
      await this.delay(ANIMATION_TIMING.strain);

      const result = this.waitForPoopResult(view.character.id);
      playFartSound();
      this.showPoopImpact();
      this.reactCoworkers(view.character.id);
      this.gameBus.emit("poop:midpoint", { characterId: view.character.id });
      await Promise.all([result, this.delay(ANIMATION_TIMING.impactHold)]);

      view.sprite.setFrame(8);
      await this.tweenTo(view.container, {
        x: BATHROOM_DOOR_X - 8,
        y: OFFICE_AISLE_Y,
        duration: ANIMATION_TIMING.returnBathroom,
        ease: "Sine.easeInOut"
      });
      this.playAnimation(view, "walk");
      await this.tweenTo(this.door, { alpha: 1, duration: 120, ease: "Linear" });
      await this.walkTo(view, view.homeX, OFFICE_AISLE_Y, ANIMATION_TIMING.returnOffice);
      await this.walkTo(view, view.homeX, view.homeY, ANIMATION_TIMING.returnVertical);
      view.sprite.setFlipX(seat.facing === "left");
      this.playAnimation(view, "work");
      await this.tweenTo(chair, { x: chair.x - chairPush, duration: ANIMATION_TIMING.chairReset, ease: "Quad.easeIn" });
    } finally {
      this.isAnimating = false;
      this.applyPendingRoster();
      this.gameBus.emit("poop:finished", { characterId: view.character.id });
    }
  }

  private waitForPoopResult(characterId: number) {
    return new Promise<void>((resolve) => {
      let settled = false;
      const settle = (payload: { characterId: number }) => {
        if (settled || payload.characterId !== characterId) return;
        settled = true;
        offSuccess();
        offError();
        resolve();
      };
      const offSuccess = this.gameBus.on("poop:success", settle);
      const offError = this.gameBus.on("poop:error", settle);
    });
  }

  private applyPendingRoster() {
    if (!this.pendingRoster) return;
    this.roster = this.pendingRoster.roster;
    this.activeCharacterId = this.pendingRoster.activeCharacterId;
    this.pendingRoster = null;
    this.rebuildRoster();
  }

  private walkTo(view: CharacterView, x: number, y: number, duration: number) {
    view.sprite.setFlipX(x < view.container.x);
    return this.tweenTo(view.container, { x, y, duration, ease: "Linear" });
  }

  private tweenTo(
    targets: Phaser.Types.Tweens.TweenBuilderConfig["targets"],
    config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, "targets" | "onComplete">
  ) {
    if (!targets) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.tweens.add({ ...config, targets, onComplete: () => resolve() });
    });
  }

  private delay(duration: number) {
    return new Promise<void>((resolve) => this.time.delayedCall(duration, resolve));
  }

  private playAnimation(view: CharacterView, mode: "idle" | "walk" | "work") {
    view.sprite.play(view.meta[mode], true);
  }

  private reactCoworkers(activeId: number) {
    for (const [characterId, view] of this.characterViews) {
      if (characterId === activeId) continue;
      view.sprite.play(view.meta.reaction, true);
      this.tweens.add({
        targets: view.container,
        y: view.homeY - 2,
        duration: ANIMATION_TIMING.reaction / 2,
        yoyo: true,
        ease: "Quad.easeOut"
      });
    }
  }

  private showPoopImpact() {
    if (this.poopText) {
      this.poopText.setAlpha(1).setY(86);
      this.tweens.add({
        targets: this.poopText,
        alpha: 0,
        y: 68,
        duration: 720,
        ease: "Quad.easeOut"
      });
    }

    const puffs = [
      { x: 273, y: 123 },
      { x: 282, y: 116 },
      { x: 290, y: 123 },
      { x: 278, y: 108 },
      { x: 287, y: 102 }
    ];
    for (const puff of puffs) {
      const particle = this.add.rectangle(puff.x, puff.y, 3, 3, GAME_COLORS.odor).setDepth(850);
      this.tweens.add({
        targets: particle,
        y: puff.y - 14,
        alpha: 0,
        duration: 680,
        ease: "Sine.easeOut",
        onComplete: () => particle.destroy()
      });
    }
  }

  private rebuildRoster() {
    for (const view of this.characterViews.values()) view.container.destroy(true);
    this.characterViews.clear();

    const owned = this.roster.filter((character) => character.source === "owned").sort((a, b) => a.id - b.id);
    const active = owned.find((character) => character.id === this.activeCharacterId);
    const visibleOwned = owned.slice(0, OFFICE_SEATS.length);
    if (active && !visibleOwned.some((character) => character.id === active.id)) {
      visibleOwned[visibleOwned.length - 1] = active;
      visibleOwned.sort((a, b) => a.id - b.id);
    }

    visibleOwned.forEach((character, index) => this.createCharacterView(character, index));
  }

  private createCharacterView(character: SceneCharacter, seatIndex: number) {
    const seat = OFFICE_SEATS[seatIndex];
    if (!seat) return;
    const textureKey = `office-${character.source}-${character.id}-${character.hairHex.replace("#", "")}-${character.skinHex.replace("#", "")}`;
    const meta = ensureCharacterSpriteSheet(this, textureKey, {
      hairHex: character.hairHex,
      skinHex: character.skinHex,
      height: character.height,
      shirtHex: SHIRT_PALETTE[character.id % SHIRT_PALETTE.length],
      pantsHex: PANTS_PALETTE[character.id % PANTS_PALETTE.length]
    });
    const container = this.add.container(seat.x, seat.y).setScale(getVisualScale(character.size)).setDepth(seat.y);
    const shadow = this.add.ellipse(0, 2, 18, 4, GAME_COLORS.ink, 0.18);
    const sprite = this.add
      .sprite(0, 3, meta.textureKey, 8)
      .setOrigin(0.5, 1)
      .setFlipX(seat.facing === "left");
    sprite.play(meta.work);
    container.add([shadow, sprite]);

    this.characterViews.set(character.id, {
      character,
      container,
      sprite,
      shadow,
      meta,
      seatIndex,
      homeX: seat.x,
      homeY: seat.y
    });

    if (character.id === this.activeCharacterId) {
      const marker = this.add.rectangle(0, -31, 26, 3, GAME_COLORS.accent).setName("active-marker");
      container.add(marker);
    }
  }

  private drawBackground() {
    const graphics = this.add.graphics();
    graphics.fillStyle(GAME_COLORS.wall, 1).fillRect(0, 0, GAME_WIDTH, 116);
    graphics.fillStyle(GAME_COLORS.floor, 1).fillRect(0, 116, GAME_WIDTH, 64);
    graphics.fillStyle(GAME_COLORS.floorDark, 1);
    for (let y = 116; y < GAME_HEIGHT; y += 8) graphics.fillRect(0, y, GAME_WIDTH, 1);
    for (let x = 0; x < GAME_WIDTH; x += 16) graphics.fillRect(x, 116, 1, 64);

    // Alfombra central en bandas rectas: su silueta ovalada organiza los puestos
    // como una herradura sin introducir bordes suavizados en el pixel art.
    graphics.fillStyle(0x48605a, 1).fillRect(66, 72, 104, 54);
    graphics.fillRect(55, 82, 126, 34);
    graphics.fillStyle(0x6f8b7f, 1).fillRect(69, 76, 98, 46);
    graphics.fillRect(59, 86, 118, 26);
    graphics.fillStyle(0x8eaa9d, 1).fillRect(78, 84, 80, 2);
    graphics.fillRect(72, 111, 92, 2);

    graphics.fillStyle(GAME_COLORS.wallShadow, 1).fillRect(0, 24, OFFICE_BATHROOM_X, 3);
    graphics.fillStyle(GAME_COLORS.paper, 1).fillRect(13, 7, 90, 14);
    graphics.lineStyle(2, GAME_COLORS.ink, 1).strokeRect(13, 7, 90, 14);
    this.drawPixelLabel("CAGANOMETRO HQ", 58, 14, 0x6c2f00);

    graphics.fillStyle(0xfff2a6, 1).fillRect(20, 31, 34, 15);
    graphics.fillStyle(0xfbf9f8, 1).fillRect(24, 34, 26, 9);
    graphics.fillStyle(0x7bb4cc, 1).fillRect(137, 31, 44, 17);
    graphics.fillStyle(GAME_COLORS.ink, 1).fillRect(141, 35, 36, 2);
    graphics.fillRect(141, 40, 22, 2);
  }

  private drawOfficeFurniture() {
    this.chairs = [];
    OFFICE_SEATS.forEach((seat, index) => {
      const direction = seat.facing === "right" ? 1 : -1;
      const chair = this.add
        .rectangle(seat.x - direction * 4, seat.y + 3, 11, 15, 0x48605a)
        .setStrokeStyle(1, GAME_COLORS.ink)
        .setDepth(seat.y - 2);
      this.chairs[index] = chair;

      const monitorX = seat.deskX + direction * 9;
      const keyboardX = seat.deskX - direction * 4;
      const towerX = seat.deskX + direction * 11;

      // Puesto lateral: tablero estrecho, monitor de perfil, teclado y torre.
      this.add
        .rectangle(seat.deskX, seat.deskY, 34, 6, GAME_COLORS.desk)
        .setStrokeStyle(1, GAME_COLORS.ink)
        .setDepth(seat.y + 2);
      this.add.rectangle(seat.deskX - direction * 12, seat.deskY + 9, 3, 18, GAME_COLORS.deskLight).setDepth(seat.y + 1);
      this.add.rectangle(seat.deskX + direction * 12, seat.deskY + 9, 3, 18, GAME_COLORS.deskLight).setDepth(seat.y + 1);

      this.add
        .rectangle(towerX, seat.deskY + 10, 7, 13, GAME_COLORS.screenDark)
        .setStrokeStyle(1, GAME_COLORS.ink)
        .setDepth(seat.y + 1);
      this.add.rectangle(towerX, seat.deskY + 7, 2, 2, GAME_COLORS.screen).setDepth(seat.y + 2);

      this.add
        .rectangle(monitorX, seat.deskY - 10, 5, 15, GAME_COLORS.screenDark)
        .setStrokeStyle(1, GAME_COLORS.ink)
        .setDepth(seat.y + 1);
      const screen = this.add
        .rectangle(monitorX - direction, seat.deskY - 10, 2, 11, GAME_COLORS.screen)
        .setDepth(seat.y + 2);
      this.add.rectangle(monitorX, seat.deskY - 1, 2, 4, GAME_COLORS.ink).setDepth(seat.y + 1);
      this.add.rectangle(monitorX - direction * 2, seat.deskY + 1, 7, 2, GAME_COLORS.ink).setDepth(seat.y + 2);
      this.add.rectangle(keyboardX, seat.deskY - 4, 9, 3, 0xd9c9b6).setDepth(seat.y + 3);

      this.tweens.add({
        targets: screen,
        alpha: 0.5,
        duration: 540 + index * 45,
        yoyo: true,
        repeat: -1,
        ease: "Stepped"
      });
    });

    this.add.rectangle(210, 82, 17, 61, 0x6d5842).setStrokeStyle(1, GAME_COLORS.ink);
    for (let y = 61; y <= 103; y += 14) this.add.rectangle(210, y, 13, 2, GAME_COLORS.ink, 0.35);
    this.add.rectangle(218, 133, 8, 29, 0x4f784d).setStrokeStyle(1, GAME_COLORS.ink);
    this.add.rectangle(214, 119, 14, 12, 0x70a963).setStrokeStyle(1, GAME_COLORS.ink);
  }

  private drawBathroom() {
    const graphics = this.add.graphics();
    graphics.fillStyle(GAME_COLORS.bathroom, 1).fillRect(OFFICE_BATHROOM_X, 0, GAME_WIDTH - OFFICE_BATHROOM_X, GAME_HEIGHT);
    graphics.fillStyle(GAME_COLORS.ink, 1).fillRect(OFFICE_BATHROOM_X, 0, 3, GAME_HEIGHT);
    graphics.fillStyle(GAME_COLORS.toiletShadow, 1);
    for (let x = OFFICE_BATHROOM_X + 4; x < GAME_WIDTH; x += 12) graphics.fillRect(x, 98, 1, 82);
    for (let y = 98; y < GAME_HEIGHT; y += 12) graphics.fillRect(OFFICE_BATHROOM_X + 3, y, GAME_WIDTH - OFFICE_BATHROOM_X, 1);

    this.drawPixelLabel("BAÑO", 276, 14, GAME_COLORS.ink);
    this.door = this.add.rectangle(BATHROOM_DOOR_X, 73, 8, 48, 0x8b603c).setOrigin(0.5, 0).setStrokeStyle(1, GAME_COLORS.ink).setDepth(700);
    this.add.rectangle(301, 52, 22, 30, 0xa7d6c8).setStrokeStyle(2, GAME_COLORS.ink);
    this.add.rectangle(301, 52, 2, 28, GAME_COLORS.ink, 0.28);

    const toilet = this.add.container(TOILET_X, 136).setDepth(300);
    const tank = this.add.rectangle(7, -18, 16, 17, GAME_COLORS.toilet).setStrokeStyle(1, GAME_COLORS.ink);
    const bowl = this.add.rectangle(0, -2, 28, 13, GAME_COLORS.toilet).setStrokeStyle(1, GAME_COLORS.ink);
    const seat = this.add.rectangle(-2, -7, 25, 4, GAME_COLORS.toiletShadow).setStrokeStyle(1, GAME_COLORS.ink);
    const base = this.add.rectangle(5, 11, 13, 13, GAME_COLORS.toilet).setStrokeStyle(1, GAME_COLORS.ink);
    toilet.add([base, bowl, tank, seat]);

    this.add.rectangle(263, 126, 13, 17, 0xffffff).setStrokeStyle(1, GAME_COLORS.ink);
    this.add.rectangle(263, 126, 9, 10, 0xe7e7e7);
  }

  private drawPixelLabel(text: string, centerX: number, centerY: number, color: number) {
    const glyphs = [...text.toUpperCase()].map((character) => PIXEL_GLYPHS[character] ?? PIXEL_GLYPHS[" "]);
    const glyphWidth = 5;
    const spacing = 1;
    const totalWidth = glyphs.length * glyphWidth + Math.max(0, glyphs.length - 1) * spacing;
    const maxHeight = Math.max(...glyphs.map((glyph) => glyph.length));
    const startX = Math.round(centerX - totalWidth / 2);
    const startY = Math.round(centerY - maxHeight / 2);
    const graphics = this.add.graphics().setDepth(50);
    graphics.fillStyle(color, 1);

    glyphs.forEach((glyph, glyphIndex) => {
      const baselineOffset = maxHeight - glyph.length;
      glyph.forEach((row, rowIndex) => {
        [...row].forEach((pixel, columnIndex) => {
          if (pixel !== "1") return;
          graphics.fillRect(
            startX + glyphIndex * (glyphWidth + spacing) + columnIndex,
            startY + baselineOffset + rowIndex,
            1,
            1
          );
        });
      });
    });
  }
}
