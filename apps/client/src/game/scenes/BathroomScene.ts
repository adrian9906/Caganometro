// @ts-nocheck
import Phaser from "phaser";
import { ensureCharacterSpriteSheet } from "../pixelSpriteSheet";

export type CharacterConfig = {
  hairColor: string;
  skinColor: string;
  scale: number;
};

type SceneEvents = {
  onPoopMidpoint?: () => void;
  onPoopFinished?: () => void;
};

export class BathroomScene extends Phaser.Scene {
  private eventsBridge: SceneEvents;
  private player?: Phaser.GameObjects.Container;
  private heroSprite?: Phaser.GameObjects.Sprite;
  private heroShadow?: Phaser.GameObjects.Ellipse;
  private poopText?: Phaser.GameObjects.Text;
  private isReady = false;
  private isAnimating = false;
  private pendingCharacterRefresh = false;
  private roomPlatformY = 388;
  private seatY = 326;
  private spriteMeta?: { textureKey: string; idleKey: string; walkKey: string; sitKey: string };
  private toiletX = 748;
  private homeX = 228;
  private floorY = 388;
  private currentConfig: CharacterConfig = {
    hairColor: "#1b1c1c",
    skinColor: "#f3c6a5",
    scale: 1.82
  };

  constructor(eventsBridge: SceneEvents) {
    super("bathroom");
    this.eventsBridge = eventsBridge;
  }

