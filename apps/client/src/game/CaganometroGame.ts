import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import { GameEventBus } from "./GameEventBus";
import { primeFartSound } from "./fartSound";
import { OfficeBathroomScene } from "./scenes/OfficeBathroomScene";
import type { SceneCharacter } from "./types";

type GameCallbacks = {
  onPoopMidpoint: (characterId: number) => Promise<void>;
  onPoopError?: (error: Error) => void;
  onPoopFinished?: (characterId: number) => void;
  onSceneReady?: () => void;
};

export class CaganometroGame {
  private readonly game: Phaser.Game;
  private readonly scene: OfficeBathroomScene;
  private readonly bus = new GameEventBus();
  private readonly cleanupListeners: Array<() => void> = [];
  private readonly resizeObserver: ResizeObserver;
  private requestInFlight = false;

  constructor(parent: string, callbacks: GameCallbacks) {
    this.scene = new OfficeBathroomScene(this.bus);
    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent,
      backgroundColor: "#b5ecc9",
      render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
      },
      scene: [this.scene],
      scale: {
        mode: Phaser.Scale.NONE,
        autoRound: true
      }
    });

    this.cleanupListeners.push(
      this.bus.on("scene:ready", () => callbacks.onSceneReady?.()),
      this.bus.on("poop:midpoint", ({ characterId }) => {
        if (this.requestInFlight) return;
        this.requestInFlight = true;
        void callbacks.onPoopMidpoint(characterId).then(
          () => this.bus.emit("poop:success", { characterId }),
          (error: unknown) => {
            const nextError = error instanceof Error ? error : new Error("No se pudo registrar la caca.");
            callbacks.onPoopError?.(nextError);
            this.bus.emit("poop:error", { characterId, error: nextError });
          }
        ).finally(() => {
          this.requestInFlight = false;
        });
      }),
      this.bus.on("poop:finished", ({ characterId }) => callbacks.onPoopFinished?.(characterId))
    );

    const parentElement = document.getElementById(parent);
    this.resizeObserver = new ResizeObserver(() => this.applyIntegerScale(parentElement));
    if (parentElement) this.resizeObserver.observe(parentElement);
    requestAnimationFrame(() => this.applyIntegerScale(parentElement));
  }

  updateRoster(roster: SceneCharacter[], activeCharacterId: number | null) {
    this.scene.updateRoster(roster, activeCharacterId);
  }

  announceCharacterSelection(characterId: number, name: string) {
    this.bus.emit("character:selected", { characterId, name });
  }

  playPoopAnimation(characterId: number) {
    if (this.requestInFlight) return false;
    primeFartSound();
    return this.scene.playPoopAnimation(characterId);
  }

  destroy() {
    this.resizeObserver.disconnect();
    this.cleanupListeners.forEach((cleanup) => cleanup());
    this.bus.destroy();
    this.game.destroy(true);
  }

  private applyIntegerScale(parent: HTMLElement | null) {
    if (!parent || !this.game.canvas) return;
    const zoom = Math.max(1, Math.min(3, Math.floor(parent.clientWidth / GAME_WIDTH)));
    const canvas = this.game.canvas;
    canvas.style.width = `${GAME_WIDTH * zoom}px`;
    canvas.style.height = `${GAME_HEIGHT * zoom}px`;
    canvas.style.imageRendering = "pixelated";
  }
}
