// @ts-nocheck
import Phaser from "phaser";
import { BathroomScene, type CharacterConfig } from "./scenes/BathroomScene";

type GameCallbacks = {
  onPoopMidpoint: () => void;
  onPoopFinished: () => void;
};

export class CaganometroGame {
  private game: Phaser.Game;
  private scene: BathroomScene;

  constructor(parent: string, callbacks: GameCallbacks) {
    this.scene = new BathroomScene(callbacks);
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 960,
      height: 540,
      parent,
      backgroundColor: "#b5ecc9",
      pixelArt: true,
      antialias: false,
      scene: [this.scene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    });
  }

  updateCharacter(config: CharacterConfig) {
    this.scene.updateCharacter(config);
  }

  playPoopAnimation() {
    this.scene.playPoopAnimation();
  }

  destroy() {
    this.game.destroy(true);
  }
}