  create() {
    this.cameras.main.setBackgroundColor("#b5ecc9");
    this.drawBackground();
    this.player = this.createCharacter(this.homeX, this.floorY);
    this.poopText = this.add
      .text(510, 180, "PLOP!", {
        fontFamily: "Space Mono",
        fontSize: "34px",
        color: "#6c2f00",
        stroke: "#f7d6b4",
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.isReady = true;
  }

  updateCharacter(config: CharacterConfig) {
    this.currentConfig = config;

    if (!this.isReady) {
      return;
    }

    if (this.isAnimating) {
      this.pendingCharacterRefresh = true;
      return;
    }

    this.player?.destroy();
    this.player = this.createCharacter(this.homeX, this.floorY);
  }

  playPoopAnimation() {
    if (!this.isReady || !this.player || !this.heroSprite || !this.heroShadow || this.tweens.isTweening(this.player)) {
      return;
    }

    this.isAnimating = true;
    const player = this.player;
    const shadow = this.heroShadow;
    const sprite = this.heroSprite;
    const startScale = player.scaleX;
    const targetScale = this.currentConfig.scale;
    const toiletApproachX = this.toiletX - 96;
    const seatX = this.toiletX - 28;

    this.setAnimation("walk");

    this.tweens.add({
      targets: player,
      x: toiletApproachX,
      duration: 960,
      ease: "Linear",
      onUpdate: () => {
        shadow.setScale(1.25, 1);
      },
      onComplete: () => {
        this.tweens.add({
          targets: player,
          x: seatX,
          y: this.seatY,
          duration: 380,
          ease: "Sine.easeOut",
          onStart: () => {
            this.setAnimation("walk");
          },
          onUpdate: () => {
            shadow.setScale(0.9, 0.8);
          },
          onComplete: () => {
            this.setAnimation("sit");
            sprite.setY(-2);

            this.tweens.add({
              targets: player,
              y: this.seatY + 6,
              duration: 220,
              ease: "Quad.easeOut",
              onComplete: () => {
                sprite.setAngle(-8);
                this.eventsBridge.onPoopMidpoint?.();
                this.showPoopText();

                this.time.delayedCall(430, () => {
                  sprite.setAngle(0);
                  sprite.setY(-8);
                  this.tweens.add({
                    targets: player,
                    scaleX: targetScale,
                    scaleY: targetScale,
                    duration: 420,
                    ease: "Back.easeOut",
                    onUpdate: () => {
                      shadow.setScale(1.15, 0.95);
                    }
                  });
                });

                this.time.delayedCall(620, () => {
                  this.tweens.add({
                    targets: player,
                    y: this.seatY,
                    duration: 180,
                    ease: "Quad.easeIn",
                    onComplete: () => {
                      this.setAnimation("walk");
                      this.tweens.add({
                        targets: player,
                        x: toiletApproachX,
                        y: this.floorY,
                        duration: 380,
                        ease: "Sine.easeIn",
                        onUpdate: () => {
                        shadow.setScale(1.05, 0.92);
                        },
                        onComplete: () => {
                          this.tweens.add({
                            targets: player,
                            x: this.homeX,
                            duration: 960,
                            ease: "Linear",
                            onUpdate: () => {
                              shadow.setScale(1.35, 1.05);
                            },
                            onComplete: () => {
                              shadow.setScale(0.92, 0.86);
                              this.setAnimation("idle");
                              this.isAnimating = false;
                              if (this.pendingCharacterRefresh) {
                                this.pendingCharacterRefresh = false;
                                this.player?.destroy();
                                this.player = this.createCharacter(this.homeX, this.floorY);
                              }
                              if (!this.pendingCharacterRefresh && startScale !== targetScale) {
                                this.tweens.add({
                                  targets: shadow,
                                  scaleX: 0.98,
                                  scaleY: 0.88,
                                  duration: 160,
                                  yoyo: true
                                });
                              }
                              this.eventsBridge.onPoopFinished?.();
                            }
                          });
                        }
                      });
                    }
                  });
                });
              }
            });
          }
        });
      }
    });
  }

  private showPoopText() {
    if (!this.poopText) {
      return;
    }

    this.poopText.setAlpha(1).setScale(0.5).setY(220);
    this.tweens.add({
      targets: this.poopText,
      alpha: 0,
      scale: 1.25,
      y: 126,
      duration: 850,
      ease: "Back.easeOut"
    });
  }

  private setAnimation(mode: "idle" | "walk" | "sit") {
    const sprite = this.player?.getByName("hero");

    if (!sprite || !this.spriteMeta) {
      return;
    }

    const key =
      mode === "walk"
        ? this.spriteMeta.walkKey
        : mode === "sit"
          ? this.spriteMeta.sitKey
          : this.spriteMeta.idleKey;

    sprite.play(key, true);
  }

  private drawBackground() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0xcaf6d5, 1);
    graphics.fillRect(0, 0, 960, 540);

    graphics.fillStyle(0xfbf9f8, 1);
    graphics.fillRect(80, 80, 800, 330);
    graphics.lineStyle(3, 0xb4c8ba, 1);
    for (let x = 80; x <= 880; x += 26) {
      graphics.lineBetween(x, 80, x, 410);
    }
    for (let y = 80; y <= 410; y += 26) {
      graphics.lineBetween(80, y, 880, y);
    }

    graphics.fillStyle(0x7a5537, 1);
    graphics.fillRect(80, 410, 800, 70);
    graphics.fillStyle(0x5c3a22, 1);
    graphics.fillRect(80, 470, 800, 70);
    graphics.fillStyle(0x2f2f2f, 1);
    graphics.fillRect(80, 410, 800, 8);

    this.add.rectangle(160, 180, 110, 180, 0xe4f0ea).setStrokeStyle(6, 0x2f2f2f);
    this.add.rectangle(160, 180, 74, 120, 0xa7d6c8).setStrokeStyle(4, 0x2f2f2f);
    this.add.rectangle(300, 292, 90, 118, 0xf3eee7).setStrokeStyle(6, 0x2f2f2f);
    this.add.rectangle(300, 270, 62, 22, 0xb4d5c2).setStrokeStyle(4, 0x2f2f2f);
    this.add.rectangle(300, 344, 76, 12, 0x2f2f2f, 0.15);
    this.add.rectangle(120, 270, 50, 140, 0xa76c3c).setStrokeStyle(6, 0x2f2f2f);
    this.add.rectangle(120, 214, 50, 30, 0x70411e).setStrokeStyle(6, 0x2f2f2f);

    const toilet = this.add.container(this.toiletX, 292);
    const platform = this.add.rectangle(-6, 76, 120, 20, 0xd8cdc4).setStrokeStyle(6, 0x2f2f2f);
    const bowl = this.add.rectangle(0, 8, 112, 72, 0xf5f5f5).setStrokeStyle(6, 0x2f2f2f);
    const tank = this.add.rectangle(12, -54, 72, 58, 0xffffff).setStrokeStyle(6, 0x2f2f2f);
    const seat = this.add.rectangle(-8, -6, 90, 18, 0xd9d9d9).setStrokeStyle(4, 0x2f2f2f);
    const lid = this.add.rectangle(-2, -18, 74, 10, 0xefefef).setStrokeStyle(4, 0x2f2f2f);
    const base = this.add.rectangle(8, 52, 58, 58, 0xffffff).setStrokeStyle(6, 0x2f2f2f);
    const step = this.add.rectangle(-68, 67, 38, 16, 0xeadfd7).setStrokeStyle(4, 0x2f2f2f);
    toilet.add([platform, step, base, bowl, tank, seat, lid]);

    this.add.rectangle(480, 44, 860, 70, 0xfbf9f8).setStrokeStyle(6, 0x2f2f2f).setDepth(2);
    graphics.fillStyle(0x1b1c1c, 1);
    graphics.fillRect(50, 78, 820, 4);
  }

  private createCharacter(x: number, y: number) {
    const textureKey = `hero-${this.currentConfig.hairColor.replace("#", "")}-${this.currentConfig.skinColor.replace("#", "")}`;
    this.spriteMeta = ensureCharacterSpriteSheet(this, textureKey, {
      hairHex: this.currentConfig.hairColor,
      skinHex: this.currentConfig.skinColor
    });

    const container = this.add.container(x, y).setScale(this.currentConfig.scale);
    const shadow = this.add.ellipse(0, 0, 26, 7, 0x2f2f2f, 0.22).setName("shadow");
    const sprite = this.add.sprite(0, -8, this.spriteMeta.textureKey, 0).setName("hero");
    sprite.setOrigin(0.5, 1);
    sprite.setScale(1.58);
    sprite.play(this.spriteMeta.idleKey);

    container.add([shadow, sprite]);
    this.heroShadow = shadow;
    this.heroSprite = sprite;
    return container;
  }
}
